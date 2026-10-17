import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant } from '../test/helpers'
import type { GameEvent } from './events'
import { encounter, journalEntries, knownFacts, observe, recordJournal } from './journal'
import { plant } from './plants'
import { advance } from './simulation'

describe('journal', () => {
  it('lists an entry for every plant, creature, structure and item', () => {
    const { content } = setup()
    const n =
      Object.keys(content.plants).length +
      Object.keys(content.wildlife).length +
      Object.keys(content.structures).length +
      Object.keys(content.items).length
    expect(journalEntries(content)).toHaveLength(n)
  })

  it('starts out knowing the items the player carries', () => {
    const { state } = setup()
    expect(state.journal['item:twigs']).toBeDefined()
    expect(state.journal['wildlife:small-white']).toBeUndefined()
  })

  it('discovers an entry on first encounter and reveals facts with more', () => {
    const { content, state } = setup()
    const events: GameEvent[] = []
    encounter(state, content, 'wildlife:small-white', events)
    expect(events).toEqual([
      { type: 'discovery', key: 'wildlife:small-white', name: 'Small white butterfly' },
    ])
    expect(knownFacts(state, content, 'wildlife:small-white')).toHaveLength(1)
    encounter(state, content, 'wildlife:small-white', events)
    encounter(state, content, 'wildlife:small-white', events)
    expect(events.at(-1)).toMatchObject({ type: 'factRevealed', key: 'wildlife:small-white' })
    expect(knownFacts(state, content, 'wildlife:small-white')).toHaveLength(2)
  })

  it('records encounters from game events', () => {
    const { content, state } = setup()
    const result = plant(state, content, 'fern', 2, 4)
    if (!result.ok) throw new Error('plant failed')
    const out = recordJournal(state, content, result.events)
    expect(out).toContainEqual({ type: 'discovery', key: 'plant:fern', name: 'Fern' })
  })

  it('discovers visitors as they arrive during the simulation', () => {
    const { content, state } = setup(3)
    addPlant(state, content, 'wildflower-mix', 5, 11)
    const events: GameEvent[] = []
    for (let i = 0; i < 15 * 60; i++) events.push(...advance(state, content, 1000))
    expect(events.some((e) => e.type === 'discovery' && e.key === 'wildlife:small-white')).toBe(
      true,
    )
    expect(state.journal['wildlife:small-white']!.encounters).toBe(state.stats.seen['small-white'])
  })

  it('records an observation only once', () => {
    const { content, state } = setup()
    expect(observe(state, content, 'plant:old-pine')).toHaveLength(1)
    expect(observe(state, content, 'plant:old-pine')).toHaveLength(0)
    expect(state.journal['plant:old-pine']!.encounters).toBe(1)
  })
})
