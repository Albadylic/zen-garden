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
    state.milestones = Object.fromEntries(content.chapter.milestones.map((m) => [m.id, 0]))
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
    state.milestones = Object.fromEntries(content.chapter.milestones.map((m) => [m.id, 0]))
    expect(suggestions(state, content).map((s) => s.id)).toContain('gather')
  })
})
