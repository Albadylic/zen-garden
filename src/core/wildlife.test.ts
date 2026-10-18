import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { addDecoration, addPlant, addShelter } from '../test/helpers'
import type { GameEvent } from './events'
import { removeEntity } from './layout'
import { advance } from './simulation'
import {
  describeActivity,
  FORAGE_REACH,
  forageTiles,
  nectarAvailable,
  PATH_REACH,
  refugesNear,
  residents,
  visitorsAt,
} from './wildlife'

const MIN = 60_000

function run(
  state: ReturnType<typeof setup>['state'],
  content: ReturnType<typeof setup>['content'],
  ms: number,
) {
  const events: GameEvent[] = []
  for (let t = 0; t < ms; t += 1000) events.push(...advance(state, content, 1000))
  return events
}

describe('pollinators', () => {
  it('do not visit a garden with no flowers', () => {
    const { content, state } = setup()
    run(state, content, 20 * MIN)
    expect(state.creatures.filter((c) => c.speciesId !== 'ground-beetle')).toHaveLength(0)
  })

  it('arrive once flowers bloom, feed, and eventually leave', () => {
    const { content, state } = setup(3)
    addPlant(state, content, 'wildflower-mix', 5, 11)
    expect(nectarAvailable(state, content, content.world.gardens[0])).toBe(1)
    const events = run(state, content, 15 * MIN)
    expect(events.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'small-white')).toBe(
      true,
    )
    expect(events.some((e) => e.type === 'wildlifeLeft')).toBe(true)
    expect(state.stats.seen['small-white']).toBeGreaterThan(0)
  })

  it('come in greater numbers, and rarer species appear, with more flowers', () => {
    const { content, state } = setup(4)
    for (let i = 0; i < 5; i++) addPlant(state, content, 'wildflower-mix', 3 + i, 11)
    const events = run(state, content, 30 * MIN)
    const species = new Set(
      events.flatMap((e) => (e.type === 'wildlifeArrived' ? [e.speciesId] : [])),
    )
    expect(species.has('bumblebee')).toBe(true)
    expect(species.has('swallowtail')).toBe(true)
    expect(state.creatures.filter((c) => c.speciesId === 'small-white').length).toBeLessThanOrEqual(
      3,
    )
  })

  it('find something else to do when their flower is removed', () => {
    const { content, state } = setup(3)
    const a = addPlant(state, content, 'wildflower-mix', 5, 11)
    run(state, content, 10 * MIN)
    const visitor = state.creatures.find((c) => c.targetId === a.id)
    removeEntity(state, content, a.id)
    if (visitor)
      expect(state.creatures.find((c) => c.id === visitor.id)?.targetId ?? null).not.toBe(a.id)
    run(state, content, 5 * MIN)
    expect(state.creatures.filter((c) => c.speciesId === 'small-white')).toHaveLength(0)
  })
})

describe('shelter wildlife', () => {
  it('moves into a well-placed shelter and counts a visit', () => {
    const { content, state } = setup(2)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    const shelter = addShelter(state, content, 3, 4)
    const events = run(state, content, 20 * MIN)
    expect(events.some((e) => e.type === 'shelterVisited' && e.entityId === shelter.id)).toBe(true)
    expect(shelter.visits).toBeGreaterThan(0)
    expect(state.stats.visits['natural-shelter']).toBe(shelter.visits)
  })

  it('beetles tuck in for long rests in an insect hotel', () => {
    const { content, state } = setup(2)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    const hotel = content.structures['natural-shelter']!.levels.findIndex(
      (l) => l.branch === 'insect-hotel',
    )
    const shelter = addShelter(state, content, 3, 4, hotel)
    let beetle
    for (let t = 0; t < 60 * MIN && !beetle; t += 1000) {
      const events = advance(state, content, 1000)
      const visit = events.find(
        (e) => e.type === 'shelterVisited' && e.speciesId === 'ground-beetle',
      )
      if (visit) beetle = state.creatures.find((c) => c.speciesId === 'ground-beetle' && c.hidden)
    }
    expect(beetle).toBeDefined()
    expect(beetle!.homeId).toBe(shelter.id)
    // Longer than an ordinary visit (at most 15 min) or rest (at most 1 min) could be.
    expect(beetle!.stayMs).toBeGreaterThan(15 * MIN)
    expect(beetle!.timerMs).toBeGreaterThan(1 * MIN)
    expect(describeActivity(state, content, beetle!)).toBe(
      'Tucked in for a long rest in its shelter',
    )
  })

  it('ignores a shelter in an exposed, sunny spot', () => {
    const { content, state } = setup(2)
    addShelter(state, content, 5, 11)
    const events = run(state, content, 30 * MIN)
    expect(events.some((e) => e.type === 'shelterVisited')).toBe(false)
  })

  it('never holds more residents than its capacity', () => {
    const { content, state } = setup(6)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    const shelter = addShelter(state, content, 3, 4)
    for (let i = 0; i < 30; i++) {
      run(state, content, MIN)
      expect(residents(state, shelter.id).length).toBeLessThanOrEqual(2)
    }
  })

  it('only attracts wrens to an improved shelter', () => {
    const { content, state } = setup(8)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    addShelter(state, content, 3, 4, 0)
    const before = run(state, content, 30 * MIN)
    expect(before.some((e) => e.type === 'wildlifeArrived' && e.speciesId === 'wren')).toBe(false)
  })
})

