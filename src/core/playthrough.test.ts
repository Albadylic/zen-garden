// Plays Chapter 1 using only real game actions and time, to prove the level
// can be completed and that its pacing is in the intended range.

import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import type { GameEvent } from './events'
import { buildRecipe } from './layout'
import { plant } from './plants'
import { isChapterComplete } from './progression'
import { clearOvergrowth, collectAll } from './resources'
import { advance } from './simulation'

const MIN = 60_000

describe('Chapter 1 playthrough', () => {
  it('can be completed from a fresh garden in under an hour of play', () => {
    const { content, state } = setup(11)
    const events: GameEvent[] = []
    const play = (ms: number) => {
      for (let t = 0; t < ms; t += 1000) {
        events.push(...advance(state, content, 1000))
        if (isChapterComplete(state, content.chapters[0]!)) return
      }
    }

    // Sow wildflowers in the sunny clearing, moss and ferns in the shaded corner.
    for (const [x, y] of [
      [5, 10],
      [6, 11],
      [5, 12],
      [6, 9],
    ] as const) {
      expect(plant(state, content, 'wildflower-mix', x, y).ok).toBe(true)
    }
    expect(plant(state, content, 'garden-moss', 1, 2).ok).toBe(true)
    expect(plant(state, content, 'garden-moss', 3, 1).ok).toBe(true)
    expect(plant(state, content, 'fern', 4, 3).ok).toBe(true)
    expect(plant(state, content, 'soft-rush', 10, 4).ok).toBe(true)

    // Clear overgrowth for materials.
    for (const [x, y] of [
      [6, 1],
      [7, 3],
      [6, 5],
      [1, 7],
      [1, 8],
      [2, 8],
    ] as const) {
      expect(clearOvergrowth(state, content, x, y).ok).toBe(true)
    }

    // Gather from the old pines until the shelter is affordable and unlocked.
    let minutes = 0
    while (!buildRecipe(state, content, 'natural-shelter', 2, 4).ok && minutes < 30) {
      play(MIN)
      collectAll(state)
      minutes++
    }
    expect(state.entities.some((e) => e.defId === 'natural-shelter')).toBe(true)

    // Then let the garden grow, gathering now and then.
    for (let i = 0; i < 60 && !isChapterComplete(state, content.chapters[0]!); i++) {
      play(MIN)
      collectAll(state)
      minutes++
    }

    expect(isChapterComplete(state, content.chapters[0]!)).toBe(true)
    // Seeds stay in check: production pauses before they pile up.
    for (const plantDef of Object.values(content.plants)) {
      if (plantDef.seedItem) expect(state.inventory[plantDef.seedItem] ?? 0).toBeLessThanOrEqual(14)
    }
    expect(minutes).toBeLessThan(60)
    expect(events.some((e) => e.type === 'shelterVisited')).toBe(true)
    expect(content.chapters[0]!.milestones.every((m) => state.milestones[m.id] !== undefined)).toBe(
      true,
    )
  })
})
