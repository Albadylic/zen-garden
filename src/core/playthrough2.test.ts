// Plays Chapter 2 from the end of Chapter 1, using only real actions and
// time, to prove the grove can be restored and to measure its pacing.

import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addShelter } from '../test/helpers'
import { visitGarden } from './gardens'
import { upgradeOptions, upgradeStructure } from './habitats'
import { plant, harvest } from './plants'
import { isChapterComplete } from './progression'
import { completeStage } from './projects'
import { clearOvergrowth, collectAll } from './resources'
import { advance } from './simulation'
import type { PlantEntity } from './state'

const MIN = 60_000

describe('Chapter 2 playthrough', () => {
  it('restores the grove within an hour of play after Chapter 1', () => {
    const { content, state } = setup(12)
    // The end of Chapter 1: every milestone done, an improved shelter with residents.
    for (const m of content.chapters[0]!.milestones) state.milestones[m.id] = 0
    state.unlocks.push(
      'recipe:natural-shelter',
      'upgrade:natural-shelter',
      'area:bamboo-grove',
      'chapter:forgotten-garden',
    )
    state.unlocks.push(content.chapters[0]!.completionUnlock)
    const shelter = addShelter(state, content, 2, 4, 5)
    shelter.visits = 2
    Object.assign(state.inventory, { twigs: 6, stones: 3, bark: 2 })
    const chapter = content.chapters[1]!
    const done = () => isChapterComplete(state, chapter)
    const play = (ms: number) => {
      for (let t = 0; t < ms && !done(); t += 1000) advance(state, content, 1000)
    }
    play(1000) // The chapter starts and its gift arrives.
    expect(state.inventory['bamboo-shoots']).toBe(2)

    expect(visitGarden(state, content, 3, -6)).toBe(true)
    // Every approach is already under way once the grove opens.
    expect(state.projects['restore-grove']?.active).toContain('shaded-corner')
    expect(plant(state, content, 'bamboo', 0, -6).ok).toBe(true)
    expect(plant(state, content, 'forest-grass', 0, -2).ok).toBe(true)
    expect(plant(state, content, 'hosta', 0, -3).ok).toBe(true)
    for (const [x, y] of [
      [-1, -3],
      [-1, -4],
      [0, -4],
      [1, -2],
      [2, -2],
    ] as const) {
      clearOvergrowth(state, content, x, y)
    }
    for (const [x, y] of [
      [-1, -5],
      [-1, -8],
      [1, -9],
    ] as const) {
      expect(
        harvest(
          state,
          content,
          (state.entities.find((e) => e.x === x && e.y === y) as PlantEntity).id,
        ).ok,
      ).toBe(true)
    }

    let minutes = 0
    const spare = [
      [0, -5],
      [2, -3],
      [2, -4],
      [2, -5],
    ]
    while (!done() && minutes < 60) {
      play(MIN)
      minutes++
      collectAll(state)
      // Plant any divisions found, and harvest canes when the clumps recover.
      for (const id of ['grass-divisions', 'hosta-divisions'] as const) {
        if ((state.inventory[id] ?? 0) > 0 && spare.length > 0) {
          const [x, y] = spare.shift()!
          plant(state, content, id === 'hosta-divisions' ? 'hosta' : 'forest-grass', x!, y!)
        }
      }
      for (const e of state.entities)
        if (e.kind === 'plant' && e.defId === 'bamboo') harvest(state, content, e.id)
      completeStage(state, content, 'restore-grove', 'shaded-corner')
      // Once branches are discovered, turn the shelter into an insect hotel.
      const hotel = upgradeOptions(state, content, shelter).find(
        (o) => o.def.branch === 'insect-hotel',
      )
      if (hotel?.status.kind === 'ready') upgradeStructure(state, content, shelter.id, hotel.level)
    }
    expect(done()).toBe(true)
    expect(minutes).toBeLessThan(60)
    expect(chapter.milestones.every((m) => state.milestones[m.id] !== undefined)).toBe(true)
  })
})
