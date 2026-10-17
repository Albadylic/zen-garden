import type { GameState } from './state'

export function itemCount(state: GameState, itemId: string): number {
  return state.inventory[itemId] ?? 0
}

export function hasItems(state: GameState, items: Record<string, number>): boolean {
  return Object.entries(items).every(([id, n]) => itemCount(state, id) >= n)
}

export function addItems(state: GameState, items: Record<string, number>): void {
  for (const [id, n] of Object.entries(items)) {
    if (n > 0) state.inventory[id] = itemCount(state, id) + n
  }
}

/** Removes items, assuming the caller has already checked `hasItems`. */
export function removeItems(state: GameState, items: Record<string, number>): void {
  for (const [id, n] of Object.entries(items)) {
    const left = itemCount(state, id) - n
    if (left > 0) state.inventory[id] = left
    else delete state.inventory[id]
  }
}
