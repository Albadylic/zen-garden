// Core game state and simulation entry points.
// This module must stay free of React, PixiJS and browser APIs so the same
// simulation can run in the browser, in tests, and inside a native wrapper.

export interface GameState {
  /** Save format version, bumped when the shape of GameState changes. */
  version: number
  /** Total simulated time in milliseconds since the garden was created. */
  elapsedMs: number
}

export const SAVE_VERSION = 1

export function createGame(): GameState {
  return { version: SAVE_VERSION, elapsedMs: 0 }
}

/** Advance the simulation by `deltaMs`. Returns a new state; never mutates. */
export function advance(state: GameState, deltaMs: number): GameState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new RangeError(`deltaMs must be a non-negative finite number, got ${deltaMs}`)
  }
  return { ...state, elapsedMs: state.elapsedMs + deltaMs }
}
