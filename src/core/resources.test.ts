import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { entityAt, terrainAt } from './grid'
import { plant } from './plants'
import { craftItem } from './layout'
import {
  AUTO_GATHER_MS,
  SEED_SOFT_CAP,
  clearOvergrowth,
  collectAll,
  collectDrop,
  DROP_CAP,
} from './resources'
import { advance } from './simulation'

const MIN = 60_000

describe('production', () => {
  it('lets the old pines drop twigs, bark and leaf litter', () => {
    const { content, state } = setup()
    advance(state, content, 5 * MIN, { offline: true })
    const pine = entityAt(state, 2, 2)!
    const items = new Set(state.drops.filter((d) => d.sourceId === pine.id).map((d) => d.itemId))
    expect(items).toEqual(new Set(['twigs', 'bark', 'leaf-litter']))
  })

  it('lets old boulders shed stones as they weather', () => {
    const { content, state } = setup()
    const boulder = state.entities.find((e) => e.defId === 'old-boulder')!
    advance(state, content, 7 * MIN, { offline: true })
    expect(state.drops.some((d) => d.sourceId === boulder.id && d.itemId === 'stones')).toBe(true)
  })

  it('caps how many items one source leaves lying around', () => {
    const { content, state } = setup()
    advance(state, content, 6 * 60 * MIN, { offline: true })
    const pine = entityAt(state, 2, 2)!
    const twigs = state.drops.filter((d) => d.sourceId === pine.id && d.itemId === 'twigs')
    expect(twigs).toHaveLength(DROP_CAP)
  })

  it('does not drop a new item the moment a full source is gathered', () => {
    const { content, state } = setup()
    advance(state, content, 6 * 60 * MIN, { offline: true })
    collectAll(state)
    advance(state, content, 10_000, { offline: true })
    expect(state.drops).toHaveLength(0)
  })

  it('only produces from plants once they reach the producing stage', () => {
    const { content, state } = setup()
    plant(state, content, 'wildflower-mix', 5, 11)
    const flowers = entityAt(state, 5, 11)!
    advance(state, content, 3 * MIN, { offline: true })
    expect(state.drops.some((d) => d.sourceId === flowers.id)).toBe(false)
    advance(state, content, 15 * MIN, { offline: true })
    expect(
      state.drops.some((d) => d.sourceId === flowers.id && d.itemId === 'wildflower-seeds'),
    ).toBe(true)
  })
})

describe('gathering', () => {
  it('collects one drop or all of them into the inventory', () => {
    const { content, state } = setup()
    advance(state, content, 10 * MIN, { offline: true })
    const twigs = state.inventory.twigs ?? 0
    const first = state.drops.find((d) => d.itemId === 'twigs')!
    expect(collectDrop(state, first.id).ok).toBe(true)
    expect(state.inventory.twigs).toBe(twigs + first.amount)
    const remaining = state.drops.length
    const result = collectAll(state)
    expect(result.ok).toBe(true)
    expect(state.drops).toHaveLength(0)
    expect(state.stats.collected).toBe(first.amount + remaining)
    expect(collectAll(state)).toMatchObject({ ok: false })
  })

  it('gathers items automatically while on screen, but not while away', () => {
    const { content, state } = setup()
    advance(state, content, 10 * MIN, { offline: true })
    expect(state.drops.length).toBeGreaterThan(0)
    expect(state.drops.every((d) => d.ageMs === 0)).toBe(true)
    const events = advance(state, content, AUTO_GATHER_MS)
    expect(state.drops.every((d) => d.ageMs < AUTO_GATHER_MS)).toBe(true)
    expect(events.some((e) => e.type === 'collected' && e.auto)).toBe(true)
  })
})

describe('clearing overgrowth', () => {
  it('turns an overgrown tile into grass and finds twigs', () => {
    const { content, state } = setup()
    const twigs = state.inventory.twigs ?? 0
    const result = clearOvergrowth(state, content, 6, 1)
    expect(result.ok).toBe(true)
    expect(terrainAt(state, 6, 1)).toBe('grass')
    expect(state.inventory.twigs).toBeGreaterThan(twigs)
    expect(state.stats.cleared).toBe(1)
    expect(clearOvergrowth(state, content, 6, 1)).toMatchObject({ ok: false })
  })
})

describe('seed supply', () => {
  it('pauses seed production while the player holds plenty', () => {
    const { content, state } = setup()
    plant(state, content, 'wildflower-mix', 5, 11)
    state.inventory['wildflower-seeds'] = SEED_SOFT_CAP
    advance(state, content, 3 * 60 * MIN, { offline: true })
    expect(state.drops.some((d) => d.itemId === 'wildflower-seeds')).toBe(false)
    state.inventory['wildflower-seeds'] = 2
    advance(state, content, 30 * MIN, { offline: true })
    expect(state.drops.some((d) => d.itemId === 'wildflower-seeds')).toBe(true)
  })

  it('sometimes finds seeds while clearing, but not past the same cap', () => {
    const { content, state } = setup()
    const overgrown: [number, number][] = []
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        if (terrainAt(state, x, y) === 'overgrown') overgrown.push([x, y])
    const before = state.inventory['wildflower-seeds'] ?? 0
    for (const [x, y] of overgrown.slice(0, 10)) clearOvergrowth(state, content, x, y)
    expect(state.inventory['wildflower-seeds']).toBeGreaterThan(before)

    state.inventory['wildflower-seeds'] = SEED_SOFT_CAP
    for (const [x, y] of overgrown.slice(10)) clearOvergrowth(state, content, x, y)
    expect(state.inventory['wildflower-seeds']).toBe(SEED_SOFT_CAP)
  })

  it('turns spare seeds into a seed bundle', () => {
    const { content, state } = setup()
    state.inventory['wildflower-seeds'] = 5
    state.inventory['leaf-litter'] = 1
    expect(craftItem(state, content, 'seed-bundle').ok).toBe(true)
    expect(state.inventory['seed-bundle']).toBe(1)
    expect(state.inventory['wildflower-seeds']).toBe(1)
    expect(craftItem(state, content, 'seed-bundle').ok).toBe(false)
  })
})
