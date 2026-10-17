import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import type { Content } from './content'
import { fixedEntity } from './game'
import { isInGarden } from './gardens'
import { terrainAt } from './grid'
import { legacyMap } from './migrations'
import { plant } from './plants'
import { deserialize, SaveError, serialize } from './save'
import type { Creature, Entity } from './state'
import { advance } from './simulation'

describe('saves', () => {
  it('round-trips a garden exactly', () => {
    const { content, state } = setup(5)
    plant(state, content, 'wildflower-mix', 5, 11)
    advance(state, content, 10 * 60_000, { offline: true })
    const data = deserialize(JSON.parse(JSON.stringify(serialize(state, 1234))), content)
    expect(data.savedAt).toBe(1234)
    expect(data.state).toEqual(state)
  })

  it('continues identically after loading', () => {
    const { content, state } = setup(5)
    plant(state, content, 'wildflower-mix', 5, 11)
    const loaded = deserialize(serialize(state, 0), content).state
    advance(state, content, 30 * 60_000)
    advance(loaded, content, 30 * 60_000)
    expect(loaded).toEqual(state)
  })

  it('rejects things that are not saves or are damaged', () => {
    const { content, state } = setup()
    expect(() => deserialize(null, content)).toThrow(SaveError)
    expect(() => deserialize({ format: 'other' }, content)).toThrow('not a Zen Garden save')
    const data = serialize(state, 0)
    expect(() => deserialize({ ...data, version: 99 }, content)).toThrow('newer version')
    const gardens = {
      ...data.state.gardens,
      'forgotten-garden': { x: 0, y: 0, width: 16, height: 16, terrain: [] },
    }
    expect(() => deserialize({ ...data, state: { ...data.state, gardens } }, content)).toThrow(
      'damaged',
    )
  })

  it('runs migrations from older versions in order', () => {
    const { content, state } = setup()
    const old = { ...serialize(state, 0), version: 1 }
    const migrated = deserialize(
      old,
      content,
      {
        1: (s) => ({ ...s, note: 'one' }),
        2: (s) => ({ ...s, note: `${String(s.note)}-two` }),
      },
      3,
    )
    expect((migrated.state as unknown as { note: string }).note).toBe('one-two')
    expect(migrated.version).toBe(3)
    expect(() => deserialize(old, content, {}, 2)).toThrow('No way to update')
  })

  it('adds gardens that are new to the content since the save was made', () => {
    const { content, state } = setup()
    const data = serialize(state, 0)
    delete data.state.gardens['bamboo-grove']
    data.state.entities = data.state.entities.filter((e) => e.y >= 0)
    const { state: loaded } = deserialize(JSON.parse(JSON.stringify(data)), content)
    expect(loaded.gardens['bamboo-grove']).toEqual(state.gardens['bamboo-grove'])
    expect(loaded.entities.filter((e) => e.defId === 'bamboo')).toHaveLength(
      content.world.fixed.filter((f) => f.id === 'bamboo').length,
    )
  })
})

/**
 * A save from before version 4, when the sanctuary was one 26 × 16 map: the
 * garden in columns 0–15 and the grove in columns 16–25.
 */
function legacyState(content: Content, version: number) {
  const map = legacyMap(content)
  const { state } = setup(5)
  let nextId = 1
  const entities: Entity[] = map.fixed.map((f) => fixedEntity(content, f, nextId++))
  const old: Record<string, unknown> = {
    ...state,
    version,
    nextId,
    mapId: 'sanctuary',
    width: map.width,
    height: map.height,
    terrain: [...map.terrain],
    entities,
    areasVisited: [],
  }
  delete old.gardens
  delete old.worldId
  delete old.gardensVisited
  return old as Record<string, unknown> & {
    entities: Entity[]
    terrain: string[]
    width: number
    drops: unknown[]
    creatures: Creature[]
    unlocks: string[]
  }
}

const wrap = (version: number, state: Record<string, unknown>) =>
  JSON.parse(JSON.stringify({ format: 'zen-garden-save', version, savedAt: 1, state }))

/** A version 1 save: the 16-wide garden with the gate on the north wall. */
function version1Save() {
  const { content } = setup(5)
  const legacy = legacyState(content, 1)
  const width = 16
  const terrain: string[] = []
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < width; x++) terrain.push(legacy.terrain[y * legacy.width + x]!)
  terrain[10] = 'path'
  terrain[12 * width + 15] = 'boundary'
  const entities = legacy.entities
    .filter((e) => e.x < width)
    .map((e) => (e.defId === 'grove-gate' ? { ...e, x: 10, y: 0 } : e))
  entities.push({ ...entities[0]!, id: 999, defId: 'wildflower-mix', x: 5, y: 11, fixed: false })
  const old = { ...legacy, width, terrain, entities, mapId: 'forgotten-garden' }
  delete (old as Record<string, unknown>).areasVisited
  return { content, old: wrap(1, old) }
}

