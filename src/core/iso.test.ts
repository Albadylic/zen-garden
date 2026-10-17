import { describe, expect, it } from 'vitest'
import { depth, gridToScreen, screenToGrid, TILE_HEIGHT, TILE_WIDTH } from './iso'

describe('iso', () => {
  it('places tile centres on a 2:1 diamond grid', () => {
    expect(gridToScreen(0, 0)).toEqual({ x: 0, y: 0 })
    expect(gridToScreen(1, 0)).toEqual({ x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 })
    expect(gridToScreen(0, 1)).toEqual({ x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 })
    expect(gridToScreen(3, 3)).toEqual({ x: 0, y: 3 * TILE_HEIGHT })
  })

  it('maps every point inside a tile diamond back to that tile', () => {
    for (const [x, y] of [
      [0, 0],
      [5, 2],
      [15, 15],
    ]) {
      const centre = gridToScreen(x, y)
      const inside = [
        [0, 0],
        [TILE_WIDTH / 2 - 2, 0],
        [-(TILE_WIDTH / 2 - 2), 0],
        [0, TILE_HEIGHT / 2 - 1],
        [0, -(TILE_HEIGHT / 2 - 1)],
        [20, 10],
      ]
      for (const [dx, dy] of inside) {
        expect(screenToGrid(centre.x + dx, centre.y + dy)).toEqual({ x, y })
      }
    }
  })

  it('picks the neighbouring tile just past a diamond edge', () => {
    const centre = gridToScreen(2, 2)
    expect(screenToGrid(centre.x + TILE_WIDTH / 4 + 2, centre.y + TILE_HEIGHT / 4 + 1)).toEqual({
      x: 3,
      y: 2,
    })
  })

  it('draws lower tiles after higher ones, and left before right on the same row', () => {
    expect(depth(1, 1)).toBeGreaterThan(depth(1, 0))
    expect(depth(1, 1)).toBeGreaterThan(depth(0, 1))
    expect(depth(2, 0)).toBeGreaterThan(depth(0, 2))
    expect(depth(0, 3)).toBeGreaterThan(depth(2, 0))
  })
})
