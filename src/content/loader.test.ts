import { describe, expect, it } from 'vitest'
import { ContentError, getContent, loadContent, rawContent } from '.'

describe('content', () => {
  it('loads the built-in content without problems', () => {
    const content = getContent()
    expect(Object.keys(content.plants).length).toBeGreaterThanOrEqual(6)
    expect(content.map.width).toBe(26)
    expect(content.map.height).toBe(16)
    expect(content.map.terrain).toHaveLength(26 * 16)
    expect(content.map.areas.map((a) => a.id)).toEqual(['forgotten-garden', 'bamboo-grove'])
  })

  it('places fixed objects from the map legend', () => {
    const { map } = getContent()
    expect(map.fixed.filter((f) => f.id === 'old-pine')).toHaveLength(3)
    expect(map.fixed.filter((f) => f.id === 'old-azalea')).toHaveLength(4)
    expect(map.fixed.some((f) => f.id === 'grove-gate')).toBe(true)
  })

  it('adds shade from the legend, such as along the north wall', () => {
    const { map } = getContent()
    // (5, 1) is in the shaded strip; (5, 6) is open lawn.
    expect(map.baseShade[1 * 26 + 5]).toBeCloseTo(0.5)
    expect(map.baseShade[6 * 26 + 5]).toBe(0)
  })

  it('gives tiles beside the wall a little shade', () => {
    const { map } = getContent()
    expect(map.baseShade[1 * 26 + 1]).toBeGreaterThan(0)
    expect(map.baseShade[0]).toBe(0)
    expect(map.baseShade[8 * 26 + 8]).toBe(0)
  })

  it('reports schema problems with the file and path', () => {
    const broken = { ...rawContent, items: [{ id: 'Bad Id' }] }
    expect(() => loadContent(broken)).toThrow(ContentError)
    try {
      loadContent(broken)
    } catch (e) {
      expect((e as ContentError).problems.some((p) => p.startsWith('items.json: 0.id'))).toBe(true)
    }
  })

  it('requires every tile to belong to exactly one area', () => {
    const map = structuredClone(rawContent.map)
    map.areas[1]!.bounds.x = 15
    expect(() => loadContent({ ...rawContent, map })).toThrow(/is in 2 areas/)
  })

  it('reports references to unknown items', () => {
    const plants = structuredClone(rawContent.plants)
    plants[0]!.seedItem = 'no-such-seed'
    expect(() => loadContent({ ...rawContent, plants })).toThrow(/unknown item "no-such-seed"/)
  })

  it('rejects rows of the wrong width', () => {
    const map = structuredClone(rawContent.map)
    map.rows[3] = map.rows[3]!.slice(1)
    expect(() => loadContent({ ...rawContent, map })).toThrow(/row 3 has 25 tiles/)
  })
})
