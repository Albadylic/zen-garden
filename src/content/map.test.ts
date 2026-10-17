import { describe, expect, it } from 'vitest'
import { isTileOpen } from '../core/areas'
import { plantSuitability, structureSuitability } from '../core/environment'
import { checkPlacement } from '../core/layout'
import { setup } from '../test/fixtures'

// The first garden should offer plenty of excellent spots for everything the
// player can place in Chapter 1, spread around rather than in one corner.
const STARTERS = ['wildflower-mix', 'garden-moss', 'fern', 'ornamental-grass', 'japanese-maple']
const SHADE_LOVERS = ['garden-moss', 'fern']

function excellentTiles(kind: 'plant' | 'structure', id: string) {
  const { content, state } = setup()
  const tiles: { x: number; y: number }[] = []
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (!isTileOpen(state, content, x, y)) continue
      if (!checkPlacement(state, content, { kind, defId: id }, x, y).ok) continue
      const s =
        kind === 'plant'
          ? plantSuitability(state, content, id, x, y)
          : structureSuitability(state, content, id, x, y)
      if (s.rating === 'excellent') tiles.push({ x, y })
    }
  }
  return tiles
}

/** Which quarters of the first garden (16 × 16) the tiles fall in. */
function quarters(tiles: { x: number; y: number }[]): number {
  return new Set(tiles.map((t) => `${t.x < 8 ? 'w' : 'e'}${t.y < 8 ? 'n' : 's'}`)).size
}

describe('the first garden', () => {
  it.each(STARTERS)('has at least 20 excellent spots for %s', (id) => {
    expect(excellentTiles('plant', id).length).toBeGreaterThanOrEqual(20)
  })

  it('has excellent spots for the soft rush around the pond', () => {
    expect(excellentTiles('plant', 'soft-rush').length).toBeGreaterThanOrEqual(12)
  })

  it.each(SHADE_LOVERS)('spreads shade for %s across the garden', (id) => {
    expect(quarters(excellentTiles('plant', id))).toBeGreaterThanOrEqual(3)
  })

  it('has excellent shelter spots in several parts of the garden', () => {
    const tiles = excellentTiles('structure', 'natural-shelter')
    expect(tiles.length).toBeGreaterThanOrEqual(25)
    expect(quarters(tiles)).toBeGreaterThanOrEqual(3)
  })
})
