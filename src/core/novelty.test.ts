import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { markChoicesSeen, newChoices, panelChoices } from './novelty'
import { deserialize, serialize } from './save'

describe('new choices', () => {
  it('starts a garden with nothing new', () => {
    const { content, state } = setup()
    for (const panel of ['plants', 'build', 'inventory'] as const)
      expect(newChoices(state, content, panel)).toEqual([])
    expect(panelChoices(state, content, 'plants')).toContain('plant:wildflower-mix')
  })

  it('marks a newly unlocked recipe and a newly found seed until their panel is seen', () => {
    const { content, state } = setup()
    state.unlocks.push('recipe:natural-shelter')
    state.inventory['bamboo-shoots'] = 1
    expect(newChoices(state, content, 'build')).toEqual(['recipe:natural-shelter'])
    expect(newChoices(state, content, 'plants')).toEqual(['plant:bamboo'])
    expect(newChoices(state, content, 'inventory')).toEqual(['item:bamboo-shoots'])
    expect(markChoicesSeen(state, content, 'build')).toBe(true)
    expect(newChoices(state, content, 'build')).toEqual([])
    // Seeing one panel leaves the others' news alone.
    expect(newChoices(state, content, 'plants')).toEqual(['plant:bamboo'])
  })

  it('treats everything on offer in an older save as seen', () => {
    const { content, state } = setup()
    state.unlocks.push('recipe:natural-shelter')
    const raw = JSON.parse(JSON.stringify(serialize(state, 1)))
    delete raw.state.seenChoices
    const loaded = deserialize(raw, content).state
    expect(newChoices(loaded, content, 'build')).toEqual([])
  })
})

describe('panel groups', () => {
  it('gives every plant with seeds and every thing to build a group', () => {
    const { content } = setup()
    for (const p of Object.values(content.plants)) if (p.seedItem) expect(p.group).toBeDefined()
    for (const r of Object.values(content.recipes))
      if (r.output.kind !== 'item') expect(r.group).toBeDefined()
  })
})
