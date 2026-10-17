import type { Content } from './content'
import { emptyStats, STATE_VERSION, type Entity, type GameState } from './state'

/** Creates a fresh garden from the content's starting map. */
export function createGame(content: Content, seed: number): GameState {
  const { map } = content
  let nextId = 1
  const entities: Entity[] = map.fixed.map((f) => {
    const base = { id: nextId++, defId: f.id, x: f.x, y: f.y, fixed: true }
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
  })
  return {
    version: STATE_VERSION,
    seed,
    rng: seed | 0,
    elapsedMs: 0,
    pendingMs: 0,
    nextId,
    mapId: map.id,
    width: map.width,
    height: map.height,
    terrain: [...map.terrain],
    entities,
    drops: [],
    creatures: [],
    inventory: { ...map.startingInventory },
    stats: emptyStats(),
    journal: {},
    milestones: {},
    unlocks: [],
    layoutVersion: 0,
  }
}

export function nextId(state: GameState): number {
  return state.nextId++
}
