import { describe, expect, it } from 'vitest'
import { advance, createGame, SAVE_VERSION } from './game'

describe('game', () => {
  it('creates a fresh game at time zero', () => {
    expect(createGame()).toEqual({ version: SAVE_VERSION, elapsedMs: 0 })
  })

  it('advances time without mutating the previous state', () => {
    const start = createGame()
    const next = advance(start, 1500)
    expect(next.elapsedMs).toBe(1500)
    expect(start.elapsedMs).toBe(0)
  })

  it('rejects negative or non-finite deltas', () => {
    const state = createGame()
    expect(() => advance(state, -1)).toThrow(RangeError)
    expect(() => advance(state, Number.NaN)).toThrow(RangeError)
  })
})
