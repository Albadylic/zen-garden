import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { itemSources } from './sources'

describe('item sources', () => {
  it('says where to gather an item', () => {
    const { content } = setup()
    expect(itemSources(content, 'stones')).toEqual(['Old boulders', 'clearing overgrowth'])
    expect(itemSources(content, 'twigs')).toContain('clearing overgrowth')
    expect(itemSources(content, 'twigs')).toContain('Old black pine')
    expect(itemSources(content, 'seed-bundle')).toEqual(['making it (Seed bundle)'])
  })

  it('lists sources already in the gardens first', () => {
    const { content, state } = setup()
    // The first garden has old black pines but no Japanese maple yet.
    const twigs = itemSources(content, 'twigs', state)
    expect(twigs[0]).toBe('Old black pine')
    expect(twigs.indexOf('clearing overgrowth')).toBeLessThan(twigs.indexOf('Japanese maple'))
  })

  it('knows a source for every item used in a recipe or upgrade', () => {
    const { content } = setup()
    const used = new Set<string>()
    for (const r of Object.values(content.recipes))
      Object.keys(r.inputs).forEach((i) => used.add(i))
    for (const s of Object.values(content.structures))
      for (const l of s.levels) Object.keys(l.upgradeCost ?? {}).forEach((i) => used.add(i))
    const missing = [...used].filter((id) => itemSources(content, id).length === 0)
    expect(missing).toEqual([])
  })
})
