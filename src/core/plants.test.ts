import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import type { GameEvent } from './events'
import { entityAt, terrainAt } from './grid'
import { growthRate, isSlowGrowing, plant, timeToMaturity, timeToNextStage, water } from './plants'
import { advance } from './simulation'
import type { PlantEntity } from './state'

const MIN = 60_000

function planted(state: ReturnType<typeof setup>['state'], x: number, y: number): PlantEntity {
  const e = entityAt(state, x, y)
  if (e?.kind !== 'plant') throw new Error(`no plant at ${x},${y}`)
  return e
}

describe('planting', () => {
  it('uses one seed and creates a plant at its first stage', () => {
    const { content, state } = setup()
    const seeds = state.inventory['wildflower-seeds']!
    const result = plant(state, content, 'wildflower-mix', 5, 11)
    expect(result.ok).toBe(true)
    expect(state.inventory['wildflower-seeds']).toBe(seeds - 1)
    expect(planted(state, 5, 11).stage).toBe(0)
    expect(state.stats.planted['wildflower-mix']).toBe(1)
  })

  it('refuses without seeds or on the wrong terrain', () => {
    const { content, state } = setup()
    expect(plant(state, content, 'soft-rush', 5, 11)).toMatchObject({
      ok: false,
      reason: "Soft rush can't go on grass",
    })
    state.inventory['maple-seeds'] = 0
    expect(plant(state, content, 'japanese-maple', 5, 11)).toMatchObject({ ok: false })
    expect(plant(state, content, 'old-pine', 5, 11)).toMatchObject({
      ok: false,
      reason: 'This cannot be planted',
    })
  })
})

describe('growth', () => {
  it('moves through stages over real time and flowers', () => {
    const { content, state } = setup()
    plant(state, content, 'wildflower-mix', 5, 11)
    const events: GameEvent[] = []
    for (let i = 0; i < 8; i++) events.push(...advance(state, content, MIN))
    const p = planted(state, 5, 11)
    expect(p.stage).toBe(3)
    expect(events.filter((e) => e.type === 'plantStage')).toHaveLength(3)
    expect(events.some((e) => e.type === 'flowering')).toBe(true)
    expect(state.stats.flowered).toBe(1)
    expect(timeToNextStage(state, content, p)).toBeNull()
  })

  it('grows faster in a suitable spot than an unsuitable one', () => {
    const { content, state } = setup()
    plant(state, content, 'wildflower-mix', 5, 11) // open, sunny
    plant(state, content, 'wildflower-mix', 2, 4) // damp shade under the pines
    const sunny = planted(state, 5, 11)
    const shady = planted(state, 2, 4)
    expect(growthRate(state, content, sunny)).toBeGreaterThan(growthRate(state, content, shady))
    advance(state, content, 4 * MIN)
    expect(sunny.stage).toBeGreaterThan(shady.stage)
  })

  it('never lets a plant die, however long it is left', () => {
    const { content, state } = setup()
    plant(state, content, 'garden-moss', 5, 11) // poor spot for moss
    advance(state, content, 200 * 60 * MIN, { offline: true })
    expect(planted(state, 5, 11).stage).toBe(2)
  })

  it('speeds growth while watered', () => {
    const { content, state } = setup()
    plant(state, content, 'fern', 2, 4)
    const fern = planted(state, 2, 4)
    const before = growthRate(state, content, fern)
    expect(water(state, content, fern.id).ok).toBe(true)
    expect(growthRate(state, content, fern)).toBeCloseTo(before * 1.5)
    expect(water(state, content, fern.id)).toMatchObject({ ok: false, reason: 'Already watered' })
    advance(state, content, 11 * MIN)
    expect(fern.wateredMs).toBe(0)
  })
})

describe('moss', () => {
  it('spreads from a mature carpet onto shaded grass', () => {
    const { content, state } = setup(5)
    plant(state, content, 'garden-moss', 3, 5)
    const moss = () => state.gardens['forgotten-garden']!.terrain.filter((t) => t === 'moss').length
    const before = moss()
    advance(state, content, 12 * 60 * MIN, { offline: true })
    const after = moss()
    expect(after).toBeGreaterThan(before)
    expect(terrainAt(state, 5, 11)).toBe('grass')
  })
})

describe('time to maturity', () => {
  it('adds up the stages still to come', () => {
    const { content, state } = setup()
    plant(state, content, 'japanese-maple', 6, 6)
    const p = planted(state, 6, 6)
    const rate = growthRate(state, content, p)
    const total = content.plants['japanese-maple']!.stages.reduce(
      (n, s) => n + (s.durationSec ?? 0) * 1000,
      0,
    )
    expect(timeToMaturity(state, content, p)).toBeCloseTo(total / rate)
    expect(timeToMaturity(state, content, p)).toBeGreaterThan(timeToNextStage(state, content, p)!)
  })

  it('treats the maple as slow growing but not wildflowers', () => {
    const { content } = setup()
    expect(isSlowGrowing(content, 'japanese-maple')).toBe(true)
    expect(isSlowGrowing(content, 'wildflower-mix')).toBe(false)
  })
})
