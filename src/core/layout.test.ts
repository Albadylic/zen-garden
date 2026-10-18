import { describe, expect, it } from 'vitest'
import { setup } from '../test/fixtures'
import { entityAt } from './grid'
import { buildRecipe, checkPlacement, moveEntity, removeEntity, undo } from './layout'

const stone = { kind: 'decoration', defId: 'stepping-stone' } as const

describe('placement rules', () => {
  it('allows open grass and refuses walls, water, overgrowth and occupied tiles', () => {
    const { content, state } = setup()
    expect(checkPlacement(state, content, stone, 5, 11)).toEqual({ ok: true })
    expect(checkPlacement(state, content, stone, 0, 0)).toMatchObject({
      ok: false,
      reason: "That's the garden wall",
    })
    expect(checkPlacement(state, content, stone, 11, 6)).toMatchObject({ ok: false })
    expect(checkPlacement(state, content, stone, 6, 1)).toMatchObject({
      ok: false,
      reason: 'Clear the overgrowth first',
    })
    expect(checkPlacement(state, content, stone, 2, 2)).toMatchObject({
      ok: false,
      reason: 'Something is already here',
    })
    expect(checkPlacement(state, content, stone, -1, 3)).toMatchObject({
      ok: false,
      reason: 'Outside the garden',
    })
  })

  it('respects the terrain each decoration allows', () => {
    const { content, state } = setup()
    const path = { kind: 'decoration', defId: 'stone-path' } as const
    expect(checkPlacement(state, content, path, 10, 4)).toMatchObject({
      ok: false,
      reason: "Stone path can't go on the pond margin",
    })
  })
})

describe('layout actions', () => {
  it('builds a decoration from a recipe and pays for it', () => {
    const { content, state } = setup()
    const before = state.inventory.stones!
    const result = buildRecipe(state, content, 'stepping-stone', 5, 11)
    expect(result.ok).toBe(true)
    expect(entityAt(state, 5, 11)?.defId).toBe('stepping-stone')
    expect(state.inventory.stones).toBe(before - 1)
  })

  it('refuses recipes that are locked or unaffordable', () => {
    const { content, state } = setup()
    expect(buildRecipe(state, content, 'natural-shelter', 5, 11)).toMatchObject({
      ok: false,
      reason: 'Not discovered yet',
    })
    state.inventory.stones = 1
    expect(buildRecipe(state, content, 'stone-arrangement', 5, 11)).toMatchObject({
      ok: false,
      reason: 'Not enough materials',
    })
  })

  it('moves an entity and undoes the move', () => {
    const { content, state } = setup()
    const placed = buildRecipe(state, content, 'stepping-stone', 5, 11)
    if (!placed.ok) throw new Error('place failed')
    const id = state.entities.at(-1)!.id
    const moved = moveEntity(state, content, id, 6, 11)
    expect(moved.ok).toBe(true)
    expect(entityAt(state, 6, 11)?.id).toBe(id)
    if (!moved.ok || !moved.undo) throw new Error('move failed')
    expect(undo(state, content, moved.undo).ok).toBe(true)
    expect(entityAt(state, 5, 11)?.id).toBe(id)
  })

  it('refuses to move or remove fixed features', () => {
    const { content, state } = setup()
    const pine = entityAt(state, 2, 2)!
    expect(moveEntity(state, content, pine.id, 5, 11).ok).toBe(false)
    expect(removeEntity(state, content, pine.id).ok).toBe(false)
  })

  it('refunds a removed decoration and restores it on undo', () => {
    const { content, state } = setup()
    buildRecipe(state, content, 'stone-arrangement', 5, 11)
    const id = state.entities.at(-1)!.id
    const stones = state.inventory.stones ?? 0
    const removed = removeEntity(state, content, id)
    expect(state.inventory.stones).toBe(
      stones + content.recipes['stone-arrangement']!.inputs.stones!,
    )
    if (!removed.ok || !removed.undo) throw new Error('remove failed')
    expect(undo(state, content, removed.undo).ok).toBe(true)
    expect(entityAt(state, 5, 11)?.id).toBe(id)
    expect(state.inventory.stones ?? 0).toBe(stones)
  })

  it('undoes a placement by removing it and refunding the cost', () => {
    const { content, state } = setup()
    const stones = state.inventory.stones!
    const placed = buildRecipe(state, content, 'stone-path', 5, 11)
    if (!placed.ok || !placed.undo) throw new Error('place failed')
    expect(undo(state, content, placed.undo).ok).toBe(true)
    expect(entityAt(state, 5, 11)).toBeUndefined()
    expect(state.inventory.stones).toBe(stones)
  })
})
