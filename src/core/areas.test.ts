import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { areaAt, isTileOpen, visitArea } from './areas'
import { checkPlacement } from './layout'
import { clearOvergrowth } from './resources'

const stone = { kind: 'decoration', defId: 'stepping-stone' } as const

describe('areas', () => {
  it('assigns tiles to the garden or the grove', () => {
    const { content } = setup()
    expect(areaAt(content, 5, 5)?.id).toBe('forgotten-garden')
    expect(areaAt(content, 20, 5)?.id).toBe('bamboo-grove')
  })

  it('keeps the grove closed until its unlock', () => {
    const { content, state } = setup()
    expect(isTileOpen(state, content, 5, 5)).toBe(true)
    expect(isTileOpen(state, content, 20, 5)).toBe(false)
    expect(checkPlacement(state, content, stone, 20, 4)).toMatchObject({
      ok: false,
      reason: 'That part of the garden is not open yet',
    })
    expect(clearOvergrowth(state, content, 17, 4).ok).toBe(false)
    expect(visitArea(state, content, 20, 4)).toBe(false)
    state.unlocks.push('area:bamboo-grove')
    expect(checkPlacement(state, content, stone, 20, 4)).toEqual({ ok: true })
    expect(clearOvergrowth(state, content, 17, 4).ok).toBe(true)
    expect(state.stats.clearedIn['bamboo-grove']).toBe(1)
  })

  it('records a first look around an open area once', () => {
    const { content, state } = setup()
    state.unlocks.push('area:bamboo-grove')
    expect(visitArea(state, content, 20, 4)).toBe(true)
    expect(visitArea(state, content, 21, 4)).toBe(false)
    expect(state.areasVisited).toEqual(['bamboo-grove'])
  })
})
