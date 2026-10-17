import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { terrainAt } from './grid'

describe('createGame', () => {
  it('copies the starting map, inventory and fixed objects', () => {
    const { content, state } = setup()
    expect(state.width).toBe(content.map.width)
    expect(terrainAt(state, 0, 0)).toBe('boundary')
    expect(state.inventory['wildflower-seeds']).toBe(
      content.map.startingInventory['wildflower-seeds'],
    )
    expect(state.entities.every((e) => e.fixed)).toBe(true)
    expect(state.entities.length).toBe(content.map.fixed.length)
  })

  it('does not share arrays with the content', () => {
    const { content, state } = setup()
    state.terrain[17] = 'water'
    expect(content.map.terrain[17]).not.toBe('water')
  })
})
