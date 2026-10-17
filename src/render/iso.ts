// Isometric projection. Grid positions are in tile units, where the centre of
// tile (x, y) is (x + 0.5, y + 0.5). World positions are in pixels before the
// camera's zoom is applied.

export const TILE_W = 128
export const TILE_H = 64

export interface Point {
  x: number
  y: number
}

export function gridToWorld(gx: number, gy: number): Point {
  return { x: ((gx - gy) * TILE_W) / 2, y: ((gx + gy) * TILE_H) / 2 }
}

export function worldToGrid(wx: number, wy: number): Point {
  const a = wx / (TILE_W / 2)
  const b = wy / (TILE_H / 2)
  return { x: (a + b) / 2, y: (b - a) / 2 }
}

export function tileCentre(x: number, y: number): Point {
  return gridToWorld(x + 0.5, y + 0.5)
}

/** The tile containing a world position. */
export function worldToTile(wx: number, wy: number): Point {
  const g = worldToGrid(wx, wy)
  return { x: Math.floor(g.x), y: Math.floor(g.y) }
}

/** Depth for sorting: larger values are nearer the viewer. */
export function depth(gx: number, gy: number): number {
  return gx + gy
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function mapBounds(width: number, height: number): Bounds {
  return rectBounds(0, 0, width, height)
}

/** World bounds of a rectangle of tiles, which appears as a diamond on screen. */
export function rectBounds(x: number, y: number, w: number, h: number): Bounds {
  const corners = [
    gridToWorld(x, y),
    gridToWorld(x + w, y),
    gridToWorld(x, y + h),
    gridToWorld(x + w, y + h),
  ]
  return {
    minX: Math.min(...corners.map((c) => c.x)),
    maxX: Math.max(...corners.map((c) => c.x)),
    minY: Math.min(...corners.map((c) => c.y)),
    maxY: Math.max(...corners.map((c) => c.y)),
  }
}

export function unionBounds(list: Bounds[]): Bounds {
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  }
}
