import { describe, expect, it } from 'vitest'
import { Camera } from './camera'
import { mapBounds } from './iso'

function camera(w: number, h: number) {
  const c = new Camera(mapBounds(16, 16))
  c.resize(w, h)
  c.reset()
  return c
}

describe('camera', () => {
  it('fits the whole garden on a large screen', () => {
    const c = camera(1600, 1000)
    expect(c.zoom).toBeCloseTo(c.fitZoom())
  })

  it('keeps tiles tappable on a phone instead of fitting everything', () => {
    const c = camera(390, 844)
    expect(c.zoom * 128).toBeGreaterThanOrEqual(56)
    expect(c.minZoom).toBeLessThan(c.zoom)
  })

  it('round-trips screen and world coordinates', () => {
    const c = camera(800, 600)
    const w = c.screenToWorld(123, 456)
    const s = c.worldToScreen(w.x, w.y)
    expect(s.x).toBeCloseTo(123)
    expect(s.y).toBeCloseTo(456)
  })

  it('zooms about a point without moving it', () => {
    const c = camera(800, 600)
    const before = c.screenToWorld(100, 100)
    c.zoomAt(100, 100, 1.5)
    const after = c.worldToScreen(before.x, before.y)
    expect(after.x).toBeCloseTo(100)
    expect(after.y).toBeCloseTo(100)
  })

  it('clamps zoom and keeps the view over the garden', () => {
    const c = camera(800, 600)
    c.zoomAt(400, 300, 100)
    expect(c.zoom).toBe(2)
    c.panBy(1e6, 1e6)
    expect(c.x).toBeGreaterThanOrEqual(-1024)
    expect(c.y).toBeGreaterThanOrEqual(0)
  })
})
