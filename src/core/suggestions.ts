// Up to three optional, context-aware suggestions. They describe things the
// player might enjoy doing next; none of them are required.

import { openOvergrowth } from './areas'
import type { Content } from './content'
import { structureSuitability } from './environment'
import { upgradeOptions } from './habitats'
import { currentMilestone } from './progression'
import type { GameState, StructureEntity } from './state'

export interface Suggestion {
  id: string
  text: string
}

export const MAX_SUGGESTIONS = 3

export function suggestions(state: GameState, content: Content): Suggestion[] {
  const out: Suggestion[] = []
  const add = (id: string, text: string) => {
    if (out.length < MAX_SUGGESTIONS && !out.some((s) => s.text === text)) out.push({ id, text })
  }

  const milestone = currentMilestone(state, content)
  if (milestone) add(`milestone:${milestone.id}`, milestone.hint)

  const shelters = state.entities.filter((e): e is StructureEntity => e.kind === 'structure')
  for (const s of shelters) {
    if (upgradeOptions(state, content, s).some((o) => o.status.kind === 'ready')) {
      add('upgrade', 'Your shelter can be improved: select it to see how.')
      break
    }
  }
  for (const s of shelters) {
    const suit = structureSuitability(state, content, s.defId, s.x, s.y, s.id)
    if (suit.rating === 'poor' && s.visits === 0) {
      add('shelter-spot', 'Your shelter would suit wildlife better in shade, with plants close by.')
      break
    }
  }

  if (state.drops.length >= 3)
    add('gather', 'Natural materials are lying in the garden, ready to gather.')

  const seedsLeft = Object.values(content.plants).some(
    (p) => p.seedItem && (state.inventory[p.seedItem] ?? 0) > 0,
  )
  if (!seedsLeft)
    add('seeds', 'Mature plants drop fresh seeds and spores. Gather them to plant more.')

  const plantedKinds = Object.keys(state.stats.planted).length
  if (plantedKinds > 0 && plantedKinds < 3) {
    add(
      'variety',
      'Try something different: moss and ferns love the damp shade under the old pines.',
    )
  }

  const overgrown = openOvergrowth(state, content)
  if (overgrown > 0 && state.stats.cleared < 3)
    add('clear', 'Overgrown corners hide twigs and leaf litter. Use Restore to clear them.')

  return out
}
