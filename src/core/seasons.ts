// A gentle in-game year. The seasons begin when the Four Seasons Garden opens
// (the "seasons" unlock); until then every season's flowers and visitors are
// welcome all the time. A season lasts an hour of play, and nothing is ever
// lost when one ends.

import type { Season } from './content'
import type { StepContext } from './simulation'
import type { GameState } from './state'

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']
export const SEASON_MS = 60 * 60_000
export const SEASONS_UNLOCK = 'seasons'

export function seasonsBegun(state: GameState): boolean {
  return state.unlocks.includes(SEASONS_UNLOCK)
}

/** The current season, or null before the seasons have begun. */
export function currentSeason(state: GameState): Season | null {
  if (!seasonsBegun(state)) return null
  return SEASONS[Math.floor(state.elapsedMs / SEASON_MS) % SEASONS.length]!
}

/** Whether something limited to these seasons is active now (always, before the seasons begin). */
export function inSeason(state: GameState, seasons: readonly Season[] | undefined): boolean {
  if (!seasons) return true
  const season = currentSeason(state)
  return season === null || seasons.includes(season)
}

/** Time until the next season begins. */
export function msToNextSeason(state: GameState): number {
  return SEASON_MS - (state.elapsedMs % SEASON_MS)
}

/** System: notes each season as it arrives. */
export function seasonSystem(state: GameState, _content: unknown, _dtMs: number, ctx: StepContext) {
  const season = currentSeason(state)
  if (!season || state.stats.seasonsSeen.includes(season)) return
  state.stats.seasonsSeen.push(season)
  ctx.events.push({ type: 'seasonBegan', season })
}
