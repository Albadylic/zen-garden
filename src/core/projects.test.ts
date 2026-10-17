import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant } from '../test/helpers'
import {
  availableProjects,
  chooseApproach,
  choosableApproaches,
  completeStage,
  currentStage,
  stageStatus,
} from './projects'
import { clearOvergrowth } from './resources'

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

  it('offers three approaches, and choosing one grants its first discovery', () => {
    const { content, state, project } = grove()
    expect(choosableApproaches(state, project).map((a) => a.id)).toEqual([
      'shaded-corner',
      'wildlife-refuge',
      'path-and-stone',
    ])
    const result = chooseApproach(state, content, 'restore-grove', 'path-and-stone')
    expect(result.ok).toBe(true)
    expect(state.unlocks).toContain('recipe:bamboo-water-spout')
    expect(choosableApproaches(state, project)).toEqual([])
    expect(chooseApproach(state, content, 'restore-grove', 'shaded-corner').ok).toBe(false)
  })

  it('completes stages when their conditions hold, paying their cost', () => {
    const { content, state, project } = grove()
    chooseApproach(state, content, 'restore-grove', 'shaded-corner')
    const first = currentStage(state, project)!
    expect(stageStatus(state, content, first).kind).toBe('waiting')
    expect(completeStage(state, content, 'restore-grove').ok).toBe(false)
    for (const [x, y] of [
      [17, 1],
      [18, 1],
      [18, 2],
      [16, 3],
    ] as const) {
      expect(clearOvergrowth(state, content, x, y).ok).toBe(true)
    }
    expect(completeStage(state, content, 'restore-grove').ok).toBe(true)
    const second = currentStage(state, project)!
    expect(second.id).toBe('plant-the-shade')
    for (const [x, y] of [
      [16, 2],
      [17, 2],
      [19, 2],
    ] as const) {
      addPlant(state, content, 'hosta', x, y, 2)
    }
    expect(stageStatus(state, content, second).kind).toBe('needsItems')
    state.inventory['bamboo-canes'] = 2
    const done = completeStage(state, content, 'restore-grove')
    expect(done.ok).toBe(true)
    if (done.ok) expect(done.events.map((e) => e.type)).toContain('approachComplete')
    expect(state.inventory['bamboo-canes'] ?? 0).toBe(0)
  })

  it('lets the other approaches be chosen once one is finished', () => {
    const { state, project } = grove()
    state.projects['restore-grove'] = {
      approach: null,
      stagesDone: ['clear-understory', 'plant-the-shade'],
      approachesDone: ['shaded-corner'],
    }
    expect(choosableApproaches(state, project).map((a) => a.id)).toEqual([
      'wildlife-refuge',
      'path-and-stone',
    ])
  })
})
