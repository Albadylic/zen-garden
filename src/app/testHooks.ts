// Debug and test access to the running game, enabled with ?debug or ?test in
// the URL. Lets Playwright tap real tiles and fast-forward time.

import type { GardenRenderer } from '../render/GardenRenderer'
import type { Game } from './bootstrap'
import type { GameController } from './GameController'

export interface TestHooks {
  controller: GameController
  /** Screen position (CSS pixels, relative to the canvas) of a tile's centre. */
  tileToScreen(x: number, y: number): { x: number; y: number } | null
  /** Screen position of a creature, or null if hidden. */
  creatureToScreen(id: number): { x: number; y: number } | null
  /** Advances simulated time immediately, as if the garden were on screen. */
  advance(ms: number): void
  /** Simulates returning after time away, including the recap. */
  away(ms: number): void
  /** Saves immediately. */
  save(): Promise<void>
}

declare global {
  interface Window {
    __zen?: TestHooks
  }
}

export function debugEnabled(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.has('debug') || params.has('test')
}

export function installTestHooks(game: Game, renderer: () => GardenRenderer | null): void {
  if (!debugEnabled()) return
  const { controller } = game
  window.__zen = {
    controller,
    tileToScreen: (x, y) => renderer()?.tileToScreen(x, y) ?? null,
    creatureToScreen: (id) => renderer()?.creatureToScreen(id) ?? null,
    advance: (ms) => {
      // Advance in one-second slices so every system sees ordinary steps.
      for (let left = ms; left > 0; left -= 1000) controller.frame(Math.min(1000, left))
    },
    away: (ms) => {
      controller.returnAfter(ms)
    },
    save: () => game.saver.saveNow(),
  }
}