describe('describeActivity', () => {
  it('describes what a creature is doing', () => {
    const { content, state } = setup(3)
    addPlant(state, content, 'wildflower-mix', 5, 11)
    run(state, content, 10 * MIN)
    for (const c of state.creatures) expect(describeActivity(state, content, c)).toMatch(/\w/)
  })
})

describe('no predation is ever shown', () => {
  it('birds settle beside a shelter, never on the spot where residents rest', () => {
    const { content, state } = setup(8)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    addPlant(state, content, 'fern', 4, 5)
    // Wrens come to a garden already busy with insects.
    for (let i = 0; i < 4; i++) addPlant(state, content, 'wildflower-mix', 4 + i, 11)
    const shelter = addShelter(state, content, 3, 4, 1)
    let checked = 0
    for (let i = 0; i < 90 * 60 && checked < 20; i++) {
      advance(state, content, 1000)
      for (const c of state.creatures) {
        if (c.speciesId !== 'wren' || c.homeId !== shelter.id || c.activity !== 'perching') continue
        const fromCentre = Math.hypot(c.x - (shelter.x + 0.5), c.y - (shelter.y + 0.5))
        expect(fromCentre).toBeGreaterThan(0.3)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('never removes one creature because of another', () => {
    const { content, state } = setup(9)
    for (let i = 0; i < 5; i++) addPlant(state, content, 'wildflower-mix', 3 + i, 11)
    addPlant(state, content, 'fern', 3, 3)
    addPlant(state, content, 'fern', 2, 5)
    addShelter(state, content, 3, 4, 1)
    const leaving = new Set<number>()
    let departures = 0
    // One simulation step at a time, so every state a creature passes through is seen.
    for (let i = 0; i < 60 * 60 * 4; i++) {
      for (const c of state.creatures) if (c.activity === 'leaving') leaving.add(c.id)
      for (const e of advance(state, content, 250)) {
        if (e.type !== 'wildlifeLeft') continue
        // Every departure is a creature that set off on its own journey out of the garden.
        expect(leaving.has(e.creatureId)).toBe(true)
        departures++
      }
    }
    expect(departures).toBeGreaterThan(0)
    const ids = new Set<number>()
    for (const c of state.creatures) {
      expect(ids.has(c.id)).toBe(false)
      ids.add(c.id)
    }
  })
})

describe('stones, logs and paths', () => {
  it('lets paths and stepping stones carry foragers further from their shelter', () => {
    const { content, state } = setup()
    const shelter = addShelter(state, content, 3, 11)
    const reach = (tiles: { x: number; y: number }[]) =>
      Math.max(0, ...tiles.map((t) => Math.max(Math.abs(t.x - 3), Math.abs(t.y - 11))))
    const before = forageTiles(state, content, shelter)
    expect(reach([...before.near, ...before.paths])).toBe(FORAGE_REACH)
    // A line of stepping stones heading east from beside the shelter.
    for (let x = 4; x <= 9; x++) addDecoration(state, 'stepping-stone', x, 13)
    const after = forageTiles(state, content, shelter)
    expect(after.paths.length).toBeGreaterThan(0)
    expect(reach([...after.near, ...after.paths])).toBe(PATH_REACH)
  })

  it('draws ground residents to bask by a stone near their shelter', () => {
    const { content, state } = setup(4)
    const shelter = addShelter(state, content, 3, 11)
    const boulder = addDecoration(state, 'old-boulder', 5, 12)
    expect(refugesNear(state, content, shelter).map((e) => e.id)).toContain(boulder.id)
    let basked = false
    for (let i = 0; i < 90 && !basked; i++) {
      run(state, content, MIN)
      basked = state.creatures.some(
        (c) =>
          c.targetId === boulder.id &&
          c.activity === 'resting' &&
          describeActivity(state, content, c) === 'Basking and sheltering by the old boulder',
      )
    }
    expect(basked).toBe(true)
  })

  it('keeps seasonal visitors away until the seasons begin', () => {
    const { content, state } = setup()
    addShelter(state, content, 3, 4)
    const seen = new Set(
      run(state, content, 60 * MIN)
        .filter((e) => e.type === 'wildlifeArrived')
        .map((e) => (e as { speciesId: string }).speciesId),
    )
    for (const def of Object.values(content.wildlife))
      if (def.seasons) expect(seen.has(def.id)).toBe(false)
  })
})

describe('visitors', () => {
  it('lists creatures close to a tile, or heading for or living in what is on it', () => {
    const { content, state } = setup()
    const shelter = addShelter(state, content, 3, 4)
    const base = {
      speciesId: 'small-white',
      activity: 'feeding' as const,
      hidden: false,
      timerMs: 0,
      stayMs: 1000,
      homeId: null,
      targetId: null,
    }
    state.creatures.push(
      { ...base, id: 900, x: 3.5, y: 4.6, targetX: 0, targetY: 0 },
      { ...base, id: 901, x: 12.5, y: 12.5, targetX: 0, targetY: 0 },
      { ...base, id: 902, x: 9.5, y: 9.5, targetX: 0, targetY: 0, homeId: shelter.id },
    )
    expect(visitorsAt(state, 3, 4, shelter.id).map((c) => c.id)).toEqual([900, 902])
    expect(visitorsAt(state, 3, 4).map((c) => c.id)).toEqual([900])
  })
})
