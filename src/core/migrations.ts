// Migrations that bring older saves up to date, one version at a time.
//
// Versions 1 to 3 stored the whole sanctuary as one map: the Forgotten Garden
// in columns 0–15 and the Bamboo Grove beside it in columns 16–25, joined by a
// gate in the garden's east wall. Version 4 gives each garden its own map and
// moves the grove north of the garden, turned a quarter so its entrance faces
// the garden's north gate. The early migrations still work on the old single
// map, which `legacyMap` rebuilds from today's content.

import type { Content, FixedObject, Terrain } from './content'
import { fixedEntity } from './game'
import { isInGarden } from './gardens'
import type { Creature, Drop, Entity, GameState, GardenTiles } from './state'

export type Migration = (
  state: Record<string, unknown>,
  content: Content,
) => Record<string, unknown>

const GARDEN = 'forgotten-garden'
const GROVE = 'bamboo-grove'
const LEGACY_WIDTH = 26
const LEGACY_HEIGHT = 16
/** The garden's gate: in the east wall up to version 3, in the north wall from version 4. */
const EAST_GATE = { x: 15, y: 12 }
const NORTH_GATE = { x: 10, y: 0 }

/** Where the grove's world origin sits from version 4. */
function groveOrigin(content: Content): { x: number; y: number } {
  const b = content.world.gardens.find((g) => g.id === GROVE)!.bounds
  return { x: b.x, y: b.y }
}

/**
 * A legacy grove tile (columns 16–25, plus the shared wall in column 15) and
 * its tile in today's world. The grove turns a quarter: legacy rows become its
 * columns, and its legacy west edge becomes its south edge.
 */
function groveFromLegacy(content: Content, x: number, y: number): { x: number; y: number } {
  const o = groveOrigin(content)
  return { x: o.x + y, y: o.y + 25 - x }
}

function groveToLegacy(content: Content, x: number, y: number): { x: number; y: number } {
  const o = groveOrigin(content)
  return { x: 25 - (y - o.y), y: x - o.x }
}

/** The same move for a point within a tile, such as a creature's position. */
function grovePointFromLegacy(content: Content, x: number, y: number) {
  const o = groveOrigin(content)
  return { x: o.x + y, y: o.y + 26 - x }
}

interface LegacyMap {
  width: number
  height: number
  terrain: Terrain[]
  fixed: FixedObject[]
  inGarden: (x: number, y: number) => boolean
}

/** The single map of versions 2 and 3, rebuilt from today's gardens. */
export function legacyMap(content: Content): LegacyMap {
  const garden = content.world.gardens.find((g) => g.id === GARDEN)!
  const grove = content.world.gardens.find((g) => g.id === GROVE)!
  const terrain: Terrain[] = []
  for (let y = 0; y < LEGACY_HEIGHT; y++) {
    for (let x = 0; x < LEGACY_WIDTH; x++) {
      if (x < 16) {
        terrain.push(garden.terrain[y * garden.bounds.w + x]!)
      } else {
        const w = groveFromLegacy(content, x, y)
        terrain.push(
          grove.terrain[(w.y - grove.bounds.y) * grove.bounds.w + (w.x - grove.bounds.x)]!,
        )
      }
    }
  }
  terrain[NORTH_GATE.y * LEGACY_WIDTH + NORTH_GATE.x] = 'boundary'
  terrain[EAST_GATE.y * LEGACY_WIDTH + EAST_GATE.x] = 'path'
  // Only the two gardens of the old single map, and none of the gardens built since.
  const fixed = content.world.fixed
    .filter((f) => isInGarden(garden, f.x, f.y) || isInGarden(grove, f.x, f.y))
    .map((f) => {
      if (f.x === NORTH_GATE.x && f.y === NORTH_GATE.y) return { ...f, ...EAST_GATE }
      if (isInGarden(garden, f.x, f.y)) return f
      return { ...f, ...groveToLegacy(content, f.x, f.y) }
    })
  return {
    width: LEGACY_WIDTH,
    height: LEGACY_HEIGHT,
    terrain,
    fixed,
    inGarden: (x, y) => x >= 0 && x < 16 && y >= 0 && y < LEGACY_HEIGHT,
  }
}

/** The fields of a version 1–3 save that version 4 replaced. */
interface LegacyState {
  width: number
  height: number
  terrain: Terrain[]
  mapId: string
  areasVisited?: string[]
}

type Legacy = Omit<GameState, 'gardens' | 'worldId' | 'gardensVisited'> & LegacyState

/**
 * Version 1 → 2: the map grows east to include the bamboo grove. The old
 * garden keeps its terrain and everything in it; the gate moves from the
 * north wall to the east wall, and the grove's fixed features are added.
 */
