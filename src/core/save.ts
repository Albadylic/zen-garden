// Save format: a versioned wrapper around the game state, with migrations so
// older saves keep loading as the state shape changes.

import type { Content } from './content'
import { fixedEntity, freshGardenTiles } from './game'
import { setTerrain, terrainAt } from './grid'
import { migrations } from './migrations'
import { emptyStats, STATE_VERSION, type GameState } from './state'

export { type Migration, migrations } from './migrations'

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

export function serialize(state: GameState, savedAt: number): SaveData {
  return {
    format: SAVE_FORMAT,
    version: STATE_VERSION,
    savedAt,
    state: JSON.parse(JSON.stringify(state)) as GameState,
  }
}

/**
 * Gardens added to the content since the save was made arrive as they are
 * authored, with their fixed features, so new gardens need no migration.
 */
function addNewGardens(s: GameState, content: Content): void {
  for (const g of content.world.gardens) {
    if (s.gardens[g.id]) continue
    s.gardens[g.id] = freshGardenTiles(content, g.id)!
    for (const f of content.world.fixed) {
      const inside =
        f.x >= g.bounds.x &&
        f.y >= g.bounds.y &&
        f.x < g.bounds.x + g.bounds.w &&
        f.y < g.bounds.y + g.bounds.h
      if (inside) s.entities.push(fixedEntity(content, f, s.nextId++))
    }
    s.layoutVersion++
  }
}

/**
 * Gates added to the content since the save was made: the gate tile and its
 * opening become path, and the gate itself stands in the wall.
 */
function addNewGates(s: GameState, content: Content): void {
  for (const gate of content.world.gates) {
    for (const t of [gate.at, gate.passage]) {
      if (terrainAt(s, t.x, t.y) === 'boundary') setTerrain(s, t.x, t.y, 'path')
    }
    if (s.entities.some((e) => e.x === gate.at.x && e.y === gate.at.y)) continue
    const f = content.world.fixed.find((d) => d.x === gate.at.x && d.y === gate.at.y)
    if (f) s.entities.push(fixedEntity(content, f, s.nextId++))
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
    isRecord(s.gardens) &&
    Object.values(s.gardens).every(
      (g) => isRecord(g) && Array.isArray(g.terrain) && g.terrain.length === g.width * g.height,
    ) &&
    Array.isArray(s.entities) &&
    Array.isArray(s.drops) &&
    Array.isArray(s.creatures) &&
    isRecord(s.inventory) &&
    isRecord(s.stats) &&
    typeof s.elapsedMs === 'number'
  if (!valid) throw new SaveError('The saved garden is damaged')
  // Fields added within a version get their defaults rather than a migration.
  s.stats = { ...emptyStats(), ...s.stats }
  s.gardensVisited ??= []
  s.projects ??= {}
  addNewGardens(s, content)
  addNewGates(s, content)
  s.version = currentVersion
  return { format: SAVE_FORMAT, version: currentVersion, savedAt: raw.savedAt, state: s }
}
