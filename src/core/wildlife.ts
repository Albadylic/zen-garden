// Wildlife: arrival when the garden offers what a species needs, then
// autonomous behaviour (moving, feeding, resting, perching) until it leaves.

import type { Activity, Content, WildlifeDef } from './content'
import { isTileOpen } from './gardens'
import { structureSuitability } from './environment'
import { isFilled } from './feeders'
import { nextId } from './game'
import { distance, entityById, forEachTile, isOpenGround, terrainAt } from './grid'
import { isFlowering } from './plants'
import { chance, pick, random, randomRange } from './rng'
import type { StepContext } from './simulation'
import type { Creature, GameState, PlantEntity, StructureEntity } from './state'

/** Total nectar on offer from flowering plants. */
export function nectarAvailable(state: GameState, content: Content): number {
  let total = 0
  for (const e of state.entities) {
    if (e.kind === 'plant' && isFlowering(content, e)) total += content.plants[e.defId]!.nectar
  }
  return total
}

function flowers(state: GameState, content: Content): PlantEntity[] {
  return state.entities.filter(
    (e): e is PlantEntity => e.kind === 'plant' && isFlowering(content, e),
  )
}

/** Mature plants a perching species likes, including any it is especially drawn to. */
export function perchPlants(state: GameState, content: Content, def: WildlifeDef): PlantEntity[] {
  if (def.attraction.kind !== 'perch') return []
  const kinds = new Set([
    ...def.attraction.plants,
    ...(def.attraction.bonus ? [def.attraction.bonus.plant] : []),
  ])
  return state.entities.filter(
    (e): e is PlantEntity =>
      e.kind === 'plant' &&
      kinds.has(e.defId) &&
      e.stage >= (content.plants[e.defId]?.stages.length ?? 1) - 1 &&
      isTileOpen(state, content, e.x, e.y),
  )
}

/** Feeders of a kind that currently hold something. */
export function filledFeeders(
  state: GameState,
  content: Content,
  structureId: string,
): StructureEntity[] {
  return state.entities.filter(
    (e): e is StructureEntity =>
      e.kind === 'structure' &&
      e.defId === structureId &&
      isFilled(e) &&
      isTileOpen(state, content, e.x, e.y),
  )
}

/** Plants a visiting bird or butterfly might settle on for a moment. */
function perches(
  state: GameState,
  content: Content,
  near: { x: number; y: number },
  radius: number,
) {
  return state.entities.filter((e) => {
    if (distance(e, near) > radius) return false
    if (e.kind === 'plant') return (content.plants[e.defId]?.cover ?? 0) >= 0.3
    return e.kind === 'decoration' && !content.decorations[e.defId]?.flat
  })
}

/** Wall tiles of the open areas: where visitors come and go. */
function boundaryTiles(state: GameState, content: Content): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  forEachTile(state, (x, y, t) => {
    if (t === 'boundary' && isTileOpen(state, content, x, y)) out.push({ x, y })
  })
  return out
}

