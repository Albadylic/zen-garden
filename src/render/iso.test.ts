import { describe, expect, it } from 'vitest'
import { gridToWorld, mapBounds, TILE_H, TILE_W, tileCentre, worldToGrid, worldToTile } from './iso'

describe('isometric projection', () => {
  it('puts tile (0, 0) at the top corner of the map', () => {
    expect(gridToWorld(0, 0)).toEqual({ x: 0, y: 0 })
    expect(tileCentre(0, 0)).toEqual({ x: 0, y: TILE_H / 2 })
  })

  it('moves right-down along x and left-down along y', () => {
    expect(gridToWorld(1, 0)).toEqual({ x: TILE_W / 2, y: TILE_H / 2 })
    expect(gridToWorld(0, 1)).toEqual({ x: -TILE_W / 2, y: TILE_H / 2 })
  })

  it('round-trips between grid and world', () => {
    for (const [gx, gy] of [
      [0, 0],
      [3.25, 7.5],
      [15.9, 0.1],
    ] as const) {
      const w = gridToWorld(gx, gy)
      const g = worldToGrid(w.x, w.y)
      expect(g.x).toBeCloseTo(gx)
      expect(g.y).toBeCloseTo(gy)
    }
  })

  it('finds the tile under a world point', () => {
    const c = tileCentre(4, 9)
    expect(worldToTile(c.x, c.y)).toEqual({ x: 4, y: 9 })
    expect(worldToTile(c.x + TILE_W / 2 - 1, c.y)).toEqual({ x: 4, y: 9 })
    expect(worldToTile(c.x + TILE_W * 0.3, c.y + TILE_H * 0.3)).toEqual({ x: 5, y: 9 })
  })

  it('computes map bounds as a diamond', () => {
    expect(mapBounds(16, 16)).toEqual({ minX: -1024, maxX: 1024, minY: 0, maxY: 1024 })
  })
})
