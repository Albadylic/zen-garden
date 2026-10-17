// Isometric grid maths. Grid x runs down-right on screen and grid y runs
// down-left, so tile (0, 0) is the top corner of the garden.

export const TILE_WIDTH = 128
export const TILE_HEIGHT = 64

export interface Point {
  x: number
  y: number
}

/** Screen position of the centre of tile (x, y), relative to the centre of tile (0, 0). */
export function gridToScreen(x: number, y: number): Point {
  return { x: ((x - y) * TILE_WIDTH) / 2, y: ((x + y) * TILE_HEIGHT) / 2 }
}

/** The tile whose diamond contains the screen point. */
export function screenToGrid(sx: number, sy: number): Point {
  return {
    x: nearestTile(sx / TILE_WIDTH + sy / TILE_HEIGHT),
    y: nearestTile(sy / TILE_HEIGHT - sx / TILE_WIDTH),
  }
}

// Adding 0 turns the -0 that Math.round gives for small negatives into 0.
function nearestTile(n: number): number {
  return Math.round(n) + 0
}

/** Draw-order key: things further down the screen are drawn later, ties broken left to right. */
export function depth(x: number, y: number): number {
  return (x + y) * 1024 + x
}
