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
    const data = deserialize(JSON.parse(JSON.stringify(serialize(state, 1234))))
    expect(data.savedAt).toBe(1234)
    expect(data.state).toEqual(state)
  })

  it('continues identically after loading', () => {
    const { content, state } = setup(5)
    plant(state, content, 'wildflower-mix', 5, 11)
    const loaded = deserialize(serialize(state, 0)).state
    advance(state, content, 30 * 60_000)
    advance(loaded, content, 30 * 60_000)
    expect(loaded).toEqual(state)
  })

  it('rejects things that are not saves or are damaged', () => {
    const { state } = setup()
    expect(() => deserialize(null)).toThrow(SaveError)
    expect(() => deserialize({ format: 'other' })).toThrow('not a Zen Garden save')
    const data = serialize(state, 0)
    expect(() => deserialize({ ...data, version: 99 })).toThrow('newer version')
    expect(() => deserialize({ ...data, state: { ...data.state, terrain: [] } })).toThrow('damaged')
  })

  it('runs migrations from older versions in order', () => {
    const { state } = setup()
    const old = { ...serialize(state, 0), version: 1 }
    const migrated = deserialize(
      old,
      {
        1: (s) => ({ ...s, note: 'one' }),
        2: (s) => ({ ...s, note: `${String(s.note)}-two` }),
      },
      3,
    )
    expect((migrated.state as unknown as { note: string }).note).toBe('one-two')
    expect(migrated.version).toBe(3)
    expect(() => deserialize(old, {}, 2)).toThrow('No way to update')
  })
})
