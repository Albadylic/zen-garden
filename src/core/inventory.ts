import type { GameState } from './state'

export function itemCount(state: GameState, itemId: string): number {
  return state.inventory[itemId] ?? 0
}

/** Whether the player has ever had this item: holding it now, or gathered, harvested or found before. */
export function hasHad(state: GameState, itemId: string): boolean {
  return itemCount(state, itemId) > 0 || (state.stats.gathered[itemId] ?? 0) > 0
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
