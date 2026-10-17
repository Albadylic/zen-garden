import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant, addShelter } from '../test/helpers'
import type { GameEvent } from './events'
import { tierOf, upgradeOptions, upgradeStructure } from './habitats'
import { advance } from './simulation'
import { companionsPresent } from './wildlife'

function ready(level = 0) {
  const { content, state } = setup(2)
  const shelter = addShelter(state, content, 3, 4, level)
  state.unlocks.push('upgrade:natural-shelter')
  state.inventory = {
    twigs: 20,
    bark: 20,
    stones: 20,
    'leaf-litter': 20,
    'bamboo-canes': 20,
    'maple-leaves': 20,
  }
  return { content, state, shelter }
}

function shade(s: ReturnType<typeof ready>) {
  addPlant(s.state, s.content, 'fern', 3, 3)
  addPlant(s.state, s.content, 'fern', 2, 5)
  addPlant(s.state, s.content, 'fern', 4, 5)
}

function arrivals(s: ReturnType<typeof ready>, minutes: number): Set<string> {
  const seen = new Set<string>()
  for (let i = 0; i < minutes * 60; i++) {
    for (const e of advance(s.state, s.content, 1000) as GameEvent[]) {
      if (e.type === 'wildlifeArrived') seen.add(e.speciesId)
    }
  }
  return seen
}

describe('shelter upgrades', () => {
  it('is locked until discovered', () => {
    const { content, state } = setup()
    const shelter = addShelter(state, content, 3, 4)
    expect(upgradeOptions(state, content, shelter).map((o) => o.status.kind)).toEqual(['locked'])
  })

  it('waits for wildlife to use the shelter first', () => {
    const { content, state, shelter } = ready()
    expect(upgradeOptions(state, content, shelter)[0]!.status).toEqual({
      kind: 'needsVisits',
      visits: 0,
      needed: 1,
    })
    expect(upgradeStructure(state, content, shelter.id).ok).toBe(false)
  })

  it('upgrades, pays its cost and starts producing leaf litter', () => {
    const { content, state, shelter } = ready()
    shelter.visits = 1
    expect(upgradeStructure(state, content, shelter.id).ok).toBe(true)
    expect(shelter.level).toBe(1)
    expect(state.inventory.twigs).toBe(16)
    advance(state, content, 11 * 60_000, { offline: true })
    expect(state.drops.some((d) => d.sourceId === shelter.id && d.itemId === 'leaf-litter')).toBe(
      true,
    )
  })

  it('reports missing materials', () => {
    const { content, state, shelter } = ready()
    shelter.visits = 1
    state.inventory = { twigs: 1 }
    expect(upgradeOptions(state, content, shelter)[0]!.status.kind).toBe('needsItems')
  })

  it('attracts wrens once improved and well placed', () => {
    const s = ready()
    shade(s)
    s.shelter.visits = 1
    upgradeStructure(s.state, s.content, s.shelter.id)
    expect(arrivals(s, 60).has('wren')).toBe(true)
  })

  it('only draws wrens to a garden already busy with insects', () => {
    const s = ready()
    shade(s)
    s.shelter.visits = 1
    upgradeStructure(s.state, s.content, s.shelter.id)
    const wren = s.content.wildlife.wren!
    const quiet = { ...s, content: { ...s.content, wildlife: { ...s.content.wildlife } } }
    // The same garden, but the wren now needs more insects than could ever be present.
    quiet.content.wildlife.wren = { ...wren, alongside: { ...wren.alongside!, count: 99 } }
    expect(arrivals(quiet, 60).has('wren')).toBe(false)
  })
})

describe('arriving alongside other wildlife', () => {
  it('counts the companions present in the sanctuary', () => {
    const { content, state } = setup()
    const wren = content.wildlife.wren!
    expect(companionsPresent(state, wren)).toBe(false)
    const visitor = (id: number, speciesId: string) =>
      ({ id, speciesId }) as (typeof state.creatures)[number]
    state.creatures.push(visitor(1, 'bumblebee'))
    expect(companionsPresent(state, wren)).toBe(false)
    state.creatures.push(visitor(2, 'ground-beetle'))
    expect(companionsPresent(state, wren)).toBe(true)
    expect(companionsPresent(state, content.wildlife['small-white']!)).toBe(true)
  })
})

describe('the Mossy log lodge', () => {
  it('follows the Sheltered log pile once several residents have visited', () => {
    const { content, state, shelter } = ready(1)
    state.inventory['seed-bundle'] = 1
    const lodge = upgradeOptions(state, content, shelter)
    expect(lodge.map((o) => o.def.name)).toEqual(['Mossy log lodge'])
    expect(lodge[0]!.status).toEqual({ kind: 'needsVisits', visits: 0, needed: 3 })
    shelter.visits = 3
    expect(upgradeStructure(state, content, shelter.id).ok).toBe(true)
    expect(tierOf(content, shelter)).toBe(2)
    expect(state.inventory['seed-bundle'] ?? 0).toBe(0)
  })

  it('needs a seed bundle', () => {
    const { content, state, shelter } = ready(1)
    shelter.visits = 3
    expect(upgradeOptions(state, content, shelter)[0]!.status.kind).toBe('needsItems')
  })
})

describe('branching upgrades', () => {
  it('offers three branches from the Mossy log lodge once discovered', () => {
    const { content, state, shelter } = ready(5)
    shelter.visits = 1
    const options = upgradeOptions(state, content, shelter)
    expect(options.map((o) => o.def.branch)).toEqual([
      'insect-hotel',
      'log-lodge',
      'nesting-bundle',
    ])
    expect(options.every((o) => o.status.kind === 'locked')).toBe(true)
    state.unlocks.push('branch:natural-shelter')
    expect(upgradeOptions(state, content, shelter).every((o) => o.status.kind === 'ready')).toBe(
      true,
    )
  })

  it('takes the chosen branch and records it', () => {
    const { content, state, shelter } = ready(5)
    shelter.visits = 1
    state.unlocks.push('branch:natural-shelter')
    const lodge = upgradeOptions(state, content, shelter).find((o) => o.def.branch === 'log-lodge')!
    expect(upgradeStructure(state, content, shelter.id, lodge.level).ok).toBe(true)
    expect(content.structures['natural-shelter']!.levels[shelter.level]!.branch).toBe('log-lodge')
    expect(tierOf(content, shelter)).toBe(3)
    expect(state.stats.branched['log-lodge']).toBe(1)
    expect(upgradeOptions(state, content, shelter)).toEqual([])
  })

  it('keeps every branch open by building another shelter', () => {
    const { content, state } = ready(5)
    state.unlocks.push('branch:natural-shelter')
    const second = addShelter(state, content, 2, 4, 5)
    second.visits = 1
    expect(upgradeOptions(state, content, second)).toHaveLength(3)
  })

  it('draws different residents to each branch', () => {
    for (const [branch, species] of [
      ['insect-hotel', 'mason-bee'],
      ['log-lodge', 'wood-mouse'],
    ] as const) {
      const s = ready(5)
      shade(s)
      s.shelter.visits = 1
      s.state.unlocks.push('branch:natural-shelter')
      const option = upgradeOptions(s.state, s.content, s.shelter).find(
        (o) => o.def.branch === branch,
      )!
      upgradeStructure(s.state, s.content, s.shelter.id, option.level)
      const seen = arrivals(s, 40)
      expect(seen.has(species)).toBe(true)
      for (const other of ['mason-bee', 'wood-mouse'].filter((x) => x !== species))
        expect(seen.has(other)).toBe(false)
    }
  })
})
