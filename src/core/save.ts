// Save format: a versioned wrapper around the game state, with migrations so
// older saves keep loading as the state shape changes.

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

/**
 * Migrations from version N to N + 1, keyed by N. Add one whenever
 * STATE_VERSION is bumped, transforming the raw saved state.
 */
export const migrations: Record<
  number,
  (state: Record<string, unknown>) => Record<string, unknown>
> = {}

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
    state = migrate(state)
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
