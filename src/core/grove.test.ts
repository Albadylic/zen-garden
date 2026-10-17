import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant } from '../test/helpers'
import type { GameEvent } from './events'
import { fillFeeder, isFilled } from './feeders'
import { entityAt } from './grid'
import { buildRecipe } from './layout'
import { harvest, harvestStatus } from './plants'
import { advance } from './simulation'
import type { PlantEntity, StructureEntity } from './state'

const MIN = 60_000

function grove() {
  const s = setup(4)
  s.state.unlocks.push('area:bamboo-grove')
  return s
}

function run(s: ReturnType<typeof grove>, ms: number) {
  const events: GameEvent[] = []
  for (let t = 0; t < ms; t += 1000) events.push(...advance(s.state, s.content, 1000))
  return events
}

describe('bamboo', () => {
  it('can be harvested for canes, then recovers', () => {
    const { content, state } = grove()
    const clump = entityAt(state, -1, -5) as PlantEntity
    expect(clump.defId).toBe('bamboo')
    expect(harvestStatus(content, clump).kind).toBe('ready')
    const result = harvest(state, content, clump.id)
    expect(result.ok).toBe(true)
    expect(state.inventory['bamboo-canes']).toBe(2)
    expect(state.stats.gathered['bamboo-canes']).toBe(2)
    expect(harvest(state, content, clump.id)).toMatchObject({
      ok: false,
      reason: 'It needs time to recover',
    })
    advance(state, content, 11 * MIN, { offline: true })
    expect(harvestStatus(content, clump).kind).toBe('ready')
  })

  it('cannot be harvested before it matures', () => {
    const { content, state } = grove()
    const young = addPlant(state, content, 'bamboo', 2, -6, 0)
    expect(harvest(state, content, young.id)).toMatchObject({
      ok: false,
      reason: 'Not ready to harvest yet',
    })
  })

  it('slowly spreads new young clumps nearby, but not without limit', () => {
    const { content, state } = grove()
    const before = state.entities.filter((e) => e.defId === 'bamboo').length
    advance(state, content, 8 * 60 * MIN, { offline: true })
    const after = state.entities.filter((e) => e.defId === 'bamboo')
    expect(after.length).toBeGreaterThan(before)
    for (const b of after) {
      const near = after.filter((o) => Math.hypot(o.x - b.x, o.y - b.y) <= 1.5)
      expect(near.length).toBeLessThanOrEqual(5)
    }
  })

  it('does not spread into the grove before it opens', () => {
    const { content, state } = setup(4)
    const before = state.entities.length
    advance(state, content, 8 * 60 * MIN, { offline: true })
    expect(state.entities.filter((e) => e.defId === 'bamboo').length).toBe(
      content.world.fixed.filter((f) => f.id === 'bamboo').length,
    )
    expect(state.entities.length).toBe(before)
  })
})

describe('maple', () => {
  it('yields leaves and sap once mature', () => {
    const { content, state } = grove()
    const maple = addPlant(state, content, 'japanese-maple', 6, 4)
    advance(state, content, 60 * MIN, { offline: true })
    const items = new Set(state.drops.filter((d) => d.sourceId === maple.id).map((d) => d.itemId))
    expect(items.has('maple-leaves')).toBe(true)
    expect(items.has('maple-sap')).toBe(true)
  })
})

describe('grove wildlife', () => {
  it('white-eyes come to established bamboo', () => {
    const s = grove()
    const events = run(s, 20 * MIN)
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'white-eye')).toBe(
      true,
    )
  })

  it('red admirals visit a filled sap feeder, and stop once it empties', () => {
    const s = grove()
    const { content, state } = s
    state.unlocks.push('recipe:sap-feeder')
    state.inventory['bamboo-canes'] = 4
    state.inventory['maple-sap'] = 2
    expect(buildRecipe(state, content, 'sap-feeder', 4, -6).ok).toBe(true)
    const feeder = entityAt(state, 4, -6) as StructureEntity
    expect(isFilled(feeder)).toBe(true)
    const events = run(s, 15 * MIN)
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'red-admiral')).toBe(
      true,
    )
    advance(state, content, 2 * 60 * MIN, { offline: true })
    expect(isFilled(feeder)).toBe(false)
    expect(fillFeeder(state, content, feeder.id).ok).toBe(true)
    expect(state.inventory['maple-sap'] ?? 0).toBe(0)
    expect(fillFeeder(state, content, feeder.id).ok).toBe(false)
  })
})
