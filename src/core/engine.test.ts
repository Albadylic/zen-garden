// Engine features that later chapters build on, checked with small changes
// to a copy of the content.

import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant, addShelter } from '../test/helpers'
import type { Content, PlantDef, WildlifeDef } from './content'
import type { GameEvent } from './events'
import { fillFeeder } from './feeders'
import { checkPlacement } from './layout'
import { conditionProgress } from './progression'
import { produce } from './resources'
import { currentSeason, inSeason, SEASON_MS, SEASONS_UNLOCK } from './seasons'
import { advance } from './simulation'
import { companionsPresent, nectarAvailable } from './wildlife'

const MIN = 60_000

function withPlant(content: Content, id: string, change: Partial<PlantDef>): Content {
  return { ...content, plants: { ...content.plants, [id]: { ...content.plants[id]!, ...change } } }
}

function withWildlife(content: Content, id: string, change: Partial<WildlifeDef>): Content {
  return {
    ...content,
    wildlife: { ...content.wildlife, [id]: { ...content.wildlife[id]!, ...change } },
  }
}

describe('plants that need a neighbour', () => {
  it('only grow within reach of what they need', () => {
    const base = setup()
    const content = withPlant(base.content, 'fern', {
      near: { ids: ['old-boulder'], distance: 1.5 },
    })
    const fern = { kind: 'plant', defId: 'fern' } as const
    // The old boulder stands at (5, 8).
    expect(checkPlacement(base.state, content, fern, 6, 11)).toMatchObject({
      ok: false,
      reason: 'Only grows beside old boulder',
    })
    expect(checkPlacement(base.state, content, fern, 5, 9).ok).toBe(true)
  })
})

describe('seasons', () => {
  it('have not begun until unlocked, so everything is in season', () => {
    const { state } = setup()
    expect(currentSeason(state)).toBeNull()
    expect(inSeason(state, ['winter'])).toBe(true)
  })

  it('turn every hour once begun, and are noted as they arrive', () => {
    const { content, state } = setup()
    state.unlocks.push(SEASONS_UNLOCK)
    const events: GameEvent[] = []
    events.push(...advance(state, content, 1000, { offline: true }))
    expect(currentSeason(state)).toBe('spring')
    expect(inSeason(state, ['winter'])).toBe(false)
    events.push(...advance(state, content, SEASON_MS, { offline: true }))
    expect(currentSeason(state)).toBe('summer')
    expect(events.filter((e) => e.type === 'seasonBegan').length).toBe(2)
    expect(conditionProgress(state, content, { kind: 'seasonsSeen', count: 4 }).current).toBe(2)
  })

  it('limit flowering to a plant’s seasons', () => {
    const base = setup()
    const content = withPlant(base.content, 'wildflower-mix', { flowerSeasons: ['autumn'] })
    const { state } = base
    addPlant(state, content, 'wildflower-mix', 6, 8)
    expect(nectarAvailable(state, content)).toBeGreaterThan(0)
    state.unlocks.push(SEASONS_UNLOCK)
    expect(nectarAvailable(state, content)).toBe(0)
  })
})

describe('structures that work while filled', () => {
  it('only produce while they hold something', () => {
    const base = setup()
    const sap = base.content.structures['sap-feeder']!
    const content: Content = {
      ...base.content,
      structures: {
        ...base.content.structures,
        'sap-feeder': {
          ...sap,
          feeder: { ...sap.feeder!, whileFilled: true },
          levels: [
            {
              ...sap.levels[0]!,
              produces: [{ item: 'twigs', everySec: 60, amount: 1, minStage: 0 }],
            },
          ],
        },
      },
    }
    const { state } = base
    state.entities.push({
      id: state.nextId++,
      kind: 'structure',
      defId: 'sap-feeder',
      x: 6,
      y: 8,
      level: 0,
      visits: 0,
      produceMs: [0],
      fixed: false,
    })
    const ctx = { offline: true, events: [] as GameEvent[] }
    const feederId = state.entities.at(-1)!.id
    const fromFeeder = () => state.drops.filter((d) => d.sourceId === feederId)
    produce(state, content, 2 * MIN, ctx)
    expect(fromFeeder()).toHaveLength(0)
    state.inventory['maple-sap'] = 1
    fillFeeder(state, content, feederId)
    produce(state, content, 2 * MIN, ctx)
    expect(fromFeeder().length).toBeGreaterThan(0)
  })
})

