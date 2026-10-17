// Placement rules and layout actions: building from recipes, moving, removing
// and undoing ordinary layout changes.

import type { Content, Terrain } from './content'
import type { GameEvent } from './events'
import { nextId } from './game'
import { entityAt, entityById, inBounds, terrainAt } from './grid'
import { isTileOpen } from './areas'
import { addItems, hasItems, removeItems } from './inventory'
import type { Entity, GameState } from './state'
import { clone } from './util'

export type Placeable =
  | { kind: 'plant'; defId: string }
  | { kind: 'structure'; defId: string }
  | { kind: 'decoration'; defId: string }

export type Check = { ok: true } | { ok: false; reason: string }

export type UndoRecord =
  | { type: 'place'; entityId: number; refund: Record<string, number> }
  | { type: 'move'; entityId: number; fromX: number; fromY: number }
  | { type: 'remove'; entity: Entity; refund: Record<string, number> }

export type ActionResult =
  { ok: true; events: GameEvent[]; undo?: UndoRecord } | { ok: false; reason: string }

const TERRAIN_NAMES: Record<Terrain, string> = {
  grass: 'grass',
  moss: 'moss',
  path: 'the path',
  water: 'water',
  margin: 'the pond margin',
  overgrown: 'overgrowth',
  boundary: 'the garden wall',
}

export function placeableName(content: Content, p: Placeable): string {
  const def =
    p.kind === 'plant'
      ? content.plants[p.defId]
      : p.kind === 'structure'
        ? content.structures[p.defId]
        : content.decorations[p.defId]
  return def?.name ?? p.defId
}

function allowedTerrain(content: Content, p: Placeable): Terrain[] {
  const def =
    p.kind === 'plant'
      ? content.plants[p.defId]
      : p.kind === 'structure'
        ? content.structures[p.defId]
        : content.decorations[p.defId]
  return def?.terrain ?? []
}

/** Whether `p` can go on tile (x, y). `ignoreId` lets an entity be moved within its own tile. */
export function checkPlacement(
  state: GameState,
  content: Content,
  p: Placeable,
  x: number,
  y: number,
  ignoreId?: number,
): Check {
  if (!inBounds(state, x, y)) return { ok: false, reason: 'Outside the garden' }
  const terrain = terrainAt(state, x, y)!
  if (!isTileOpen(state, content, x, y))
    return { ok: false, reason: 'That part of the garden is not open yet' }
  if (terrain === 'boundary') return { ok: false, reason: "That's the garden wall" }
  if (terrain === 'overgrown') return { ok: false, reason: 'Clear the overgrowth first' }
  const occupant = entityAt(state, x, y)
  if (occupant && occupant.id !== ignoreId)
    return { ok: false, reason: 'Something is already here' }
  if (!allowedTerrain(content, p).includes(terrain)) {
    return {
      ok: false,
      reason: `${placeableName(content, p)} can't go on ${TERRAIN_NAMES[terrain]}`,
    }
  }
  return { ok: true }
}

export function hasUnlock(state: GameState, key: string | undefined): boolean {
  return key === undefined || state.unlocks.includes(key)
}

/** Builds a recipe's structure or decoration on a tile, paying its inputs. */
export function buildRecipe(
  state: GameState,
  content: Content,
  recipeId: string,
  x: number,
  y: number,
): ActionResult {
  const recipe = content.recipes[recipeId]
  if (!recipe) return { ok: false, reason: 'Unknown recipe' }
  if (!hasUnlock(state, recipe.unlock)) return { ok: false, reason: 'Not discovered yet' }
  if (!hasItems(state, recipe.inputs)) return { ok: false, reason: 'Not enough materials' }
  const check = checkPlacement(
    state,
    content,
    { kind: recipe.output.kind, defId: recipe.output.id },
    x,
    y,
  )
  if (!check.ok) return check
  removeItems(state, recipe.inputs)
  const id = nextId(state)
  const events: GameEvent[] = []
  if (recipe.output.kind === 'structure') {
    const def = content.structures[recipe.output.id]!
    state.entities.push({
      id,
      kind: 'structure',
      defId: def.id,
      x,
      y,
      level: 0,
      visits: 0,
      produceMs: def.levels[0]!.produces.map(() => 0),
      fixed: false,
    })
    state.stats.built[def.id] = (state.stats.built[def.id] ?? 0) + 1
    events.push({ type: 'built', entityId: id, structureId: def.id })
  } else {
    state.entities.push({ id, kind: 'decoration', defId: recipe.output.id, x, y, fixed: false })
    events.push({ type: 'placed', entityId: id, decorationId: recipe.output.id })
  }
  state.layoutVersion++
  return { ok: true, events, undo: { type: 'place', entityId: id, refund: { ...recipe.inputs } } }
}

