import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { checkMilestones, conditionProgress, currentMilestone } from './progression'

describe('milestones', () => {
  it('starts on the first planting', () => {
    const { content, state } = setup()
    expect(currentMilestone(state, content)?.id).toBe('first-planting')
  })

  it('completes in order and grants unlocks', () => {
    const { content, state } = setup()
    state.stats.planted['wildflower-mix'] = 1
    state.stats.grown[1] = 1
    state.stats.cleared = 3
    state.stats.collected = 8
    const events = checkMilestones(state, content)
    expect(
      events
        .filter((e) => e.type === 'milestone')
        .map((e) => e.type === 'milestone' && e.milestoneId),
    ).toEqual(['first-planting', 'signs-of-growth', 'clearing-the-way', 'gathering'])
    expect(state.unlocks).toContain('recipe:natural-shelter')
    expect(currentMilestone(state, content)?.id).toBe('first-visitor')
  })

  it('waits for earlier milestones even when later conditions are met', () => {
    const { content, state } = setup()
    state.stats.cleared = 5
    checkMilestones(state, content)
    expect(state.milestones['clearing-the-way']).toBeUndefined()
  })

  it('reports progress towards a condition', () => {
    const { state } = setup()
    state.stats.cleared = 1
    expect(conditionProgress(state, { kind: 'cleared', count: 3 })).toEqual({
      current: 1,
      target: 3,
    })
    state.stats.matured = { fern: 1, 'garden-moss': 2 }
    expect(conditionProgress(state, { kind: 'speciesMature', count: 3 })).toEqual({
      current: 2,
      target: 3,
    })
  })

  it('completes the chapter and opens the bamboo grove', () => {
    const { content, state } = setup()
    Object.assign(state.stats, {
      planted: { 'wildflower-mix': 1 },
      grown: [0, 1],
      cleared: 3,
      collected: 8,
      seen: { 'small-white': 1 },
      built: { 'natural-shelter': 1 },
      visits: { 'natural-shelter': 1 },
      matured: { 'wildflower-mix': 1, fern: 1, 'garden-moss': 1 },
    })
    const events = checkMilestones(state, content)
    expect(events.some((e) => e.type === 'chapterComplete')).toBe(true)
    expect(state.unlocks).toContain('area:bamboo-grove')
    expect(state.unlocks).toContain('upgrade:natural-shelter')
    expect(checkMilestones(state, content)).toEqual([])
  })
})
