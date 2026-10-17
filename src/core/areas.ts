// Areas of the map: which part a tile belongs to, and whether it is open yet.
// Closed areas are hidden from the player and the wildlife alike.

import type { AreaDef, Content } from './content'
import type { GameState } from './state'

export function areaAt(content: Content, x: number, y: number): AreaDef | undefined {
  return content.map.areas.find(
    (a) =>
      x >= a.bounds.x &&
      y >= a.bounds.y &&
      x < a.bounds.x + a.bounds.w &&
      y < a.bounds.y + a.bounds.h,
  )
}

export function isAreaOpen(state: GameState, area: AreaDef | undefined): boolean {
  return !!area && (area.unlock === undefined || state.unlocks.includes(area.unlock))
}

/** Whether a tile is in an area the player has opened. */
export function isTileOpen(state: GameState, content: Content, x: number, y: number): boolean {
  return isAreaOpen(state, areaAt(content, x, y))
}

export function openAreas(state: GameState, content: Content): AreaDef[] {
  return content.map.areas.filter((a) => isAreaOpen(state, a))
}

export function isInArea(area: AreaDef, x: number, y: number): boolean {
  const b = area.bounds
  return x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h
}

/** Records that the player has looked around an area (for "inspect the grove" goals). */
export function visitArea(state: GameState, content: Content, x: number, y: number): boolean {
  const area = areaAt(content, x, y)
  if (!area || !isAreaOpen(state, area) || state.areasVisited.includes(area.id)) return false
  state.areasVisited.push(area.id)
  return true
}

/** Overgrown tiles the player can currently reach and clear. */
export function openOvergrowth(state: GameState, content: Content): number {
  let n = 0
  state.terrain.forEach((t, i) => {
    if (
      t === 'overgrown' &&
      isTileOpen(state, content, i % state.width, Math.floor(i / state.width))
    )
      n++
  })
  return n
}
