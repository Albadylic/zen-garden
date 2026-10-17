// The gardens of the sanctuary: which one a tile belongs to, and whether it is
// open yet. Closed gardens are hidden from the player and the wildlife alike.

import type { Content, GardenDef, GateDef } from './content'
import { forEachTile } from './grid'
import type { GameState } from './state'

export function isInGarden(garden: GardenDef, x: number, y: number): boolean {
  const b = garden.bounds
  return x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h
}

export function gardenAt(content: Content, x: number, y: number): GardenDef | undefined {
  return content.world.gardens.find((g) => isInGarden(g, x, y))
}

export function gardenById(content: Content, id: string): GardenDef | undefined {
  return content.world.gardens.find((g) => g.id === id)
}

export function isGardenOpen(state: GameState, garden: GardenDef | undefined): boolean {
  return !!garden && (garden.unlock === undefined || state.unlocks.includes(garden.unlock))
}

/** Whether a tile is in a garden the player has opened. */
export function isTileOpen(state: GameState, content: Content, x: number, y: number): boolean {
  return isGardenOpen(state, gardenAt(content, x, y))
}

export function openGardens(state: GameState, content: Content): GardenDef[] {
  return content.world.gardens.filter((g) => isGardenOpen(state, g))
}

/** A gate stands open once the garden beyond it has opened. */
export function isGateOpen(state: GameState, content: Content, gate: GateDef): boolean {
  if (gate.unlock) return state.unlocks.includes(gate.unlock)
  return isGardenOpen(state, gardenById(content, gate.to))
}

/** The gate standing on a tile, if any. */
export function gateAt(content: Content, x: number, y: number): GateDef | undefined {
  return content.world.gates.find((g) => g.at.x === x && g.at.y === y)
}

/** Records that the player has looked around a garden (for "explore the grove" goals). */
export function visitGarden(state: GameState, content: Content, x: number, y: number): boolean {
  const garden = gardenAt(content, x, y)
  if (!garden || !isGardenOpen(state, garden) || state.gardensVisited.includes(garden.id))
    return false
  state.gardensVisited.push(garden.id)
  return true
}

/** Overgrown tiles the player can currently reach and clear. */
export function openOvergrowth(state: GameState, content: Content): number {
  let n = 0
  forEachTile(state, (x, y, t) => {
    if (t === 'overgrown' && isTileOpen(state, content, x, y)) n++
  })
  return n
}
