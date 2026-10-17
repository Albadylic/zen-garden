import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant, addShelter } from '../test/helpers'
import { upgradeStatus, upgradeStructure } from './habitats'
import { advance } from './simulation'

describe('shelter upgrades', () => {
  function ready() {
    const { content, state } = setup(2)
    const shelter = addShelter(state, content, 3, 4)
    state.unlocks.push('upgrade:natural-shelter')
    state.inventory = { twigs: 10, bark: 10, stones: 10 }
    return { content, state, shelter }
  }

  it('is locked until discovered', () => {
    const { content, state } = setup()
    const shelter = addShelter(state, content, 3, 4)
    expect(upgradeStatus(state, content, shelter)).toEqual({ kind: 'locked' })
  })

  it('waits for wildlife to use the shelter first', () => {
    const { content, state, shelter } = ready()
    expect(upgradeStatus(state, content, shelter)).toEqual({
      kind: 'needsVisits',
      visits: 0,
      needed: 1,
    })
    expect(upgradeStructure(state, content, shelter.id).ok).toBe(false)
  })

  it('upgrades, pays its cost and starts producing leaf litter', () => {
    const { content, state, shelter } = ready()
    shelter.visits = 1
    const result = upgradeStructure(state, content, shelter.id)
    expect(result.ok).toBe(true)
    expect(shelter.level).toBe(1)
    expect(state.inventory).toEqual({ twigs: 6, bark: 7, stones: 8 })
    expect(upgradeStatus(state, content, shelter)).toEqual({ kind: 'max' })
    advance(state, content, 11 * 60_000, { offline: true })
    expect(state.drops.some((d) => d.sourceId === shelter.id && d.itemId === 'leaf-litter')).toBe(
      true,
    )
  })

  it('reports missing materials', () => {
    const { content, state, shelter } = ready()
    shelter.visits = 1
    state.inventory = { twigs: 1 }
    expect(upgradeStatus(state, content, shelter).kind).toBe('needsItems')
  })

  it('attracts wrens once improved and well placed', () => {
    const { content, state, shelter } = ready()
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    addPlant(state, content, 'fern', 4, 5)
    shelter.visits = 1
    upgradeStructure(state, content, shelter.id)
    let wren = false
    for (let i = 0; i < 60 * 60 && !wren; i++) {
      const events = advance(state, content, 1000)
      wren = events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'wren')
    }
    expect(wren).toBe(true)
  })
})
