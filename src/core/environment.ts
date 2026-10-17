// The per-tile environment (shade, moisture, water, cover) and how well a plant
// or structure suits a tile. Shared by growth, habitats and wildlife.

import type { Content, Range, Terrain } from './content'
import { distance, gardenTilesAt, localIndex } from './grid'
import { gardenById } from './gardens'
import type { GameState } from './state'

export interface Environment {
  shade: number
  moisture: number
  water: number
  cover: number
}

export type Rating = 'poor' | 'fair' | 'good' | 'excellent'

export interface Suitability {
  score: number
  rating: Rating
  /** Plain-language reasons the tile is less than ideal. */
  reasons: string[]
}

const TERRAIN_MOISTURE: Record<Terrain, number> = {
  grass: 0.35,
  moss: 0.55,
  path: 0.15,
  water: 1,
  margin: 0.75,
  overgrown: 0.4,
  boundary: 0.3,
}

/** How far outside a preferred range a value can be before it no longer fits at all. */
const TOLERANCE = 0.35

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

const waterCache = new WeakMap<GameState, { version: number; grids: Map<string, number[]> }>()

/**
 * Proximity to the nearest water tile, per garden: 1 on or beside water,
 * falling to 0 four tiles away. Walls keep each garden's water to itself.
 */
function waterGrid(state: GameState, gardenId: string): number[] {
  let cached = waterCache.get(state)
  if (!cached || cached.version !== state.layoutVersion) {
    cached = { version: state.layoutVersion, grids: new Map() }
    waterCache.set(state, cached)
  }
  const hit = cached.grids.get(gardenId)
  if (hit) return hit
  const g = state.gardens[gardenId]!
  const water: { x: number; y: number }[] = []
  g.terrain.forEach((t, i) => {
    if (t === 'water') water.push({ x: i % g.width, y: Math.floor(i / g.width) })
  })
  const grid = g.terrain.map((_, i) => {
    const at = { x: i % g.width, y: Math.floor(i / g.width) }
    let best = Infinity
    for (const w of water) best = Math.min(best, distance(w, at))
    return best === Infinity ? 0 : clamp01(1 - Math.max(0, best - 1) / 3)
  })
  cached.grids.set(gardenId, grid)
  return grid
}

/** Growth fraction of a plant (0 when planted, 1 at its final stage). */
export function maturity(content: Content, defId: string, stage: number): number {
  const def = content.plants[defId]
  if (!def || def.stages.length <= 1) return 1
  return stage / (def.stages.length - 1)
}

/**
 * The environment at a tile. `excludeId` leaves one entity out, so a plant's
 * own shade and cover do not count towards its own conditions.
 */
export function environmentAt(
  state: GameState,
  content: Content,
  x: number,
  y: number,
  excludeId?: number,
): Environment {
  const hit = gardenTilesAt(state, x, y)
  if (!hit) return { shade: 0, moisture: 0, water: 0, cover: 0 }
  const i = localIndex(hit.garden, x, y)
  let shade = gardenById(content, hit.id)?.baseShade[i] ?? 0
  let cover = 0
  for (const e of state.entities) {
    if (e.id === excludeId) continue
    const d = distance(e, { x, y })
    if (e.kind === 'plant') {
      const def = content.plants[e.defId]
      if (!def) continue
      if (def.shade && e.stage >= def.shade.minStage && d <= def.shade.radius) {
        shade += def.shade.strength * (1 - d / (def.shade.radius + 1))
      }
      if (d <= 1.5) cover += def.cover * maturity(content, e.defId, e.stage) * (d === 0 ? 1 : 0.5)
    } else if (e.kind === 'decoration') {
      const def = content.decorations[e.defId]
      if (def && d <= 1.5) cover += def.cover * (d === 0 ? 1 : 0.5)
    }
  }
  const water = waterGrid(state, hit.id)[i] ?? 0
  shade = clamp01(shade)
  const terrain = hit.garden.terrain[i] ?? 'grass'
  const moisture = clamp01(TERRAIN_MOISTURE[terrain] + 0.45 * water + 0.25 * shade - 0.1)
  return { shade, moisture, water, cover: clamp01(cover) }
}

/** 1 inside the preferred range, falling to 0 at TOLERANCE outside it. */
export function fit(value: number, range: Range): number {
  if (value < range.min) return clamp01(1 - (range.min - value) / TOLERANCE)
  if (value > range.max) return clamp01(1 - (value - range.max) / TOLERANCE)
  return 1
}

export function rate(score: number): Rating {
  if (score >= 0.85) return 'excellent'
  if (score >= 0.6) return 'good'
  if (score >= 0.35) return 'fair'
  return 'poor'
}

interface Factor {
  value: number
  range: Range
  low: string
  high: string
}

function judge(factors: Factor[]): Suitability {
  let total = 0
  const reasons: string[] = []
  for (const f of factors) {
    const score = fit(f.value, f.range)
    total += score
    if (score < 0.999) reasons.push(f.value < f.range.min ? f.low : f.high)
  }
  const score = total / factors.length
  return { score, rating: rate(score), reasons }
}

export function plantSuitability(
  state: GameState,
  content: Content,
  plantId: string,
  x: number,
  y: number,
  excludeId?: number,
): Suitability {
  const def = content.plants[plantId]
  if (!def) return { score: 0, rating: 'poor', reasons: ['Unknown plant'] }
  const env = environmentAt(state, content, x, y, excludeId)
  return judge([
    {
      value: env.shade,
      range: def.prefers.shade,
      low: 'Prefers more shade',
      high: 'Prefers more sun',
    },
    {
      value: env.moisture,
      range: def.prefers.moisture,
      low: 'Too dry here',
      high: 'Too damp here',
    },
  ])
}

export function structureSuitability(
  state: GameState,
  content: Content,
  structureId: string,
  x: number,
  y: number,
  excludeId?: number,
): Suitability {
  const def = content.structures[structureId]
  if (!def) return { score: 0, rating: 'poor', reasons: ['Unknown structure'] }
  const env = environmentAt(state, content, x, y, excludeId)
  return judge([
    {
      value: env.shade,
      range: def.prefers.shade,
      low: 'Wants more shade',
      high: 'Too exposed to sun',
    },
    { value: env.moisture, range: def.prefers.moisture, low: 'Too dry here', high: 'Too wet here' },
    {
      value: env.cover,
      range: def.prefers.cover,
      low: 'Needs more plant cover nearby',
      high: 'Too enclosed',
    },
  ])
}
