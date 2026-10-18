import { describe, expect, it } from 'vitest'
import { setCalendar } from '../core/seasons'
import type { GameState } from '../core/state'
import { playAll, playChapter } from './autoplay'
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

  // The seasons follow the real calendar, so the Four Seasons Garden must never
  // wait on it: it can be finished whatever the month, in either hemisphere.
  it('finishes the Four Seasons Garden in any season', { timeout: 120_000 }, () => {
    const { content, state } = setup(5)
    const seasons = content.chapters.findIndex((c) => c.id === 'four-seasons-garden')
    for (const chapter of content.chapters.slice(0, seasons))
      expect(playChapter(state, content, chapter).done).toBe(true)
    const chapter = content.chapters[seasons]!
    for (const [month, hemisphere] of [
      [3, 'north'],
      [6, 'north'],
      [9, 'north'],
      [0, 'north'],
      [0, 'south'],
    ] as const) {
      const copy = structuredClone(state) as GameState
      setCalendar(copy, month, hemisphere)
      const result = playChapter(copy, content, chapter)
      expect(result, `month ${month} (${hemisphere}): stuck on ${result.stuckOn}`).toMatchObject({
        done: true,
      })
    }
  })
})
