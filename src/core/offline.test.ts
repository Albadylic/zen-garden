import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addPlant } from '../test/helpers'
import { catchUp, hasNews, OFFLINE_CAP_MS } from './offline'
import { plant } from './plants'

const HOUR = 60 * 60_000

describe('catching up on time away', () => {
  it('grows plants and leaves items waiting while away', () => {
    const { content, state } = setup(2)
    plant(state, content, 'wildflower-mix', 5, 11)
    const { recap } = catchUp(state, content, HOUR)
    expect(recap.stagesGrown).toBeGreaterThanOrEqual(3)
    expect(recap.matured).toContain('Wildflowers')
    expect(recap.itemsWaiting).toBeGreaterThan(0)
    expect(recap.capped).toBe(false)
    expect(hasNews(recap)).toBe(true)
  })

  it('caps the time simulated during a long absence', () => {
    const { content, state } = setup()
    const { recap } = catchUp(state, content, 3 * 24 * HOUR)
    expect(recap.simulatedMs).toBe(OFFLINE_CAP_MS)
    expect(recap.capped).toBe(true)
    expect(state.elapsedMs).toBe(OFFLINE_CAP_MS)
  })

  it('reports visitors and new species that arrived', () => {
    const { content, state } = setup(3)
    for (let i = 0; i < 3; i++) addPlant(state, content, 'wildflower-mix', 4 + i, 11)
    const { recap } = catchUp(state, content, 2 * HOUR)
    expect(recap.visits).toBeGreaterThan(0)
    expect(recap.newSpecies).toContain('Small white butterfly')
  })

  it('never loses anything, however long the absence', () => {
    const { content, state } = setup(4)
    plant(state, content, 'fern', 2, 4)
    const before = { entities: state.entities.length, inventory: { ...state.inventory } }
    catchUp(state, content, 30 * 24 * HOUR)
    expect(state.entities.length).toBeGreaterThanOrEqual(before.entities)
    for (const [id, n] of Object.entries(before.inventory))
      expect(state.inventory[id] ?? 0).toBeGreaterThanOrEqual(n)
  })
})
