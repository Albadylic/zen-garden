// Up to three optional, context-aware suggestions. They describe things the
// player might enjoy doing next; none of them are required.

import { openOvergrowth } from './areas'
import type { Content } from './content'
import { structureSuitability } from './environment'
import { isFilled } from './feeders'
import { upgradeOptions } from './habitats'
import { harvestStatus } from './plants'
import { isChapterStarted } from './progression'
import { availableProjects, currentStage, stageStatus } from './projects'
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
    const needsBundle = upgradeOptions(state, content, s).some(
      (o) =>
        o.status.kind === 'needsItems' &&
        (o.status.cost['seed-bundle'] ?? 0) > (state.inventory['seed-bundle'] ?? 0),
    )
    if (needsBundle && s.visits >= 3) {
      add(
        'seed-bundle',
        'Your shelter could grow into a Mossy log lodge. Make a seed bundle from spare seeds in Inventory.',
      )
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

  for (const project of availableProjects(state, content)) {
    const stage = currentStage(state, project)
    if (stage && stageStatus(state, content, stage).kind === 'ready') {
      add('stage-ready', `A restoration stage is ready: "${stage.title}". Complete it in Restore.`)
    }
  }

  const sap = state.inventory['maple-sap'] ?? 0
  if (sap > 0 && shelters.some((s) => content.structures[s.defId]?.feeder && !isFilled(s))) {
    add('feeder', 'Your sap feeder is empty. Fill it with maple sap to welcome butterflies back.')
  }

  const grove = content.chapters.find((c) => c.id === 'bamboo-grove')
  if (grove && isChapterStarted(state, grove) && (state.stats.gathered['bamboo-canes'] ?? 0) < 10) {
    const ready = state.entities.some(
      (e) => e.kind === 'plant' && harvestStatus(content, e).kind === 'ready',
    )
    if (ready) add('harvest', 'Mature bamboo is ready to harvest for canes.')
  }

  const maples = state.entities.filter((e) => e.kind === 'plant' && e.defId === 'japanese-maple')
  if (
    maples.length === 0 &&
    (state.inventory['maple-seeds'] ?? 0) > 0 &&
    state.milestones['first-planting'] !== undefined
  ) {
    add(
      'maple',
      'Plant your maple samara early: a tree takes a few hours to grow, and keeps growing while you are away.',
    )
  } else if (
    grove &&
    isChapterStarted(state, grove) &&
    maples.length > 0 &&
    !state.stats.matured['japanese-maple']
  ) {
    add(
      'maple-growing',
      'Your maple is still growing. Once mature, it yields leaves and sap for new things to make.',
    )
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
    add('clear', 'Overgrown corners hide twigs and leaf litter. Open Restore to clear them.')

  return out
}