describe('wildlife in each garden', () => {
  it('counts companions only in the same garden', () => {
    const { content, state } = setup()
    const wren = content.wildlife.wren!
    const garden = content.world.gardens[0]!
    const grove = content.world.gardens[1]!
    const visitor = (id: number, speciesId: string, x: number, y: number) =>
      ({ id, speciesId, x, y }) as (typeof state.creatures)[number]
    state.creatures.push(visitor(1, 'bumblebee', 3.5, -5.5), visitor(2, 'ground-beetle', 4.5, -5.5))
    expect(companionsPresent(state, wren, content, grove)).toBe(true)
    expect(companionsPresent(state, wren, content, garden)).toBe(false)
  })

  it('arrive from the walls of the garden they are visiting', () => {
    const { content, state } = setup(2)
    state.unlocks.push('area:bamboo-grove')
    for (const [x, y] of [
      [1, -6],
      [2, -6],
      [3, -6],
    ] as const)
      addPlant(state, content, 'wildflower-mix', x, y)
    const events = advance(state, content, 20 * MIN, { offline: true })
    const arrived = events.filter((e) => e.type === 'wildlifeArrived')
    expect(arrived.length).toBeGreaterThan(0)
    // Only the grove has flowers, so every nectar visitor is in the grove.
    for (const c of state.creatures) expect(c.y).toBeLessThan(0)
  })

  it('visitors that love variety need several kinds of flower', () => {
    const base = setup(2)
    const content = withWildlife(base.content, 'small-white', {
      attraction: { kind: 'nectar', minNectar: 1, minSpecies: 2, perMinute: 2 },
    })
    const { state } = base
    addPlant(state, content, 'wildflower-mix', 6, 8)
    addPlant(state, content, 'wildflower-mix', 6, 9)
    let events = advance(state, content, 10 * MIN, { offline: true })
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'small-white')).toBe(
      false,
    )
    const second = { ...content.plants['wildflower-mix']!, id: 'second-flower' }
    const both: Content = { ...content, plants: { ...content.plants, 'second-flower': second } }
    addPlant(state, both, 'second-flower', 7, 9)
    events = advance(state, both, 10 * MIN, { offline: true })
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'small-white')).toBe(
      true,
    )
  })

  it('perch on decorations as well as plants', () => {
    const base = setup(2)
    const content = withWildlife(base.content, 'white-eye', {
      attraction: { kind: 'perch', plants: [], things: ['old-boulder'], minCount: 1, perMinute: 2 },
    })
    addShelter(base.state, content, 3, 4)
    const events = advance(base.state, content, 20 * MIN, { offline: true })
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'white-eye')).toBe(
      true,
    )
  })
})

describe('new conditions', () => {
  it('count plants beside water, species in a garden and open water', () => {
    const { content, state } = setup()
    addPlant(state, content, 'soft-rush', 10, 5)
    addPlant(state, content, 'fern', 2, 6)
    const garden = 'forgotten-garden'
    expect(
      conditionProgress(state, content, {
        kind: 'plantedBeside',
        garden,
        terrain: ['water'],
        count: 1,
      }).current,
    ).toBe(1)
    expect(conditionProgress(state, content, { kind: 'speciesIn', garden, count: 2 }).current).toBe(
      2,
    )
    // The pond has nine open water tiles.
    expect(conditionProgress(state, content, { kind: 'openWater', garden, count: 1 }).current).toBe(
      9,
    )
  })
})
