import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addShelter } from '../test/helpers'
import { MAX_SUGGESTIONS, suggestions } from './suggestions'

describe('suggestions', () => {
  it('leads with the current milestone hint', () => {
    const { content, state } = setup()
    const list = suggestions(state, content)
    expect(list[0]?.id).toBe('milestone:first-planting')
    expect(list.length).toBeLessThanOrEqual(MAX_SUGGESTIONS)
  })

  it('stops suggesting clearing once some overgrowth is cleared', () => {
    const { content, state } = setup()
    expect(suggestions(state, content).some((s) => s.id === 'clear')).toBe(true)
    state.stats.cleared = 3
    expect(suggestions(state, content).some((s) => s.id === 'clear')).toBe(false)
  })

  it('points out a badly placed shelter and a ready upgrade', () => {
    const { content, state } = setup()
    state.milestones = Object.fromEntries(content.chapters[0]!.milestones.map((m) => [m.id, 0]))
    addShelter(state, content, 5, 11)
    expect(suggestions(state, content).map((s) => s.id)).toContain('shelter-spot')
    const good = addShelter(state, content, 2, 4)
    good.visits = 1
    state.unlocks.push('upgrade:natural-shelter')
    state.inventory = { twigs: 9, bark: 9, stones: 9 }
    expect(suggestions(state, content).map((s) => s.id)).toContain('upgrade')
  })

  it('mentions materials lying around', () => {
    const { content, state } = setup()
    for (let i = 0; i < 3; i++) {
      state.drops.push({
        id: 100 + i,
        itemId: 'twigs',
        amount: 1,
        x: 2,
        y: 2,
        sourceId: 1,
        ageMs: 0,
      })
    }
    state.milestones = Object.fromEntries(content.chapters[0]!.milestones.map((m) => [m.id, 0]))
    expect(suggestions(state, content).map((s) => s.id)).toContain('gather')
  })
})

describe('grove suggestions', () => {
  function grove() {
    const s = setup(4)
    for (const m of s.content.chapters[0]!.milestones) s.state.milestones[m.id] = 0
    s.state.unlocks.push('area:bamboo-grove', s.content.chapters[0]!.completionUnlock)
    return s
  }

  it('points to bamboo ready to harvest', () => {
    const { content, state } = grove()
    state.milestones['into-the-grove'] = 0
    state.milestones['a-way-forward'] = 0
    state.milestones['bamboo-and-understory'] = 0
    expect(suggestions(state, content).map((s) => s.id)).toContain('harvest')
  })

  it('points to a restoration stage that is ready', () => {
    const { content, state } = grove()
    state.projects['restore-grove'] = {
      active: ['shaded-corner'],
      stagesDone: [],
      approachesDone: [],
    }
    state.stats.clearedIn['bamboo-grove'] = 4
    expect(suggestions(state, content).map((s) => s.id)).toContain('stage-ready')
  })
})

describe('journal hints', () => {
  it('grow more specific as milestones are reached', async () => {
    const { currentHint } = await import('./journal')
    const { content, state } = setup()
    expect(currentHint(state, content, 'wildlife:white-eye')).toBeUndefined()
    state.milestones['into-the-grove'] = 0
    expect(currentHint(state, content, 'wildlife:white-eye')).toMatch(/tall, dense growth/)
    state.milestones['bamboo-and-understory'] = 0
    expect(currentHint(state, content, 'wildlife:white-eye')).toMatch(/mature bamboo/)
    state.journal['wildlife:white-eye'] = { discoveredAtMs: 0, encounters: 1 }
    expect(currentHint(state, content, 'wildlife:white-eye')).toBeUndefined()
  })
})