function addBambooGrove(raw: Record<string, unknown>, content: Content): Record<string, unknown> {
  const s = raw as unknown as Legacy
  const map = legacyMap(content)
  const oldWidth = s.width
  const terrain: Terrain[] = [...map.terrain]
  for (let y = 0; y < Math.min(s.height, map.height); y++) {
    for (let x = 0; x < Math.min(oldWidth, map.width); x++)
      terrain[y * map.width + x] = s.terrain[y * oldWidth + x]!
  }
  // Fixed features that have moved in the new map (the gate) go to their new place.
  for (const e of s.entities) {
    if (!e.fixed) continue
    const home = map.fixed.find((f) => f.id === e.defId && f.x === e.x && f.y === e.y)
    if (home) continue
    const moved = map.fixed.find(
      (f) => f.id === e.defId && !s.entities.some((o) => o.x === f.x && o.y === f.y),
    )
    if (!moved) continue
    terrain[e.y * map.width + e.x] = map.terrain[e.y * map.width + e.x]!
    e.x = moved.x
    e.y = moved.y
    terrain[e.y * map.width + e.x] = map.terrain[e.y * map.width + e.x]!
  }
  // Fixed features in the new columns.
  for (const f of map.fixed) {
    if (f.x < oldWidth) continue
    s.entities.push(fixedEntity(content, f, s.nextId++))
  }
  s.terrain = terrain
  s.width = map.width
  s.height = map.height
  s.mapId = 'sanctuary'
  s.areasVisited = []
  s.stats.clearedIn = {}
  s.layoutVersion++
  return s as unknown as Record<string, unknown>
}

/**
 * Version 2 → 3: the first garden gains more shade (a third old pine, old
 * azaleas and a mossy strip along the north wall). New features go in where
 * the tile is free; a spot the player has already used is left as it is.
 * Lawn becomes moss where the new map has moss; everything else is kept.
 */
function addShadeToFirstGarden(
  raw: Record<string, unknown>,
  content: Content,
): Record<string, unknown> {
  const s = raw as unknown as Legacy
  const map = legacyMap(content)
  if (s.width !== map.width || s.height !== map.height) return raw
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const i = y * map.width + x
      if (map.inGarden(x, y) && map.terrain[i] === 'moss' && s.terrain[i] === 'grass')
        s.terrain[i] = 'moss'
    }
  }
  for (const f of map.fixed) {
    if (!map.inGarden(f.x, f.y)) continue
    if (s.entities.some((e) => e.x === f.x && e.y === f.y)) continue
    s.entities.push(fixedEntity(content, f, s.nextId++))
    s.terrain[f.y * map.width + f.x] = map.terrain[f.y * map.width + f.x]!
  }
  s.layoutVersion++
  return s as unknown as Record<string, unknown>
}

/**
 * Version 3 → 4: each garden gets its own map. The garden keeps its place;
 * its gate returns to the north wall. The grove moves north of the garden,
 * turned a quarter, and everything in it moves with it.
 */
function separateGardens(raw: Record<string, unknown>, content: Content): Record<string, unknown> {
  const s = raw as unknown as Legacy
  const garden = content.world.gardens.find((g) => g.id === GARDEN)!
  const grove = content.world.gardens.find((g) => g.id === GROVE)!
  const legacy = (x: number, y: number) => s.terrain[y * s.width + x]!

  const gardenTiles: GardenTiles = {
    x: garden.bounds.x,
    y: garden.bounds.y,
    width: garden.bounds.w,
    height: garden.bounds.h,
    terrain: [],
  }
  for (let y = 0; y < garden.bounds.h; y++)
    for (let x = 0; x < garden.bounds.w; x++) gardenTiles.terrain.push(legacy(x, y))
  gardenTiles.terrain[EAST_GATE.y * garden.bounds.w + EAST_GATE.x] = 'boundary'
  gardenTiles.terrain[NORTH_GATE.y * garden.bounds.w + NORTH_GATE.x] = 'path'

  const groveTiles: GardenTiles = {
    x: grove.bounds.x,
    y: grove.bounds.y,
    width: grove.bounds.w,
    height: grove.bounds.h,
    terrain: [...grove.terrain],
  }
  for (let y = grove.bounds.y; y < grove.bounds.y + grove.bounds.h; y++) {
    for (let x = grove.bounds.x; x < grove.bounds.x + grove.bounds.w; x++) {
      const old = groveToLegacy(content, x, y)
      // The shared wall becomes the grove's south wall, which keeps today's map.
      if (old.x <= EAST_GATE.x) continue
      groveTiles.terrain[(y - grove.bounds.y) * grove.bounds.w + (x - grove.bounds.x)] = legacy(
        old.x,
        old.y,
      )
    }
  }

  const inGrove = (p: { x: number }) => p.x >= 16
  const moveTile = (p: Entity | Drop) => {
    if (p.x === EAST_GATE.x && p.y === EAST_GATE.y) Object.assign(p, NORTH_GATE)
    else if (inGrove(p)) Object.assign(p, groveFromLegacy(content, p.x, p.y))
  }
  s.entities.forEach(moveTile)
  s.drops.forEach(moveTile)
  for (const c of s.creatures as Creature[]) {
    if (c.x >= 16) Object.assign(c, grovePointFromLegacy(content, c.x, c.y))
    if (c.targetX >= 16) {
      const t = grovePointFromLegacy(content, c.targetX, c.targetY)
      c.targetX = t.x
      c.targetY = t.y
    }
  }

  const next = s as unknown as Record<string, unknown>
  next.worldId = content.world.id
  next.gardens = { [GARDEN]: gardenTiles, [GROVE]: groveTiles }
  next.gardensVisited = s.areasVisited ?? []
  delete next.width
  delete next.height
  delete next.terrain
  delete next.mapId
  delete next.areasVisited
  s.layoutVersion++
  return next
}

/**
 * Migrations from version N to N + 1, keyed by N. Add one whenever
 * STATE_VERSION is bumped, transforming the raw saved state.
 */
export const migrations: Record<number, Migration> = {
  1: addBambooGrove,
  2: addShadeToFirstGarden,
  3: separateGardens,
}