describe('migration from version 1', () => {
  it('keeps the garden and its plants where they were', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(old, content)
    expect(Object.keys(state.gardens)).toEqual(content.world.gardens.map((g) => g.id))
    expect(
      state.entities.some((e) => e.defId === 'wildflower-mix' && e.x === 5 && e.y === 11),
    ).toBe(true)
    expect(state.gardensVisited).toEqual([])
  })

  it('leaves the gate in the north wall, leading to the grove', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(old, content)
    const gate = state.entities.find((e) => e.defId === 'grove-gate')!
    expect([gate.x, gate.y]).toEqual([10, 0])
    expect(terrainAt(state, 10, 0)).toBe('path')
    // The old east gate's place now holds the return gate from the Noble Garden.
    const gates = state.entities.filter((e) => e.defId === 'grove-gate' && e.x === 15 && e.y === 12)
    expect(gates).toHaveLength(1)
  })

  it('adds the grove features with fresh ids', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(old, content)
    const bounds = content.world.gardens[1]!
    const inGrove = (p: { x: number; y: number }) => isInGarden(bounds, p.x, p.y)
    expect(state.entities.filter(inGrove).length).toBe(content.world.fixed.filter(inGrove).length)
    expect(new Set(state.entities.map((e) => e.id)).size).toBe(state.entities.length)
  })

  it('carries on simulating after migrating', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(old, content)
    expect(() => advance(state, content, 60 * 60_000, { offline: true })).not.toThrow()
  })
})

/** A version 2 save: the garden before the extra shade was added. */
function version2Save() {
  const { content } = setup(5)
  const legacy = legacyState(content, 2)
  const added = (e: { defId: string; x: number; y: number }) =>
    e.defId === 'old-azalea' || (e.defId === 'old-pine' && e.x === 14 && e.y === 4)
  legacy.entities = legacy.entities.filter((e) => !added(e))
  // The player has already planted where one azalea now grows.
  legacy.entities.push({
    ...legacy.entities[0]!,
    id: 999,
    kind: 'plant',
    defId: 'wildflower-mix',
    x: 2,
    y: 9,
    fixed: false,
  } as Entity)
  // The north wall strip was lawn.
  for (const x of [4, 5, 7, 8, 9]) legacy.terrain[1 * legacy.width + x] = 'grass'
  return { content, old: wrap(2, legacy) }
}

describe('migration from version 2', () => {
  it('adds the new shade-giving features on free tiles', () => {
    const { content, old } = version2Save()
    const { state } = deserialize(old, content)
    expect(state.entities.filter((e) => e.defId === 'old-azalea')).toHaveLength(3)
    expect(state.entities.some((e) => e.defId === 'old-pine' && e.x === 14 && e.y === 4)).toBe(true)
    expect(new Set(state.entities.map((e) => e.id)).size).toBe(state.entities.length)
  })

  it("keeps the player's own planting where a feature would have gone", () => {
    const { content, old } = version2Save()
    const { state } = deserialize(old, content)
    const at = state.entities.filter((e) => e.x === 2 && e.y === 9)
    expect(at.map((e) => e.defId)).toEqual(['wildflower-mix'])
  })

  it('turns the north wall strip to moss', () => {
    const { content, old } = version2Save()
    const { state } = deserialize(old, content)
    for (const x of [4, 5, 7, 8, 9]) expect(terrainAt(state, x, 1)).toBe('moss')
  })
})

describe('migration from version 3', () => {
  it('gives each garden today’s map when nothing has changed', () => {
    const { content, state: fresh } = setup(5)
    const { state } = deserialize(wrap(3, legacyState(content, 3)), content)
    expect(state.gardens).toEqual(fresh.gardens)
    const where = (list: Entity[]) => list.map((e) => `${e.defId}@${e.x},${e.y}`).sort()
    expect(where(state.entities)).toEqual(where(fresh.entities))
  })

  it('moves the grove north of the garden, with everything in it', () => {
    const { content } = setup(5)
    const legacy = legacyState(content, 3)
    legacy.unlocks.push('area:bamboo-grove')
    legacy.areasVisited = ['bamboo-grove']
    // Legacy grove tile (20, 5) lies at (3, -6) today.
    legacy.terrain[5 * legacy.width + 20] = 'water'
    legacy.entities.push({
      ...legacy.entities[0]!,
      id: 900,
      kind: 'plant',
      defId: 'hosta',
      x: 20,
      y: 5,
      fixed: false,
    } as Entity)
    legacy.drops.push({ id: 901, itemId: 'twigs', amount: 1, x: 20, y: 5, sourceId: 900, ageMs: 0 })
    legacy.creatures.push({
      id: 902,
      speciesId: 'white-eye',
      x: 20.5,
      y: 5.5,
      targetX: 20.5,
      targetY: 5.5,
    } as Creature)
    const { state } = deserialize(wrap(3, legacy), content)
    expect(terrainAt(state, 3, -6)).toBe('water')
    expect(state.entities.find((e) => e.id === 900)).toMatchObject({ x: 3, y: -6 })
    expect(state.drops[0]).toMatchObject({ x: 3, y: -6 })
    expect(state.creatures[0]).toMatchObject({ x: 3.5, y: -5.5, targetX: 3.5, targetY: -5.5 })
    expect(state.gardensVisited).toEqual(['bamboo-grove'])
    expect(state).not.toHaveProperty('terrain')
    expect(state).not.toHaveProperty('areasVisited')
  })
})
