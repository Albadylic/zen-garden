import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { plant } from './plants'
import { deserialize, SaveError, serialize } from './save'
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
    expect(() => deserialize({ ...data, state: { ...data.state, terrain: [] } }, content)).toThrow(
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
})

/** A version 1 save: the 16-wide garden with the gate on the north wall. */
function version1Save() {
  const { content, state } = setup(5)
  plant(state, content, 'wildflower-mix', 5, 11)
  const width = 16
  const terrain = []
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < width; x++) terrain.push(state.terrain[y * state.width + x]!)
  terrain[10] = 'path'
  terrain[12 * width + 15] = 'boundary'
  const entities = state.entities
    .filter((e) => e.x < width)
    .map((e) => (e.defId === 'grove-gate' ? { ...e, x: 10, y: 0 } : e))
  const old: Record<string, unknown> = {
    ...state,
    version: 1,
    width,
    terrain,
    entities,
    mapId: 'forgotten-garden',
  }
  delete old.areasVisited
  delete (old.stats as Record<string, unknown>).clearedIn
  return {
    content,
    old: { format: 'zen-garden-save', version: 1, savedAt: 1, state: old },
    plants: 1,
  }
}

describe('migration from version 1', () => {
  it('widens the map to include the grove and keeps the garden', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(JSON.parse(JSON.stringify(old)), content)
    expect(state.width).toBe(content.map.width)
    expect(state.terrain).toHaveLength(content.map.width * content.map.height)
    expect(
      state.entities.some((e) => e.defId === 'wildflower-mix' && e.x === 5 && e.y === 11),
    ).toBe(true)
    expect(state.areasVisited).toEqual([])
  })

  it('moves the gate to the east wall and walls up its old spot', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(JSON.parse(JSON.stringify(old)), content)
    const gate = state.entities.find((e) => e.defId === 'grove-gate')!
    expect([gate.x, gate.y]).toEqual([15, 12])
    expect(state.terrain[10]).toBe('boundary')
    expect(state.terrain[12 * state.width + 15]).toBe('path')
  })

  it('adds the grove features with fresh ids', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(JSON.parse(JSON.stringify(old)), content)
    const grove = state.entities.filter((e) => e.x >= 16)
    expect(grove.length).toBe(content.map.fixed.filter((f) => f.x >= 16).length)
    expect(new Set(state.entities.map((e) => e.id)).size).toBe(state.entities.length)
  })

  it('carries on simulating after migrating', () => {
    const { content, old } = version1Save()
    const { state } = deserialize(JSON.parse(JSON.stringify(old)), content)
    expect(() => advance(state, content, 60 * 60_000, { offline: true })).not.toThrow()
  })
})
