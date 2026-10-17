import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { gardenAt, isGateOpen, isTileOpen, visitGarden } from './gardens'
import { checkPlacement } from './layout'
import { clearOvergrowth } from './resources'

const stone = { kind: 'decoration', defId: 'stepping-stone' } as const

describe('gardens', () => {
  it('assigns tiles to the garden or the grove', () => {
    const { content } = setup()
    expect(gardenAt(content, 5, 5)?.id).toBe('forgotten-garden')
    expect(gardenAt(content, 3, -6)?.id).toBe('bamboo-grove')
  })

  it('keeps the grove closed until its unlock', () => {
    const { content, state } = setup()
    expect(isTileOpen(state, content, 5, 5)).toBe(true)
    expect(isTileOpen(state, content, 3, -6)).toBe(false)
    expect(checkPlacement(state, content, stone, 2, -6)).toMatchObject({
      ok: false,
      reason: 'That part of the garden is not open yet',
    })
    expect(clearOvergrowth(state, content, 2, -3).ok).toBe(false)
    expect(visitGarden(state, content, 2, -6)).toBe(false)
    state.unlocks.push('area:bamboo-grove')
    expect(checkPlacement(state, content, stone, 2, -6)).toEqual({ ok: true })
    expect(clearOvergrowth(state, content, 2, -3).ok).toBe(true)
    expect(state.stats.clearedIn['bamboo-grove']).toBe(1)
  })

  it('opens the return gate only once the Noble Garden is restored', () => {
    const { content, state } = setup()
    const gate = content.world.gates.find(
      (g) => g.to === 'noble-garden' && g.from === 'forgotten-garden',
    )!
    state.unlocks.push('chapter:four-seasons-garden')
    expect(isGateOpen(state, content, gate)).toBe(false)
    state.unlocks.push('chapter:noble-garden')
    expect(isGateOpen(state, content, gate)).toBe(true)
  })

  it('records a first look around an open garden once', () => {
    const { content, state } = setup()
    state.unlocks.push('area:bamboo-grove')
    expect(visitGarden(state, content, 2, -6)).toBe(true)
    expect(visitGarden(state, content, 2, -7)).toBe(false)
    expect(state.gardensVisited).toEqual(['bamboo-grove'])
  })
})
