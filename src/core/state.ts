import type { Activity, Terrain } from './content'

export interface PlantEntity {
  id: number
  kind: 'plant'
  defId: string
  x: number
  y: number
  stage: number
  /** Milliseconds of growth accumulated in the current stage. */
  progressMs: number
  /** Accumulated production time, one entry per production rule. */
  produceMs: number[]
  /** Remaining milliseconds of the watering boost. */
  wateredMs: number
  /** Milliseconds until it can be harvested again (absent or 0: ready). */
  harvestMs?: number
  fixed: boolean
}

export interface StructureEntity {
  id: number
  kind: 'structure'
  defId: string
  x: number
  y: number
  level: number
  visits: number
  produceMs: number[]
  /** Milliseconds a feeder stays filled. */
  filledMs?: number
  fixed: boolean
}

export interface DecorationEntity {
  id: number
  kind: 'decoration'
  defId: string
  x: number
  y: number
  fixed: boolean
}

export type Entity = PlantEntity | StructureEntity | DecorationEntity

/** A natural item lying in the garden, waiting to be gathered. */
export interface Drop {
  id: number
  itemId: string
  amount: number
  x: number
  y: number
  sourceId: number
  ageMs: number
}

export interface Creature {
  id: number
  speciesId: string
  /** Position in grid units (fractional). */
  x: number
  y: number
  activity: Activity
  targetX: number
  targetY: number
  /** Entity the creature is heading to or using. */
  targetId: number | null
  /** Structure the creature lives in, for shelter species. */
  homeId: number | null
  /** Milliseconds left in the current activity. */
  timerMs: number
  /** Milliseconds left before the creature leaves. */
  stayMs: number
  /** Hidden creatures are inside a shelter and not drawn. */
  hidden: boolean
}

export interface Stats {
  planted: Record<string, number>
  /** Number of plants that have reached each growth stage, keyed by stage index. */
  grown: Record<number, number>
  flowered: number
  collected: number
  cleared: number
  /** Overgrown tiles cleared, per area. */
  clearedIn: Record<string, number>
  seen: Record<string, number>
  built: Record<string, number>
  visits: Record<string, number>
  upgraded: number
  /** Plants that reached their final stage, per species. */
  matured: Record<string, number>
  /** Items gathered, harvested or found, per item. */
  gathered: Record<string, number>
  /** Shelters upgraded into each branch. */
  branched: Record<string, number>
}

export interface JournalRecord {
  discoveredAtMs: number
  encounters: number
  /** Facts known when the player last read this entry; absent until first read. */
  read?: number
}

export interface ProjectProgress {
  /** The approach being worked on, or null when it is time to choose one. */
  approach: string | null
  /** Completed stage ids, across all approaches. */
  stagesDone: string[]
  /** Approaches finished so far. */
  approachesDone: string[]
}

export interface GameState {
  version: number
  seed: number
  /** Current state of the seeded random number generator. */
  rng: number
  /** Total simulated milliseconds since the garden was created. */
  elapsedMs: number
  /** Simulated time not yet consumed by a full step. */
  pendingMs: number
  nextId: number
  mapId: string
  width: number
  height: number
  terrain: Terrain[]
  entities: Entity[]
  drops: Drop[]
  creatures: Creature[]
  inventory: Record<string, number>
  stats: Stats
  journal: Record<string, JournalRecord>
  /** Completed milestone ids mapped to the simulated time they completed. */
  milestones: Record<string, number>
  unlocks: string[]
  /** Restoration projects started, by project id. */
  projects: Record<string, ProjectProgress>
  /** Areas the player has looked around since they opened. */
  areasVisited: string[]
  /** Bumped whenever terrain or anything affecting the environment changes. */
  layoutVersion: number
}

export const STATE_VERSION = 2

export function emptyStats(): Stats {
  return {
    planted: {},
    grown: {},
    flowered: 0,
    collected: 0,
    cleared: 0,
    clearedIn: {},
    seen: {},
    built: {},
    visits: {},
    upgraded: 0,
    matured: {},
    gathered: {},
    branched: {},
  }
}
