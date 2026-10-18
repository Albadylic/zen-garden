// Where the player can find an item, worked out from the content, so the
// interface can say what to gather rather than only what something costs.

import type { Content } from './content'
import type { GameState } from './state'

/**
 * Places an item comes from: plants and features, clearing, then making it.
 * Given the game state, sources the player already has in their gardens come first.
 */
export function itemSources(content: Content, itemId: string, state?: GameState): string[] {
  const found: { name: string; defId?: string }[] = []
  const add = (name: string, defId?: string) => {
    if (!found.some((f) => f.name === name)) found.push({ name, defId })
  }
  for (const p of Object.values(content.plants)) {
    if (p.produces.some((r) => r.item === itemId) || p.harvest?.item === itemId) add(p.name, p.id)
  }
  for (const d of Object.values(content.decorations)) {
    if (d.produces?.some((r) => r.item === itemId)) add(`${d.name}s`, d.id)
  }
  for (const s of Object.values(content.structures)) {
    if (s.levels.some((l) => l.produces.some((r) => r.item === itemId))) add(s.name, s.id)
  }
  const cleared =
    content.world.clearing.some((c) => c.item === itemId) ||
    content.world.gardens.some((g) => g.clearing?.some((c) => c.item === itemId))
  if (cleared) add('clearing overgrowth')
  for (const r of Object.values(content.recipes)) {
    if (r.output.kind === 'item' && r.output.id === itemId) add(`making it (${r.name})`)
  }
  if (!state) return found.map((f) => f.name)
  const have = new Set(state.entities.map((e) => e.defId))
  const rank = (f: { defId?: string }) => (f.defId === undefined ? 1 : have.has(f.defId) ? 0 : 2)
  return [...found].sort((a, b) => rank(a) - rank(b)).map((f) => f.name)
}
