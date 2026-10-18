import { emptyCalendar } from './seasons'
import type { Content, FixedObject } from './content'
import { emptyStats, STATE_VERSION, type Entity, type GameState, type GardenTiles } from './state'

/** A fixed feature from a garden's map as a new entity. */
export function fixedEntity(content: Content, f: FixedObject, id: number): Entity {
  const base = { id, defId: f.id, x: f.x, y: f.y, fixed: true }
  if (f.kind === 'plant') {
    const def = content.plants[f.id]
    return {
      ...base,
      kind: 'plant',
      stage: f.stage ?? (def ? def.stages.length - 1 : 0),
      progressMs: 0,
      produceMs: def ? def.produces.map(() => 0) : [],
      wateredMs: 0,
    }
  }
  return { ...base, kind: 'decoration' }
}

/** A built garden's tiles as they are before the player changes anything. */
export function freshGardenTiles(content: Content, gardenId: string): GardenTiles | undefined {
  const g = content.world.gardens.find((d) => d.id === gardenId)
  if (!g) return undefined
  const { x, y, w: width, h: height } = g.bounds
  return { x, y, width, height, terrain: [...g.terrain] }
}

/** Creates a fresh sanctuary from the content's world. */
export function createGame(content: Content, seed: number): GameState {
  const { world } = content
  let nextId = 1
  const entities: Entity[] = world.fixed.map((f) => fixedEntity(content, f, nextId++))
  return {
    version: STATE_VERSION,
    seed,
    rng: seed | 0,
    elapsedMs: 0,
    pendingMs: 0,
    nextId,
    worldId: world.id,
    gardens: Object.fromEntries(world.gardens.map((g) => [g.id, freshGardenTiles(content, g.id)!])),
    entities,
    drops: [],
    creatures: [],
    inventory: { ...world.startingInventory },
    stats: emptyStats(),
    // The player starts out knowing the items they carry.
    journal: Object.fromEntries(
      Object.keys(world.startingInventory).map((id) => [
        `item:${id}`,
        {
          discoveredAtMs: 0,
          encounters: 1,
          read: (content.items[id]?.facts ?? []).filter((f) => f.after <= 1).length,
        },
      ]),
    ),
    milestones: {},
    unlocks: [],
    gardensVisited: [],
    projects: {},
    layoutVersion: 0,
    calendar: emptyCalendar(),
  }
}

export function nextId(state: GameState): number {
  return state.nextId++
}
