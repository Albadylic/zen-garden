// The simulation clock. Time is always handed in by the caller; the core never
// reads a clock itself, which keeps it deterministic and testable.

import type { Content } from './content'
import type { GameEvent } from './events'
import type { GameState } from './state'

export interface StepContext {
  /** True while catching up on time the player was away. */
  offline: boolean
  events: GameEvent[]
}

export type System = (state: GameState, content: Content, dtMs: number, ctx: StepContext) => void

/** Step length while the garden is on screen. */
export const ONLINE_STEP_MS = 250
/** Coarser step used to catch up on time away. */
export const OFFLINE_STEP_MS = 10_000

/** Systems run once per step, in this order. */
const systems: System[] = []

export interface AdvanceOptions {
  offline?: boolean
}

/**
 * Advances the garden by `dtMs` of simulated time, mutating `state` in place,
 * and returns the events that happened along the way.
 */
export function advance(
  state: GameState,
  content: Content,
  dtMs: number,
  options: AdvanceOptions = {},
): GameEvent[] {
  if (!Number.isFinite(dtMs) || dtMs < 0) {
    throw new RangeError(`dtMs must be a non-negative finite number, got ${dtMs}`)
  }
  const ctx: StepContext = { offline: options.offline ?? false, events: [] }
  const step = ctx.offline ? OFFLINE_STEP_MS : ONLINE_STEP_MS
  state.pendingMs += dtMs
  while (state.pendingMs >= step) {
    state.pendingMs -= step
    state.elapsedMs += step
    for (const system of systems) system(state, content, step, ctx)
  }
  return ctx.events
}
