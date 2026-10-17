import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { advance, OFFLINE_STEP_MS, ONLINE_STEP_MS } from './simulation'

describe('simulation clock', () => {
  it('advances elapsed time in whole steps and keeps the remainder', () => {
    const { content, state } = setup()
    advance(state, content, ONLINE_STEP_MS * 3 + 10)
    expect(state.elapsedMs).toBe(ONLINE_STEP_MS * 3)
    expect(state.pendingMs).toBe(10)
    advance(state, content, ONLINE_STEP_MS - 10)
    expect(state.elapsedMs).toBe(ONLINE_STEP_MS * 4)
  })

  it('uses coarser steps offline', () => {
    const { content, state } = setup()
    advance(state, content, OFFLINE_STEP_MS * 2, { offline: true })
    expect(state.elapsedMs).toBe(OFFLINE_STEP_MS * 2)
  })

  it('rejects negative or non-finite deltas', () => {
    const { content, state } = setup()
    expect(() => advance(state, content, -1)).toThrow(RangeError)
    expect(() => advance(state, content, Number.NaN)).toThrow(RangeError)
  })

  it('is deterministic for the same seed', () => {
    const a = setup(9)
    const b = setup(9)
    advance(a.state, a.content, 60_000)
    advance(b.state, b.content, 60_000)
    expect(a.state).toEqual(b.state)
  })
})
