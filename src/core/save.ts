// Save format: a versioned wrapper around the game state, with migrations so
// older saves keep loading as the state shape changes.

import type { Content, Terrain } from './content'
import { STATE_VERSION, type GameState } from './state'

export const SAVE_FORMAT = 'zen-garden-save'

export interface SaveData {
  format: typeof SAVE_FORMAT
  version: number
  /** Wall-clock time (ms since epoch) when the save was written. */
  savedAt: number
  state: GameState
}

export class SaveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SaveError'
  }
}

export type Migration = (
  state: Record<string, unknown>,
  content: Content,
) => Record<string, unknown>

/**
 * Migrations from version N to N + 1, keyed by N. Add one whenever
 * STATE_VERSION is bumped, transforming the raw saved state.
 */
export const migrations: Record<number, Migration> = {
  1: addBambooGrove,
}

/**
 * Version 1 → 2: the map grows east to include the bamboo grove. The old
 * garden keeps its terrain and everything in it; the gate moves from the
 * north wall to the east wall, and the grove's fixed features are added.
 */
function addBambooGrove(raw: Record<string, unknown>, content: Content): Record<string, unknown> {
  const s = raw as unknown as GameState
  const map = content.map
  const oldWidth = s.width
  const terrain: Terrain[] = [...map.terrain]
  for (let y = 0; y < Math.min(s.height, map.height); y++) {
    for (let x = 0; x < Math.min(oldWidth, map.width); x++)
      terrain[y * map.width + x] = s.terrain[y * oldWidth + x]!
  }
  // Fixed features that have moved in the new map (the gate) go to their new place.
  for (const e of s.entities) {
    if (!e.fixed) continue
    const home = map.fixed.find((f) => f.id === e.defId && f.x === e.x && f.y === e.y)
    if (home) continue
    const moved = map.fixed.find(
      (f) => f.id === e.defId && !s.entities.some((o) => o.x === f.x && o.y === f.y),
    )
    if (!moved) continue
    terrain[e.y * map.width + e.x] = map.terrain[e.y * map.width + e.x]!
    e.x = moved.x
    e.y = moved.y
    terrain[e.y * map.width + e.x] = map.terrain[e.y * map.width + e.x]!
  }
  // Fixed features in the new columns.
  for (const f of map.fixed) {
    if (f.x < oldWidth) continue
    const id = s.nextId++
    if (f.kind === 'plant') {
      const def = content.plants[f.id]
      s.entities.push({
        id,
        kind: 'plant',
        defId: f.id,
        x: f.x,
        y: f.y,
        stage: f.stage ?? (def ? def.stages.length - 1 : 0),
        progressMs: 0,
        produceMs: def ? def.produces.map(() => 0) : [],
        wateredMs: 0,
        fixed: true,
      })
    } else {
      s.entities.push({ id, kind: 'decoration', defId: f.id, x: f.x, y: f.y, fixed: true })
    }
  }
  s.terrain = terrain
  s.width = map.width
  s.height = map.height
  s.mapId = map.id
  s.areasVisited = []
  s.stats.clearedIn = {}
  s.layoutVersion++
  return s as unknown as Record<string, unknown>
}

export function serialize(state: GameState, savedAt: number): SaveData {
  return {
    format: SAVE_FORMAT,
    version: STATE_VERSION,
    savedAt,
    state: JSON.parse(JSON.stringify(state)) as GameState,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validates and migrates saved data. Throws SaveError if it cannot be used. */
export function deserialize(
  raw: unknown,
  content: Content,
  migrationTable = migrations,
  currentVersion = STATE_VERSION,
): SaveData {
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT)
    throw new SaveError('This is not a Zen Garden save')
  const version = raw.version
  if (typeof version !== 'number' || !Number.isInteger(version))
    throw new SaveError('The save has no version')
  if (version > currentVersion)
    throw new SaveError('This save comes from a newer version of the game')
  if (typeof raw.savedAt !== 'number') throw new SaveError('The save has no timestamp')
  if (!isRecord(raw.state)) throw new SaveError('The save has no garden in it')
  let state = raw.state
  for (let v = version; v < currentVersion; v++) {
    const migrate = migrationTable[v]
    if (!migrate) throw new SaveError(`No way to update a version ${v} save`)
    state = migrate(state, content)
  }
  const s = state as unknown as GameState
  const valid =
    Array.isArray(s.terrain) &&
    typeof s.width === 'number' &&
    typeof s.height === 'number' &&
    s.terrain.length === s.width * s.height &&
    Array.isArray(s.entities) &&
    Array.isArray(s.drops) &&
    Array.isArray(s.creatures) &&
    isRecord(s.inventory) &&
    isRecord(s.stats) &&
    typeof s.elapsedMs === 'number'
  if (!valid) throw new SaveError('The saved garden is damaged')
  s.version = currentVersion
  return { format: SAVE_FORMAT, version: currentVersion, savedAt: raw.savedAt, state: s }
}
