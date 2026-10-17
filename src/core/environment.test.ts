import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { environmentAt, fit, plantSuitability, rate } from './environment'

describe('environment', () => {
  it('is shaded under the old pines and open in the clearing', () => {
    const { content, state } = setup()
    const corner = environmentAt(state, content, 2, 3)
    const clearing = environmentAt(state, content, 5, 11)
    expect(corner.shade).toBeGreaterThan(0.4)
    expect(clearing.shade).toBe(0)
  })

  it('is damp beside the pond and drier away from it', () => {
    const { content, state } = setup()
    const margin = environmentAt(state, content, 10, 6)
    const lawn = environmentAt(state, content, 4, 12)
    expect(margin.moisture).toBeGreaterThan(0.9)
    expect(lawn.moisture).toBeLessThan(0.4)
  })

  it('fits values inside a range fully and falls off outside it', () => {
    expect(fit(0.5, { min: 0.4, max: 0.6 })).toBe(1)
    expect(fit(0.2, { min: 0.4, max: 0.6 })).toBeCloseTo(1 - 0.2 / 0.35)
    expect(fit(0, { min: 0.5, max: 1 })).toBe(0)
  })

  it('rates scores into four bands', () => {
    expect(rate(0.1)).toBe('poor')
    expect(rate(0.5)).toBe('fair')
    expect(rate(0.7)).toBe('good')
    expect(rate(0.9)).toBe('excellent')
  })

  it('suits wildflowers to open ground and moss to the shaded corner', () => {
    const { content, state } = setup()
    expect(plantSuitability(state, content, 'wildflower-mix', 5, 11).rating).toBe('excellent')
    expect(plantSuitability(state, content, 'garden-moss', 5, 11).rating).toBe('poor')
    expect(plantSuitability(state, content, 'garden-moss', 2, 3).score).toBeGreaterThan(0.85)
  })

  it('explains why a tile is unsuitable', () => {
    const { content, state } = setup()
    const s = plantSuitability(state, content, 'garden-moss', 5, 11)
    expect(s.reasons).toContain('Prefers more shade')
    expect(s.reasons).toContain('Too dry here')
  })
})
