// A 2D camera over the isometric world: pan, zoom about a point, and limits
// that keep the garden in view. Pure maths, so it can be unit tested.

import { type Bounds, type Point, TILE_W } from './iso'

/** Smallest comfortable on-screen tile width when the camera first opens. */
const MIN_START_TILE_PX = 56
export const MAX_ZOOM = 2
export const MIN_ZOOM = 0.5

export class Camera {
  /** World position shown at the centre of the screen. */
  x = 0
  y = 0
  zoom = 1
  viewWidth = 1
  viewHeight = 1
  minZoom = MIN_ZOOM
  maxZoom = MAX_ZOOM

  private readonly bounds: Bounds

  constructor(bounds: Bounds) {
    this.bounds = bounds
  }

  /** Zoom at which the whole garden fits on screen. */
  fitZoom(): number {
    const w = this.bounds.maxX - this.bounds.minX
    const h = this.bounds.maxY - this.bounds.minY
    return Math.min(this.viewWidth / w, this.viewHeight / h) * 0.92
  }

  resize(width: number, height: number): void {
    this.viewWidth = Math.max(1, width)
    this.viewHeight = Math.max(1, height)
    // Let small screens zoom out far enough to see the whole garden.
    this.minZoom = Math.min(MIN_ZOOM, this.fitZoom())
    this.zoom = this.clampZoom(this.zoom)
    this.clampPosition()
  }

  /** Centres the garden at a zoom that fits it, without making tiles too small to tap. */
  reset(): void {
    this.zoom = this.clampZoom(Math.max(this.fitZoom(), MIN_START_TILE_PX / TILE_W))
    this.x = (this.bounds.minX + this.bounds.maxX) / 2
    this.y = (this.bounds.minY + this.bounds.maxY) / 2
    this.clampPosition()
  }

  screenToWorld(sx: number, sy: number): Point {
    return {
      x: this.x + (sx - this.viewWidth / 2) / this.zoom,
      y: this.y + (sy - this.viewHeight / 2) / this.zoom,
    }
  }

  worldToScreen(wx: number, wy: number): Point {
    return {
      x: (wx - this.x) * this.zoom + this.viewWidth / 2,
      y: (wy - this.y) * this.zoom + this.viewHeight / 2,
    }
  }

  /** Pans by a distance in screen pixels. */
  panBy(dx: number, dy: number): void {
    this.x -= dx / this.zoom
    this.y -= dy / this.zoom
    this.clampPosition()
  }

  /** Zooms by `factor`, keeping the world point under (sx, sy) fixed on screen. */
  zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.screenToWorld(sx, sy)
    this.zoom = this.clampZoom(this.zoom * factor)
    const after = this.screenToWorld(sx, sy)
    this.x += before.x - after.x
    this.y += before.y - after.y
    this.clampPosition()
  }

  private clampZoom(zoom: number): number {
    return Math.min(this.maxZoom, Math.max(this.minZoom, zoom))
  }

  /** Keeps the screen centre over the garden so it can never be lost off screen. */
  private clampPosition(): void {
    this.x = Math.min(this.bounds.maxX, Math.max(this.bounds.minX, this.x))
    this.y = Math.min(this.bounds.maxY, Math.max(this.bounds.minY, this.y))
  }
}
