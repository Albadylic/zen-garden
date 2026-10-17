import { describe, expect, it } from 'vitest'
import { ContentError, getContent, loadContent, rawContent } from '.'

describe('content', () => {
  it('loads the built-in content without problems', () => {
    const content = getContent()
    expect(Object.keys(content.plants).length).toBeGreaterThanOrEqual(6)
    expect(content.map.width).toBe(16)
    expect(content.map.height).toBe(16)
    expect(content.map.terrain).toHaveLength(256)
  })

  it('places fixed objects from the map legend', () => {
    const { map } = getContent()
    expect(map.fixed.filter((f) => f.id === 'old-pine')).toHaveLength(2)
    expect(map.fixed.some((f) => f.id === 'grove-gate')).toBe(true)
  })

  it('gives tiles beside the wall a little shade', () => {
    const { map } = getContent()
    expect(map.baseShade[1 * 16 + 1]).toBeGreaterThan(0)
    expect(map.baseShade[0]).toBe(0)
    expect(map.baseShade[8 * 16 + 8]).toBe(0)
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

  it('reports references to unknown items', () => {
    const plants = structuredClone(rawContent.plants)
    plants[0]!.seedItem = 'no-such-seed'
    expect(() => loadContent({ ...rawContent, plants })).toThrow(/unknown item "no-such-seed"/)
  })

  it('rejects rows of the wrong width', () => {
    const map = structuredClone(rawContent.map)
    map.rows[3] = map.rows[3]!.slice(1)
    expect(() => loadContent({ ...rawContent, map })).toThrow(/row 3 has 15 tiles/)
  })
})
