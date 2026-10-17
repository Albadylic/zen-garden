import { describe, expect, it } from 'vitest'
import { ContentError, getContent, loadContent, rawContent } from '.'

const garden = (id: string) => getContent().world.gardens.find((g) => g.id === id)!

describe('content', () => {
  it('loads the built-in content without problems', () => {
    const content = getContent()
    expect(Object.keys(content.plants).length).toBeGreaterThanOrEqual(6)
    expect(content.world.gardens.slice(0, 2).map((g) => g.id)).toEqual([
      'forgotten-garden',
      'bamboo-grove',
    ])
  })

  it('places each garden at its origin with its own map', () => {
    expect(garden('forgotten-garden').bounds).toEqual({ x: 0, y: 0, w: 16, h: 16 })
    expect(garden('bamboo-grove').bounds).toEqual({ x: -2, y: -11, w: 16, h: 11 })
    expect(garden('bamboo-grove').terrain).toHaveLength(16 * 11)
  })

  it('lists all twelve gardens of the first batch on the world map', () => {
    const { world } = getContent()
    expect(world.layout).toHaveLength(12)
    // Gardens are built in route order.
    const built = world.layout.filter((g) => g.built).map((g) => g.number)
    expect(built).toEqual(built.map((_, i) => i + 1))
    // The main route visits every garden in order, and the return gate joins 12 and 1.
    const main = world.connections.filter((c) => c.kind === 'main')
    expect(main).toHaveLength(11)
    expect(world.connections.find((c) => c.kind === 'return')?.gardens).toEqual([
      'forgotten-garden',
      'noble-garden',
    ])
  })

  it('puts the grove gate in the garden’s north wall, beside the grove’s opening', () => {
    const gate = getContent().world.gates.find((g) => g.to === 'bamboo-grove')
    expect(gate).toEqual({
      from: 'forgotten-garden',
      to: 'bamboo-grove',
      at: { x: 10, y: 0 },
      passage: { x: 10, y: -1 },
    })
  })

  it('has a return gate from the Noble Garden to the Forgotten Garden', () => {
    const gate = getContent().world.gates.find(
      (g) => g.to === 'noble-garden' && g.from === 'forgotten-garden',
    )
    expect(gate).toEqual({
      from: 'forgotten-garden',
      to: 'noble-garden',
      at: { x: 15, y: 12 },
      passage: { x: 16, y: 12 },
      unlock: 'chapter:noble-garden',
    })
  })

  it('builds all twelve gardens of the first batch, side by side', () => {
    const { world } = getContent()
    expect(world.layout.every((g) => g.built)).toBe(true)
    expect(world.gates).toHaveLength(12)
  })

  it('places fixed objects from the legend in world tiles', () => {
    const { world } = getContent()
    const first = garden('forgotten-garden')
    const inFirst = (f: { x: number; y: number }) =>
      f.x >= 0 && f.y >= 0 && f.x < first.bounds.w && f.y < first.bounds.h
    expect(world.fixed.filter((f) => f.id === 'old-pine' && inFirst(f))).toHaveLength(3)
    expect(world.fixed.filter((f) => f.id === 'old-azalea')).toHaveLength(4)
    expect(world.fixed.find((f) => f.id === 'grove-gate')).toMatchObject({ x: 10, y: 0 })
    expect(world.fixed.filter((f) => f.id === 'bamboo').every((f) => f.y < 0)).toBe(true)
  })

  it('adds shade from the legend, such as along the north wall', () => {
    const { baseShade } = garden('forgotten-garden')
    // (5, 1) is in the shaded strip; (5, 6) is open lawn.
    expect(baseShade[1 * 16 + 5]).toBeCloseTo(0.5)
    expect(baseShade[6 * 16 + 5]).toBe(0)
  })

  it('gives tiles beside the wall a little shade', () => {
    const { baseShade } = garden('forgotten-garden')
    expect(baseShade[1 * 16 + 1]).toBeGreaterThan(0)
    expect(baseShade[0]).toBe(0)
    expect(baseShade[8 * 16 + 8]).toBe(0)
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

  it('rejects gardens that overlap', () => {
    const world = structuredClone(rawContent.world)
    world.gardens[1]!.origin = { x: 5, y: -3 }
    expect(() => loadContent({ ...rawContent, world })).toThrow(/overlap/)
  })

  it('rejects a gate whose passage is not beside it', () => {
    const world = structuredClone(rawContent.world)
    world.gardens[1]!.origin = { x: -3, y: -11 }
    expect(() => loadContent({ ...rawContent, world })).toThrow(/not next to each other/)
  })

  it('rejects connections between gardens that are not neighbours', () => {
    const world = structuredClone(rawContent.world)
    world.connections[1]!.gardens = ['forgotten-garden', 'reed-marsh']
    expect(() => loadContent({ ...rawContent, world })).toThrow(/not side by side/)
  })

  it('reports references to unknown items', () => {
    const plants = structuredClone(rawContent.plants)
    plants[0]!.seedItem = 'no-such-seed'
    expect(() => loadContent({ ...rawContent, plants })).toThrow(/unknown item "no-such-seed"/)
  })

  it('rejects rows of the wrong width', () => {
    const gardens = structuredClone(rawContent.gardens)
    gardens[0]!.rows[3] = gardens[0]!.rows[3]!.slice(1)
    expect(() => loadContent({ ...rawContent, gardens })).toThrow(/row 3 has 15 tiles/)
  })
})
