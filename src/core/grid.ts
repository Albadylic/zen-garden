import type { Terrain } from './content'
import type { Entity, GameState } from './state'

export interface GridPos {
  x: number
  y: number
}

export function inBounds(
  state: Pick<GameState, 'width' | 'height'>,
  x: number,
  y: number,
): boolean {
  return x >= 0 && y >= 0 && x < state.width && y < state.height
}

export function tileIndex(state: Pick<GameState, 'width'>, x: number, y: number): number {
  return y * state.width + x
}

export function terrainAt(state: GameState, x: number, y: number): Terrain | undefined {
  if (!inBounds(state, x, y)) return undefined
  return state.terrain[tileIndex(state, x, y)]
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  state.terrain[tileIndex(state, x, y)] = terrain
  state.layoutVersion++
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

/** The eight neighbours of a tile that lie inside the map. */
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
  return terrain !== undefined && terrain !== 'boundary' && terrain !== 'water'
}
