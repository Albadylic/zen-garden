import { describe, expect, it } from 'vitest'
import { chance, random, randomInt } from './rng'

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = { rng: 42 }
    const b = { rng: 42 }
    const seqA = Array.from({ length: 5 }, () => random(a))
    const seqB = Array.from({ length: 5 }, () => random(b))
    expect(seqA).toEqual(seqB)
  })

  it('produces values in [0, 1)', () => {
    const h = { rng: 7 }
    for (let i = 0; i < 1000; i++) {
      const v = random(h)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('randomInt stays within inclusive bounds', () => {
    const h = { rng: 3 }
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(h, 1, 3))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })

  it('chance never fires for a zero rate', () => {
    const h = { rng: 1 }
    for (let i = 0; i < 100; i++) expect(chance(h, 0, 60_000)).toBe(false)
  })
})
