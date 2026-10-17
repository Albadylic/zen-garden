// Tiles and positions. Every position is a world tile; each garden's terrain
// is kept separately and found from the position.

import type { Terrain } from './content'
import type { Entity, GameState, GardenTiles } from './state'

export interface GridPos {
  x: number
  y: number
}

/** The garden whose map covers a tile, with its id. */
export function gardenTilesAt(
  state: Pick<GameState, 'gardens'>,
  x: number,
  y: number,
): { id: string; garden: GardenTiles } | undefined {
  for (const id in state.gardens) {
    const garden = state.gardens[id]!
    if (
      x >= garden.x &&
      y >= garden.y &&
      x < garden.x + garden.width &&
      y < garden.y + garden.height
    )
      return { id, garden }
  }
  return undefined
}

/** A key naming a world tile, for maps of per-tile values. */
export function tileKey(x: number, y: number): string {
  return `${x},${y}`
}

/** Index of a world tile within its garden's terrain. */
export function localIndex(garden: Pick<GardenTiles, 'x' | 'y' | 'width'>, x: number, y: number) {
  return (y - garden.y) * garden.width + (x - garden.x)
}

/** Whether a tile belongs to any garden. */
export function inBounds(state: Pick<GameState, 'gardens'>, x: number, y: number): boolean {
  return gardenTilesAt(state, x, y) !== undefined
}

export function terrainAt(state: GameState, x: number, y: number): Terrain | undefined {
  const hit = gardenTilesAt(state, x, y)
  return hit?.garden.terrain[localIndex(hit.garden, x, y)]
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  const hit = gardenTilesAt(state, x, y)
  if (!hit) return
  hit.garden.terrain[localIndex(hit.garden, x, y)] = terrain
  state.layoutVersion++
}

/** Calls `fn` for every tile of every garden. */
export function forEachTile(
  state: GameState,
  fn: (x: number, y: number, terrain: Terrain, gardenId: string) => void,
): void {
  for (const id in state.gardens) {
    const g = state.gardens[id]!
    g.terrain.forEach((t, i) => fn(g.x + (i % g.width), g.y + Math.floor(i / g.width), t, id))
  }
}

export function entityAt(state: GameState, x: number, y: number): Entity | undefined {
  return state.entities.find((e) => e.x === x && e.y === y)
}

export function entityById(state: GameState, id: number): Entity | undefined {
  return state.entities.find((e) => e.id === id)
}

export function distance(a: GridPos, b: GridPos): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** The eight neighbours of a tile that lie inside a garden. */
export function neighbours(state: GameState, x: number, y: number): GridPos[] {
  const out: GridPos[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx !== 0 || dy !== 0) && inBounds(state, x + dx, y + dy))
        out.push({ x: x + dx, y: y + dy })
    }
  }
  return out
}

/** Tiles a creature can stand on or fly over inside the garden walls. */
export function isOpenGround(terrain: Terrain | undefined): boolean {
  return terrain !== undefined && terrain !== 'boundary' && !isWater(terrain)
}

/** Open water of any kind: pond, deep water or stream. */
export function isWater(terrain: Terrain | undefined): boolean {
  return terrain === 'water' || terrain === 'deep-water' || terrain === 'stream'
}
