import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { terrainAt } from './grid'

describe('createGame', () => {
  it('copies every garden, the starting inventory and fixed objects', () => {
    const { content, state } = setup()
    expect(Object.keys(state.gardens)).toEqual(content.world.gardens.map((g) => g.id))
    expect(terrainAt(state, 0, 0)).toBe('boundary')
    expect(terrainAt(state, 10, -1)).toBe('path')
    expect(terrainAt(state, 100, 100)).toBeUndefined()
    expect(state.inventory['wildflower-seeds']).toBe(
      content.world.startingInventory['wildflower-seeds'],
    )
    expect(state.entities.every((e) => e.fixed)).toBe(true)
    expect(state.entities.length).toBe(content.world.fixed.length)
  })

  it('does not share arrays with the content', () => {
    const { content, state } = setup()
    state.gardens['forgotten-garden']!.terrain[17] = 'water'
    expect(content.world.gardens[0]!.terrain[17]).not.toBe('water')
  })
})
