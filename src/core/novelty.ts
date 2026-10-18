// What is new in the Plants, Build and Inventory panels: things the player can
// use now but has not yet seen listed. Seen choices are saved with the garden.

import type { Content } from './content'
import { hasUnlock } from './layout'
import { sowablePlants } from './plants'
import type { GameState } from './state'

export type ChoicePanel = 'plants' | 'build' | 'inventory'

/** Keys of everything a panel lists right now: `plant:id`, `recipe:id` or `item:id`. */
export function panelChoices(state: GameState, content: Content, panel: ChoicePanel): string[] {
  if (panel === 'plants') return sowablePlants(state, content).map((p) => `plant:${p.id}`)
  if (panel === 'build') {
    return Object.values(content.recipes)
      .filter((r) => r.output.kind !== 'item' && hasUnlock(state, r.unlock))
      .map((r) => `recipe:${r.id}`)
  }
  const held = Object.keys(state.inventory)
    .filter((id) => (state.inventory[id] ?? 0) > 0)
    .map((id) => `item:${id}`)
  const makeable = Object.values(content.recipes)
    .filter((r) => r.output.kind === 'item' && hasUnlock(state, r.unlock))
    .map((r) => `recipe:${r.id}`)
  return [...held, ...makeable]
}

/** Everything any panel lists right now, used to mark a garden's starting choices as seen. */
export function allChoices(state: GameState, content: Content): string[] {
  return (['plants', 'build', 'inventory'] as const).flatMap((p) => panelChoices(state, content, p))
}

export function isNewChoice(state: GameState, key: string): boolean {
  return !state.seenChoices.includes(key)
}

/** Choices in a panel the player has not seen there yet. */
export function newChoices(state: GameState, content: Content, panel: ChoicePanel): string[] {
  return panelChoices(state, content, panel).filter((key) => isNewChoice(state, key))
}

/** Marks a panel's current choices as seen. Returns whether anything changed. */
export function markChoicesSeen(state: GameState, content: Content, panel: ChoicePanel): boolean {
  const fresh = newChoices(state, content, panel)
  if (fresh.length === 0) return false
  state.seenChoices.push(...fresh)
  return true
}
