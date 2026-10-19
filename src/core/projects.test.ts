import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant } from '../test/helpers'
import {
  activeApproaches,
  availableProjects,
  chooseApproach,
  choosableApproaches,
  completeStage,
  nextStage,
  readyStages,
  stageStatus,
} from './projects'
import { buildRecipe } from './layout'
import { sowablePlants } from './plants'
import { clearOvergrowth } from './resources'
import { advance } from './simulation'

function grove() {
  const s = setup(4)
  s.state.unlocks.push('area:bamboo-grove')
  return { ...s, project: s.content.projects['restore-grove']! }
}

describe('restoration projects', () => {
  it('is only available once its area opens', () => {
    const { content, state } = setup()
    expect(availableProjects(state, content)).toEqual([])
    state.unlocks.push('area:bamboo-grove')
    expect(availableProjects(state, content).map((p) => p.id)).toEqual(['restore-grove'])
  })

  it('offers three approaches, and beginning one grants its first discovery', () => {
    const { content, state, project } = grove()
    expect(choosableApproaches(state, project).map((a) => a.id)).toEqual([
      'shaded-corner',
      'wildlife-refuge',
      'path-and-stone',
    ])
    const result = chooseApproach(state, content, 'restore-grove', 'path-and-stone')
    expect(result.ok).toBe(true)
    expect(state.unlocks).toContain('recipe:bamboo-water-spout')
    expect(chooseApproach(state, content, 'restore-grove', 'path-and-stone').ok).toBe(false)
  })

  it('lets several approaches be under way at once', () => {
    const { content, state, project } = grove()
    expect(chooseApproach(state, content, 'restore-grove', 'path-and-stone').ok).toBe(true)
    expect(chooseApproach(state, content, 'restore-grove', 'shaded-corner').ok).toBe(true)
    expect(activeApproaches(state, project).map((a) => a.id)).toEqual([
      'path-and-stone',
      'shaded-corner',
    ])
    expect(choosableApproaches(state, project).map((a) => a.id)).toEqual(['wildlife-refuge'])
    // Clearing the understory readies the shaded corner's first stage, not the other's.
    for (const [x, y] of [
      [-1, -3],
      [-1, -4],
      [0, -4],
      [1, -2],
    ] as const)
      clearOvergrowth(state, content, x, y)
    expect(readyStages(state, content).map((r) => r.approach.id)).toEqual(['shaded-corner'])
    expect(completeStage(state, content, 'restore-grove', 'shaded-corner').ok).toBe(true)
    expect(activeApproaches(state, project).map((a) => a.id)).toEqual([
      'path-and-stone',
      'shaded-corner',
    ])
  })

  it('completes stages when their conditions hold, paying their cost', () => {
    const { content, state, project } = grove()
    chooseApproach(state, content, 'restore-grove', 'shaded-corner')
    const corner = project.approaches.find((a) => a.id === 'shaded-corner')!
    const first = nextStage(state, project, corner)!
    expect(stageStatus(state, content, first).kind).toBe('waiting')
    expect(completeStage(state, content, 'restore-grove', 'shaded-corner').ok).toBe(false)
    for (const [x, y] of [
      [-1, -3],
      [-1, -4],
      [0, -4],
      [1, -2],
    ] as const) {
      expect(clearOvergrowth(state, content, x, y).ok).toBe(true)
    }
    expect(completeStage(state, content, 'restore-grove', 'shaded-corner').ok).toBe(true)
    const second = nextStage(state, project, corner)!
    expect(second.id).toBe('plant-the-shade')
    for (const [x, y] of [
      [0, -2],
      [0, -3],
      [0, -5],
    ] as const) {
      addPlant(state, content, 'hosta', x, y, 2)
    }
    // The first stage's reward was the canes the second stage needs.
    expect(state.inventory['bamboo-canes']).toBe(2)
    expect(stageStatus(state, content, second).kind).toBe('ready')
    state.inventory['bamboo-canes'] = 0
    expect(stageStatus(state, content, second).kind).toBe('needsItems')
    state.inventory['bamboo-canes'] = 2
    const done = completeStage(state, content, 'restore-grove', 'shaded-corner')
    expect(done.ok).toBe(true)
    if (done.ok) expect(done.events.map((e) => e.type)).toContain('approachComplete')
    expect(state.inventory['bamboo-canes'] ?? 0).toBe(0)
  })

  it('lets the other approaches be chosen once one is finished', () => {
    const { state, project } = grove()
    state.projects['restore-grove'] = {
      active: [],
      stagesDone: ['clear-understory', 'plant-the-shade'],
      approachesDone: ['shaded-corner'],
    }
    expect(choosableApproaches(state, project).map((a) => a.id)).toEqual([
      'wildlife-refuge',
      'path-and-stone',
    ])
  })
})

describe('stage rewards', () => {
  it('opens every approach without being asked', () => {
    const { content, state, project } = grove()
    advance(state, content, 1000)
    expect(activeApproaches(state, project).map((a) => a.id)).toEqual([
      'shaded-corner',
      'wildlife-refuge',
      'path-and-stone',
    ])
    // Each approach's discoveries come with it.
    expect(state.unlocks).toContain('recipe:bamboo-fence')
    expect(state.unlocks).toContain('recipe:bamboo-water-spout')
  })

  it('gives a rare plant to sow and a keepsake to place', () => {
    const { content, state } = grove()
    const approaches = content.projects['restore-grove']!.approaches
    const last = (id: string) => approaches.find((a) => a.id === id)!.stages.at(-1)!
    expect(last('shaded-corner').reward).toEqual({ 'black-bamboo-shoot': 2 })
    expect(last('wildlife-refuge').reward).toEqual({ 'deer-scarer-keepsake': 1 })
    expect(last('wildlife-refuge').unlocks).toContain('recipe:deer-scarer')
    // Once in hand, the rare plant can be sown and the keepsake placed from Build.
    state.inventory['black-bamboo-shoot'] = 2
    expect(sowablePlants(state, content).map((p) => p.id)).toContain('black-bamboo')
    state.unlocks.push('recipe:deer-scarer')
    state.inventory['deer-scarer-keepsake'] = 1
    expect(buildRecipe(state, content, 'deer-scarer', 2, -6).ok).toBe(true)
    expect(state.inventory['deer-scarer-keepsake'] ?? 0).toBe(0)
  })
})
