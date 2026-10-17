import { describe, expect, it } from 'vitest'
import { parseGardenMap, terrainAt } from './garden-map'

const vocabulary = {
  terrain: new Set(['grass', 'water']),
  objects: new Set(['stone']),
}

const valid = {
  id: 'test',
  name: 'Test garden',
  legend: { g: 'grass', '~': 'water' },
  rows: ['gg~', 'g~~'],
  objects: [{ kind: 'stone', x: 2, y: 1 }],
}

describe('parseGardenMap', () => {
  it('reads terrain row by row and keeps objects', () => {
    const map = parseGardenMap(valid, vocabulary)
    expect(map).toMatchObject({ id: 'test', width: 3, height: 2 })
    expect(terrainAt(map, 2, 0)).toBe('water')
    expect(terrainAt(map, 0, 1)).toBe('grass')
    expect(map.objects).toEqual([{ kind: 'stone', x: 2, y: 1 }])
  })

  it('rejects ragged rows', () => {
    expect(() => parseGardenMap({ ...valid, rows: ['gg~', 'g~'] }, vocabulary)).toThrow(
      /row 1 has 2 tiles/,
    )
  })

  it('rejects symbols missing from the legend and unknown terrain', () => {
    expect(() => parseGardenMap({ ...valid, rows: ['gg~', 'g~x'] }, vocabulary)).toThrow(/"x"/)
    expect(() => parseGardenMap({ ...valid, legend: { g: 'lava' } }, vocabulary)).toThrow(/lava/)
  })

  it('rejects unknown or out-of-bounds objects', () => {
    expect(() =>
      parseGardenMap({ ...valid, objects: [{ kind: 'tree', x: 0, y: 0 }] }, vocabulary),
    ).toThrow(/unknown kind "tree"/)
    expect(() =>
      parseGardenMap({ ...valid, objects: [{ kind: 'stone', x: 3, y: 0 }] }, vocabulary),
    ).toThrow(/outside the map/)
  })
})
