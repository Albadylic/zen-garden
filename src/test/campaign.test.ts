import { describe, expect, it } from 'vitest'
import { playAll } from './autoplay'
import { setup } from './fixtures'

// Plays the whole first batch from a fresh garden, chapter by chapter, the way
// a patient player would. Every chapter must be finishable, in order.
describe('the whole campaign', () => {
  it('can be played from the first garden to the last', { timeout: 120_000 }, () => {
    const { content, state } = setup(3)
    const results = playAll(state, content)
    // Run with --silent=false to see how long each chapter took.
    console.log(results.map((r) => `${r.id}: ${r.minutes} min`).join(', '))
    expect(results.map((r) => r.id)).toEqual(content.chapters.map((c) => c.id))
    for (const r of results) {
      expect(r, `${r.id} got stuck on ${r.stuckOn}`).toMatchObject({ done: true })
      // A chapter should take a few hours of play at most, not days.
      expect(r.minutes).toBeLessThan(6 * 60)
    }
  })
})