function placeableOf(entity: Entity): Placeable {
  return { kind: entity.kind, defId: entity.defId }
}

export function moveEntity(
  state: GameState,
  content: Content,
  entityId: number,
  x: number,
  y: number,
): ActionResult {
  const entity = entityById(state, entityId)
  if (!entity) return { ok: false, reason: 'Nothing to move' }
  if (entity.fixed)
    return { ok: false, reason: "This has been here longer than the garden's memory" }
  if (entity.x === x && entity.y === y) return { ok: false, reason: 'Already here' }
  const check = checkPlacement(state, content, placeableOf(entity), x, y, entity.id)
  if (!check.ok) return check
  const undo: UndoRecord = { type: 'move', entityId, fromX: entity.x, fromY: entity.y }
  entity.x = x
  entity.y = y
  // Residents follow their shelter.
  for (const c of state.creatures) {
    if (c.homeId === entityId && c.hidden) {
      c.x = x + 0.5
      c.y = y + 0.5
    }
  }
  state.layoutVersion++
  return { ok: true, events: [], undo }
}

/** Materials returned when an entity is removed. */
export function refundFor(content: Content, entity: Entity): Record<string, number> {
  if (entity.kind === 'plant') {
    const seed = content.plants[entity.defId]?.seedItem
    // Seeds that have not sprouted yet can be lifted and replanted.
    return seed && entity.stage === 0 ? { [seed]: 1 } : {}
  }
  const recipe = Object.values(content.recipes).find(
    (r) => r.output.kind === entity.kind && r.output.id === entity.defId,
  )
  return recipe ? { ...recipe.inputs } : {}
}

export function removeEntity(state: GameState, content: Content, entityId: number): ActionResult {
  const index = state.entities.findIndex((e) => e.id === entityId)
  const entity = state.entities[index]
  if (!entity) return { ok: false, reason: 'Nothing to remove' }
  if (entity.fixed)
    return { ok: false, reason: "This has been here longer than the garden's memory" }
  state.entities.splice(index, 1)
  const refund = refundFor(content, entity)
  addItems(state, refund)
  for (const c of state.creatures) {
    if (c.homeId === entityId) {
      c.homeId = null
      c.hidden = false
      c.activity = 'leaving'
      c.stayMs = 0
    }
    if (c.targetId === entityId) c.targetId = null
  }
  state.layoutVersion++
  return { ok: true, events: [], undo: { type: 'remove', entity: clone(entity), refund } }
}

/** Reverses a layout change. Fails if the garden has changed too much since. */
export function undo(state: GameState, content: Content, record: UndoRecord): ActionResult {
  switch (record.type) {
    case 'place': {
      const index = state.entities.findIndex((e) => e.id === record.entityId)
      if (index < 0) return { ok: false, reason: 'It is no longer there' }
      const [entity] = state.entities.splice(index, 1)
      if (entity?.kind === 'structure') {
        state.stats.built[entity.defId] = Math.max(0, (state.stats.built[entity.defId] ?? 1) - 1)
      }
      addItems(state, record.refund)
      for (const c of state.creatures) {
        if (c.homeId === record.entityId) {
          c.homeId = null
          c.hidden = false
          c.activity = 'leaving'
          c.stayMs = 0
        }
      }
      state.layoutVersion++
      return { ok: true, events: [] }
    }
    case 'move': {
      const entity = entityById(state, record.entityId)
      if (!entity) return { ok: false, reason: 'It is no longer there' }
      const check = checkPlacement(
        state,
        content,
        placeableOf(entity),
        record.fromX,
        record.fromY,
        entity.id,
      )
      if (!check.ok) return { ok: false, reason: 'Its old spot is taken' }
      entity.x = record.fromX
      entity.y = record.fromY
      state.layoutVersion++
      return { ok: true, events: [] }
    }
    case 'remove': {
      const e = record.entity
      const check = checkPlacement(state, content, placeableOf(e), e.x, e.y)
      if (!check.ok) return { ok: false, reason: 'Its old spot is taken' }
      if (!hasItems(state, record.refund))
        return { ok: false, reason: 'Its materials have been used' }
      removeItems(state, record.refund)
      state.entities.push(clone(e))
      state.layoutVersion++
      return { ok: true, events: [] }
    }
  }
}