function nearestBoundary(state: GameState, content: Content, from: { x: number; y: number }) {
  let best = { x: 0, y: 0 }
  let bestD = Infinity
  for (const t of boundaryTiles(state, content)) {
    const d = distance(t, from)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}

/**
 * Where a resident settles at its shelter: ground creatures go inside; birds
 * perch beside it, so nothing ever appears to vanish next to them.
 */
export function homeSpot(
  def: WildlifeDef,
  home: { x: number; y: number },
): { x: number; y: number } {
  return def.movement === 'flying'
    ? { x: home.x + 0.92, y: home.y + 0.42 }
    : { x: home.x + 0.5, y: home.y + 0.5 }
}

/** Shelters this species could live in, with how well each suits it right now. */
export function sheltersFor(state: GameState, content: Content, def: WildlifeDef) {
  if (def.attraction.kind !== 'shelter') return []
  const { structure, minTier, branches, minSuitability } = def.attraction
  return state.entities
    .filter((e): e is StructureEntity => {
      if (e.kind !== 'structure' || e.defId !== structure) return false
      if (!isTileOpen(state, content, e.x, e.y)) return false
      const level = content.structures[e.defId]?.levels[e.level]
      if (!level || level.tier < minTier) return false
      return !branches || (level.branch !== undefined && branches.includes(level.branch))
    })
    .map((s) => ({
      shelter: s,
      suitability: structureSuitability(state, content, s.defId, s.x, s.y, s.id).score,
    }))
    .filter((s) => s.suitability >= minSuitability)
}

export function residents(state: GameState, shelterId: number): Creature[] {
  return state.creatures.filter((c) => c.homeId === shelterId)
}

function spawn(
  state: GameState,
  def: WildlifeDef,
  ctx: StepContext,
  from: { x: number; y: number },
  target: { x: number; y: number; id: number },
  homeId: number | null,
): void {
  const creature: Creature = {
    id: nextId(state),
    speciesId: def.id,
    x: from.x + 0.5,
    y: from.y + 0.5,
    activity: 'arriving',
    targetX: target.x + 0.5,
    targetY: target.y + 0.5,
    targetId: target.id,
    homeId,
    timerMs: 0,
    stayMs: randomRange(state, def.staySec[0], def.staySec[1]) * 1000,
    hidden: false,
  }
  state.creatures.push(creature)
  state.stats.seen[def.id] = (state.stats.seen[def.id] ?? 0) + 1
  ctx.events.push({ type: 'wildlifeArrived', creatureId: creature.id, speciesId: def.id })
}

/** System: species arrive when the garden offers what they need. */
/** Whether the creatures a species arrives alongside are in the sanctuary now. */
export function companionsPresent(state: GameState, def: WildlifeDef): boolean {
  const a = def.alongside
  if (!a) return true
  return state.creatures.filter((c) => a.wildlife.includes(c.speciesId)).length >= a.count
}

export function attractWildlife(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  const nectar = nectarAvailable(state, content)
  for (const def of Object.values(content.wildlife)) {
    const present = state.creatures.filter((c) => c.speciesId === def.id).length
    if (present >= def.maxPresent) continue
    if (!companionsPresent(state, def)) continue
    const a = def.attraction
    if (a.kind === 'nectar') {
      if (nectar < a.minNectar) continue
      // More flowers support more visitors at once, and draw them sooner.
      if (present >= Math.floor(nectar / a.minNectar)) continue
      if (!chance(state, a.perMinute * Math.min(2, nectar / a.minNectar), dtMs)) continue
      const target = pick(state, flowers(state, content))
      const from = pick(state, boundaryTiles(state, content))
      if (target && from) spawn(state, def, ctx, from, target, null)
    } else if (a.kind === 'perch') {
      const spots = perchPlants(state, content, def)
      const main = spots.filter((p) => a.plants.includes(p.defId)).length
      if (main < a.minCount) continue
      const bonus =
        a.bonus && spots.some((p) => p.defId === a.bonus!.plant) ? a.bonus.multiplier : 1
      if (!chance(state, a.perMinute * Math.min(2, main / a.minCount) * bonus, dtMs)) continue
      const target = pick(state, spots)
      const from = pick(state, boundaryTiles(state, content))
      if (target && from) spawn(state, def, ctx, from, target, null)
    } else if (a.kind === 'feeder') {
      const feeders = filledFeeders(state, content, a.structure)
      if (feeders.length === 0 || present >= feeders.length * 2) continue
      if (!chance(state, a.perMinute * feeders.length, dtMs)) continue
      const target = pick(state, feeders)
      const from = pick(state, boundaryTiles(state, content))
      if (target && from) spawn(state, def, ctx, from, target, null)
    } else {
      for (const { shelter, suitability } of sheltersFor(state, content, def)) {
        const level = content.structures[shelter.defId]?.levels[shelter.level]
        if (!level || residents(state, shelter.id).length >= level.capacity) continue
        const favour = level.favours?.[def.id] ?? 1
        if (!chance(state, a.perMinute * suitability * level.attraction * favour, dtMs)) continue
        const from =
          def.movement === 'ground'
            ? nearestBoundary(state, content, shelter)
            : pick(state, boundaryTiles(state, content))
        if (!from) break
        spawn(state, def, ctx, from, shelter, shelter.id)
        // Birds settle beside the shelter, never on top of residents resting inside it.
        const spot = homeSpot(def, shelter)
        const c = state.creatures.at(-1)!
        c.targetX = spot.x
        c.targetY = spot.y
        break
      }
    }
  }
}

function setTarget(c: Creature, x: number, y: number, id: number | null, activity: Activity): void {
  c.targetX = x
  c.targetY = y
  c.targetId = id
  c.activity = activity
}

function leave(state: GameState, content: Content, def: WildlifeDef, c: Creature): void {
  c.hidden = false
  const edge =
    def.movement === 'ground'
      ? nearestBoundary(state, content, c)
      : (pick(state, boundaryTiles(state, content)) ?? { x: 0, y: 0 })
  setTarget(c, edge.x + 0.5, edge.y + 0.5, null, 'leaving')
}

/** Chooses what a creature does after finishing an activity. */
function nextActivity(state: GameState, content: Content, def: WildlifeDef, c: Creature): void {
  if (c.stayMs <= 0) {
    leave(state, content, def, c)
    return
  }
  const jitter = () => randomRange(state, -0.25, 0.25)
  if (def.attraction.kind === 'nectar') {
    const options = flowers(state, content)
    if (options.length === 0) {
      leave(state, content, def, c)
      return
    }
    // Now and then, rest on a nearby plant or stone instead of feeding.
    const rest = random(state) < 0.25 ? pick(state, perches(state, content, c, 3)) : undefined
    const target = rest ?? pick(state, options)!
    setTarget(c, target.x + 0.5 + jitter(), target.y + 0.5 + jitter(), target.id, 'moving')
    return
  }
  if (def.attraction.kind === 'perch') {
    const target = pick(state, perchPlants(state, content, def))
    if (!target) {
      leave(state, content, def, c)
      return
    }
    setTarget(c, target.x + 0.5 + jitter(), target.y + 0.5 + jitter(), target.id, 'moving')
    return
  }
  if (def.attraction.kind === 'feeder') {
    const feeders = filledFeeders(state, content, def.attraction.structure)
    if (feeders.length === 0) {
      leave(state, content, def, c)
      return
    }
    const rest = random(state) < 0.3 ? pick(state, perches(state, content, c, 3)) : undefined
    const target = rest ?? pick(state, feeders)!
    setTarget(c, target.x + 0.5 + jitter() / 2, target.y + 0.5 + jitter() / 2, target.id, 'moving')
    return
  }
  const home = c.homeId !== null ? entityById(state, c.homeId) : undefined
  if (!home) {
    leave(state, content, def, c)
    return
  }
  const spot = homeSpot(def, home)
  const atHome = distance({ x: c.x, y: c.y }, spot) < 0.3
  if (!atHome) {
    setTarget(c, spot.x, spot.y, home.id, 'moving')
    return
  }
  if (def.movement === 'ground') {
    // Forage a little way from the shelter, then return.
    for (let tries = 0; tries < 6; tries++) {
      const x = home.x + Math.round(randomRange(state, -2, 2))
      const y = home.y + Math.round(randomRange(state, -2, 2))
      if (isOpenGround(terrainAt(state, x, y)) && isTileOpen(state, content, x, y)) {
        setTarget(c, x + 0.5 + jitter(), y + 0.5 + jitter(), null, 'moving')
        return
      }
    }
    restInside(state, content, c)
    return
  }
  const perch = pick(state, perches(state, content, home, 3))
  if (perch) setTarget(c, perch.x + 0.5 + jitter(), perch.y + 0.5 + jitter(), perch.id, 'moving')
  else {
    c.activity = 'perching'
    c.timerMs = randomRange(state, 6, 12) * 1000
  }
}

/** How much longer a resident rests in its shelter (1 unless the shelter suits a long rest). */
function settleFactor(state: GameState, content: Content, c: Creature): number {
  const home = c.homeId !== null ? entityById(state, c.homeId) : undefined
  if (home?.kind !== 'structure') return 1
  return content.structures[home.defId]?.levels[home.level]?.settles?.[c.speciesId] ?? 1
}

/** Ground creatures rest out of sight in their shelter between forays. */
function restInside(state: GameState, content: Content, c: Creature): void {
  c.activity = 'resting'
  c.hidden = true
  c.timerMs = randomRange(state, 20, 60) * 1000 * settleFactor(state, content, c)
}

/** What a creature starts doing when it reaches its target. */
function arrive(
  state: GameState,
  content: Content,
  def: WildlifeDef,
  c: Creature,
  ctx: StepContext,
): void {
  const target = c.targetId !== null ? entityById(state, c.targetId) : undefined
  if (c.homeId !== null && c.targetId === c.homeId && target?.kind === 'structure') {
    if (c.activity === 'arriving') {
      // A resident that settles in here stays for longer.
      c.stayMs *= settleFactor(state, content, c)
      target.visits++
      state.stats.visits[target.defId] = (state.stats.visits[target.defId] ?? 0) + 1
      ctx.events.push({
        type: 'shelterVisited',
        entityId: target.id,
        structureId: target.defId,
        speciesId: def.id,
      })
    }
    if (def.movement === 'ground') {
      restInside(state, content, c)
    } else {
      c.activity = 'perching'
      c.timerMs = randomRange(state, 6, 12) * 1000
    }
    return
  }
  if (target?.kind === 'structure' && def.attraction.kind === 'feeder' && isFilled(target)) {
    c.activity = 'feeding'
    c.timerMs = randomRange(state, 5, 10) * 1000
    return
  }
  if (target?.kind === 'plant' && def.attraction.kind === 'perch') {
    c.activity = 'perching'
    c.timerMs = randomRange(state, 8, 18) * 1000
    return
  }
  if (
    target?.kind === 'plant' &&
    isFlowering(content, target) &&
    def.attraction.kind === 'nectar'
  ) {
    c.activity = 'feeding'
    c.timerMs = randomRange(state, 4, 9) * 1000
    return
  }
  c.activity = def.movement === 'flying' ? 'perching' : 'resting'
  c.timerMs = randomRange(state, 3, 8) * 1000
}

/** System: moves creatures and runs their routines. */
export function moveWildlife(
  state: GameState,
  content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  const gone = new Set<number>()
  for (const c of state.creatures) {
    const def = content.wildlife[c.speciesId]
    if (!def) {
      gone.add(c.id)
      continue
    }
    c.stayMs -= dtMs
    // A target that has been removed (or a flower that has been moved) needs a new plan.
    if (c.targetId !== null && !entityById(state, c.targetId) && c.activity !== 'leaving') {
      c.targetId = null
      nextActivity(state, content, def, c)
    }
    const moving = c.activity === 'arriving' || c.activity === 'moving' || c.activity === 'leaving'
    if (moving) {
      const dx = c.targetX - c.x
      const dy = c.targetY - c.y
      const d = Math.hypot(dx, dy)
      const step = (def.speed * dtMs) / 1000
      if (d > step) {
        c.x += (dx / d) * step
        c.y += (dy / d) * step
        continue
      }
      c.x = c.targetX
      c.y = c.targetY
      if (c.activity === 'leaving') {
        gone.add(c.id)
        ctx.events.push({ type: 'wildlifeLeft', creatureId: c.id, speciesId: c.speciesId })
        continue
      }
      arrive(state, content, def, c, ctx)
      continue
    }
    c.timerMs -= dtMs
    if (c.timerMs > 0) continue
    c.hidden = false
    nextActivity(state, content, def, c)
  }
  if (gone.size > 0) state.creatures = state.creatures.filter((c) => !gone.has(c.id))
}

const ACTIVITY_TEXT: Record<Activity, string> = {
  arriving: 'Arriving in the garden',
  moving: 'Moving through the garden',
  feeding: 'Feeding',
  resting: 'Resting',
  perching: 'Perching',
  leaving: 'Leaving the garden',
}

/** A short description of what a creature is doing, for inspection. */
export function describeActivity(state: GameState, content: Content, c: Creature): string {
  const target = c.targetId !== null ? entityById(state, c.targetId) : undefined
  const targetName =
    target?.kind === 'plant'
      ? content.plants[target.defId]?.name
      : target?.kind === 'structure'
        ? content.structures[target.defId]?.name
        : target?.kind === 'decoration'
          ? content.decorations[target.defId]?.name
          : undefined
  if (c.hidden) {
    return settleFactor(state, content, c) > 1
      ? 'Tucked in for a long rest in its shelter'
      : 'Resting out of sight in its shelter'
  }
  if (c.activity === 'feeding' && targetName) return `Feeding at the ${targetName.toLowerCase()}`
  if ((c.activity === 'resting' || c.activity === 'perching') && targetName) {
    return `${ACTIVITY_TEXT[c.activity]} on the ${targetName.toLowerCase()}`
  }
  if (c.activity === 'arriving' && targetName) return `Heading for the ${targetName.toLowerCase()}`
  return ACTIVITY_TEXT[c.activity]
}
