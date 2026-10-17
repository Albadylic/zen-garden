// Planting, growth through stages, flowering, moss spreading and watering.

import type { Content, PlantDef } from './content'
import { plantSuitability } from './environment'
import { nextId } from './game'
import { entityAt, entityById, neighbours, terrainAt, setTerrain } from './grid'
import { hasItems, removeItems } from './inventory'
import { type ActionResult, checkPlacement } from './layout'
import { chance, pick } from './rng'
import type { StepContext } from './simulation'
import type { GameState, PlantEntity } from './state'

/** Growth speed never falls below this fraction, so poorly placed plants still grow. */
export const MIN_GROWTH_RATE = 0.35
export const WATER_BOOST = 1.5
export const WATER_DURATION_MS = 10 * 60_000

const suitabilityCache = new WeakMap<GameState, Map<number, { version: number; score: number }>>()

/** Suitability score of a planted plant, cached until the layout changes. */
export function plantScore(state: GameState, content: Content, plant: PlantEntity): number {
  let cache = suitabilityCache.get(state)
  if (!cache) {
    cache = new Map()
    suitabilityCache.set(state, cache)
  }
  const hit = cache.get(plant.id)
  if (hit && hit.version === state.layoutVersion) return hit.score
  const score = plantSuitability(state, content, plant.defId, plant.x, plant.y, plant.id).score
  cache.set(plant.id, { version: state.layoutVersion, score })
  return score
}

/** Multiplier on growth and production from suitability and watering. */
export function growthRate(state: GameState, content: Content, plant: PlantEntity): number {
  if (plant.fixed) return 1
  const score = plantScore(state, content, plant)
  const base = MIN_GROWTH_RATE + (1 - MIN_GROWTH_RATE) * score
  return plant.wateredMs > 0 ? base * WATER_BOOST : base
}

export function isFinalStage(def: PlantDef, stage: number): boolean {
  return stage >= def.stages.length - 1
}

export function isFlowering(content: Content, plant: PlantEntity): boolean {
  const def = content.plants[plant.defId]
  return !!def && def.nectar > 0 && plant.stage >= def.flowerStage
}

/** Milliseconds until the next stage at the current rate, or null at the final stage. */
export function timeToNextStage(
  state: GameState,
  content: Content,
  plant: PlantEntity,
): number | null {
  const def = content.plants[plant.defId]
  const duration = def?.stages[plant.stage]?.durationSec
  if (!def || duration === undefined || isFinalStage(def, plant.stage)) return null
  return Math.max(0, (duration * 1000 - plant.progressMs) / growthRate(state, content, plant))
}

export function plant(
  state: GameState,
  content: Content,
  plantId: string,
  x: number,
  y: number,
): ActionResult {
  const def = content.plants[plantId]
  if (!def?.seedItem) return { ok: false, reason: 'This cannot be planted' }
  const cost = { [def.seedItem]: 1 }
  if (!hasItems(state, cost))
    return {
      ok: false,
      reason: `No ${content.items[def.seedItem]?.name.toLowerCase() ?? 'seeds'} left`,
    }
  const check = checkPlacement(state, content, { kind: 'plant', defId: plantId }, x, y)
  if (!check.ok) return check
  removeItems(state, cost)
  const id = nextId(state)
  state.entities.push({
    id,
    kind: 'plant',
    defId: plantId,
    x,
    y,
    stage: 0,
    progressMs: 0,
    produceMs: def.produces.map(() => 0),
    wateredMs: 0,
    fixed: false,
  })
  state.stats.planted[plantId] = (state.stats.planted[plantId] ?? 0) + 1
  state.layoutVersion++
  return {
    ok: true,
    events: [{ type: 'planted', entityId: id, plantId }],
    undo: { type: 'place', entityId: id, refund: cost },
  }
}

export function water(state: GameState, content: Content, entityId: number): ActionResult {
  const entity = entityById(state, entityId)
  if (entity?.kind !== 'plant') return { ok: false, reason: 'Nothing to water' }
  const def = content.plants[entity.defId]
  if (!def || entity.fixed || isFinalStage(def, entity.stage))
    return { ok: false, reason: 'It is fully grown' }
  if (entity.wateredMs > 0) return { ok: false, reason: 'Already watered' }
  entity.wateredMs = WATER_DURATION_MS
  return { ok: true, events: [] }
}

/** System: grows plants through their stages. */
export function growPlants(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  for (const e of state.entities) {
    if (e.kind !== 'plant' || e.fixed) continue
    const def = content.plants[e.defId]
    if (!def || isFinalStage(def, e.stage)) {
      e.wateredMs = 0
      continue
    }
    e.progressMs += dtMs * growthRate(state, content, e)
    e.wateredMs = Math.max(0, e.wateredMs - dtMs)
    const duration = (def.stages[e.stage]?.durationSec ?? 0) * 1000
    if (e.progressMs < duration) continue
    e.progressMs = isFinalStage(def, e.stage + 1) ? 0 : e.progressMs - duration
    e.stage++
    state.stats.grown[e.stage] = (state.stats.grown[e.stage] ?? 0) + 1
    // Bigger plants cast more shade and cover, so suitability may change.
    state.layoutVersion++
    ctx.events.push({ type: 'plantStage', entityId: e.id, plantId: e.defId, stage: e.stage })
    if (def.nectar > 0 && e.stage === def.flowerStage) {
      state.stats.flowered++
      ctx.events.push({ type: 'flowering', entityId: e.id, plantId: e.defId })
    }
  }
}

/** Moss only spreads onto grass where moss itself would do at least fairly well. */
const SPREAD_MIN_SUITABILITY = 0.5

/** System: mature moss slowly turns neighbouring damp, shaded grass into moss. */
export function spreadMoss(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  // Collect first: spreading changes terrain, which other plants read.
  const spreaders = state.entities.filter((e): e is PlantEntity => {
    if (e.kind !== 'plant') return false
    const spread = content.plants[e.defId]?.spread
    return !!spread && e.stage >= spread.minStage
  })
  for (const e of spreaders) {
    const spread = content.plants[e.defId]!.spread!
    if (!chance(state, spread.chancePerHour / 60, dtMs)) continue
    const candidates = neighbours(state, e.x, e.y).filter((n) => {
      if (terrainAt(state, n.x, n.y) !== 'grass' || entityAt(state, n.x, n.y)) return false
      return plantSuitability(state, content, e.defId, n.x, n.y).score >= SPREAD_MIN_SUITABILITY
    })
    const target = pick(state, candidates)
    if (!target) continue
    setTerrain(state, target.x, target.y, 'moss')
    ctx.events.push({ type: 'mossSpread', x: target.x, y: target.y })
  }
}
