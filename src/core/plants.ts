// Planting, growth through stages, flowering, moss spreading and watering.

import type { Content, PlantDef } from './content'
import { gardenAt, isTileOpen } from './gardens'
import { plantSuitability } from './environment'
import { nextId } from './game'
import { distance, entityAt, entityById, neighbours, setTerrain, terrainAt } from './grid'
import { addItems, hasItems, removeItems } from './inventory'
import { type ActionResult, checkPlacement } from './layout'
import { chance, pick } from './rng'
import { inSeason } from './seasons'
import type { StepContext } from './simulation'
import type { GameState, PlantEntity } from './state'

/** Growth speed never falls below this fraction, so poorly placed plants still grow. */
export const MIN_GROWTH_RATE = 0.35
export const WATER_BOOST = 1.5
export const WATER_DURATION_MS = 10 * 60_000
/** Species taking at least this long to mature get gentle progress reminders. */
export const SLOW_GROWING_SEC = 60 * 60

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

/** Whether a plant is in flower: old enough, and (once the seasons have begun) in its season. */
export function isFlowering(content: Content, plant: PlantEntity, state?: GameState): boolean {
  const def = content.plants[plant.defId]
  if (!def || def.nectar <= 0 || plant.stage < def.flowerStage) return false
  return !state || inSeason(state, def.flowerSeasons)
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

/** Milliseconds until the plant is fully grown at the current rate, or null if it already is. */
export function timeToMaturity(
  state: GameState,
  content: Content,
  plant: PlantEntity,
): number | null {
  const def = content.plants[plant.defId]
  const next = timeToNextStage(state, content, plant)
  if (!def || next === null) return null
  let laterMs = 0
  for (let i = plant.stage + 1; i < def.stages.length - 1; i++)
    laterMs += (def.stages[i]?.durationSec ?? 0) * 1000
  return next + laterMs / growthRate(state, content, plant)
}

/** Whether a species takes long enough to grow that the player is reminded of its progress. */
export function isSlowGrowing(content: Content, plantId: string): boolean {
  const stages = content.plants[plantId]?.stages ?? []
  return stages.reduce((n, s) => n + (s.durationSec ?? 0), 0) >= SLOW_GROWING_SEC
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

/** Watering reaches every plant within this many tiles of the one tapped (a 5 × 5 patch). */
export const WATER_REACH = 2

/** Whether a plant would benefit from water: still growing, and not watered already. */
export function isThirsty(content: Content, e: PlantEntity): boolean {
  const def = content.plants[e.defId]
  return !!def && !e.fixed && !isFinalStage(def, e.stage) && e.wateredMs <= 0
}

/** The thirsty plants a watering at this tile reaches, in the same garden. */
export function plantsToWater(state: GameState, content: Content, x: number, y: number) {
  const garden = gardenAt(content, x, y)
  return state.entities.filter(
    (e): e is PlantEntity =>
      e.kind === 'plant' &&
      Math.abs(e.x - x) <= WATER_REACH &&
      Math.abs(e.y - y) <= WATER_REACH &&
      gardenAt(content, e.x, e.y) === garden &&
      isThirsty(content, e),
  )
}

/** Waters the chosen plant and every other thirsty plant around it. */
export function water(state: GameState, content: Content, entityId: number): ActionResult {
  const entity = entityById(state, entityId)
  if (entity?.kind !== 'plant') return { ok: false, reason: 'Nothing to water' }
  const def = content.plants[entity.defId]
  if (!def || entity.fixed || isFinalStage(def, entity.stage))
    return { ok: false, reason: 'It is fully grown' }
  const plants = plantsToWater(state, content, entity.x, entity.y)
  if (plants.length === 0) return { ok: false, reason: 'Already watered' }
  for (const p of plants) p.wateredMs = WATER_DURATION_MS
  return { ok: true, events: [{ type: 'watered', entityId, count: plants.length }] }
}

/** System: grows plants through their stages. */
export function growPlants(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  for (const e of state.entities) {
    if (e.kind !== 'plant') continue
    if (e.harvestMs) e.harvestMs = Math.max(0, e.harvestMs - dtMs)
    if (e.fixed) continue
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
    if (isFinalStage(def, e.stage))
      state.stats.matured[e.defId] = (state.stats.matured[e.defId] ?? 0) + 1
    // Bigger plants cast more shade and cover, so suitability may change.
    state.layoutVersion++
    ctx.events.push({ type: 'plantStage', entityId: e.id, plantId: e.defId, stage: e.stage })
    if (def.nectar > 0 && e.stage === def.flowerStage) {
      state.stats.flowered++
      ctx.events.push({ type: 'flowering', entityId: e.id, plantId: e.defId })
    }
  }
}

/** Plants only spread where their own kind would do at least fairly well. */
const SPREAD_MIN_SUITABILITY = 0.5

/**
 * System: mature spreading plants slowly extend. Moss turns neighbouring
 * grass into moss; bamboo sends up a new young clump beside itself, until
 * enough of its kind are close by.
 */
export function spreadPlants(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  // Collect first: spreading changes the garden, which other plants read.
  const spreaders = state.entities.filter((e): e is PlantEntity => {
    if (e.kind !== 'plant') return false
    const spread = content.plants[e.defId]?.spread
    return !!spread && e.stage >= spread.minStage
  })
  for (const e of spreaders) {
    const spread = content.plants[e.defId]!.spread!
    if (!chance(state, spread.chancePerHour / 60, dtMs)) continue
    if (spread.mode === 'plant' && spread.maxNearby !== undefined) {
      const nearby = state.entities.filter(
        (o) => o.kind === 'plant' && o.defId === e.defId && distance(o, e) <= 1.5,
      )
      if (nearby.length > spread.maxNearby) continue
    }
    const candidates = neighbours(state, e.x, e.y).filter((n) => {
      if (!isTileOpen(state, content, n.x, n.y) || entityAt(state, n.x, n.y)) return false
      if (spread.mode === 'terrain' && terrainAt(state, n.x, n.y) !== 'grass') return false
      if (
        spread.mode === 'plant' &&
        !checkPlacement(state, content, { kind: 'plant', defId: e.defId }, n.x, n.y).ok
      ) {
        return false
      }
      if (spread.mode === 'plant' && spread.maxNearby !== undefined) {
        // Neither the new clump nor any clump beside it may end up too crowded.
        const max = spread.maxNearby
        const kin = (p: { x: number; y: number }) =>
          state.entities.filter(
            (o) => o.kind === 'plant' && o.defId === e.defId && distance(o, p) <= 1.5,
          )
        const around = kin(n)
        if (around.length > max || around.some((o) => kin(o).length > max)) return false
      }
      return plantSuitability(state, content, e.defId, n.x, n.y).score >= SPREAD_MIN_SUITABILITY
    })
    const target = pick(state, candidates)
    if (!target) continue
    if (spread.mode === 'terrain') {
      setTerrain(state, target.x, target.y, 'moss')
      ctx.events.push({ type: 'mossSpread', x: target.x, y: target.y })
      continue
    }
    const def = content.plants[e.defId]!
    const id = nextId(state)
    state.entities.push({
      id,
      kind: 'plant',
      defId: e.defId,
      x: target.x,
      y: target.y,
      stage: 0,
      progressMs: 0,
      produceMs: def.produces.map(() => 0),
      wateredMs: 0,
      fixed: false,
    })
    state.layoutVersion++
    ctx.events.push({ type: 'plantSpread', entityId: id, plantId: e.defId })
  }
}

/** Whether a plant can be harvested now, and if not, why. */
export function harvestStatus(
  content: Content,
  plant: PlantEntity,
): { kind: 'none' } | { kind: 'growing' } | { kind: 'recovering'; ms: number } | { kind: 'ready' } {
  const h = content.plants[plant.defId]?.harvest
  if (!h) return { kind: 'none' }
  if (plant.stage < h.minStage) return { kind: 'growing' }
  if (plant.harvestMs && plant.harvestMs > 0) return { kind: 'recovering', ms: plant.harvestMs }
  return { kind: 'ready' }
}

/** Harvests a mature plant by hand (for example, cutting bamboo canes). The plant is unharmed. */
export function harvest(state: GameState, content: Content, entityId: number): ActionResult {
  const plant = entityById(state, entityId)
  if (plant?.kind !== 'plant') return { ok: false, reason: 'Nothing to harvest' }
  const status = harvestStatus(content, plant)
  if (status.kind === 'none') return { ok: false, reason: 'Nothing to harvest' }
  if (status.kind === 'growing') return { ok: false, reason: 'Not ready to harvest yet' }
  if (status.kind === 'recovering') return { ok: false, reason: 'It needs time to recover' }
  const h = content.plants[plant.defId]!.harvest!
  const items = { [h.item]: h.amount }
  addItems(state, items)
  state.stats.gathered[h.item] = (state.stats.gathered[h.item] ?? 0) + h.amount
  plant.harvestMs = h.cooldownSec * 1000
  return { ok: true, events: [{ type: 'harvested', entityId, items }] }
}
