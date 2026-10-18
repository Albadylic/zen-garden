// The seasons follow the real calendar. They begin when the Four Seasons
// Garden opens (the "seasons" unlock); until then every season's flowers are
// welcome all the time. The app tells the garden the month and the player's
// hemisphere, since the simulation never reads a clock itself. Nothing is ever
// lost when a season ends.

import type { Season } from './content'
import type { StepContext } from './simulation'
import type { Calendar, GameState, Hemisphere } from './state'

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']
export const SEASONS_UNLOCK = 'seasons'

export function emptyCalendar(): Calendar {
  return { month: 0, hemisphere: null, noted: null }
}

export function seasonsBegun(state: GameState): boolean {
  return state.unlocks.includes(SEASONS_UNLOCK)
}

/**
 * The season of a calendar month (0 = January), by meteorological seasons:
 * in the north, spring is March to May; the south is half a year apart.
 */
export function seasonOfMonth(month: number, hemisphere: Hemisphere | null): Season {
  const shifted = hemisphere === 'south' ? month + 6 : month
  // December, January and February are winter (index 3); March starts spring (index 0).
  return SEASONS[Math.floor(((((shifted - 2) % 12) + 12) % 12) / 3)]!
}

/** The current season, or null before the seasons have begun. */
export function currentSeason(state: GameState): Season | null {
  if (!seasonsBegun(state)) return null
  return seasonOfMonth(state.calendar.month, state.calendar.hemisphere)
}

/** Whether something limited to these seasons is active now (always, before the seasons begin). */
export function inSeason(state: GameState, seasons: readonly Season[] | undefined): boolean {
  if (!seasons) return true
  const season = currentSeason(state)
  return season === null || seasons.includes(season)
}

/**
 * Whether a seasonal visitor can come now. Unlike `inSeason`, it waits for the
 * seasons to begin: a species of the seasons belongs to the garden that brings them.
 */
export function visitsInSeason(state: GameState, seasons: readonly Season[] | undefined): boolean {
  if (!seasons) return true
  const season = currentSeason(state)
  return season !== null && seasons.includes(season)
}

/** Tells the garden the calendar month (0 = January) and, when known, the hemisphere. */
export function setCalendar(state: GameState, month: number, hemisphere?: Hemisphere): void {
  state.calendar.month = month
  if (hemisphere) state.calendar.hemisphere = hemisphere
}

/** System: notes each new season as it arrives. */
export function seasonSystem(state: GameState, _content: unknown, _dtMs: number, ctx: StepContext) {
  const season = currentSeason(state)
  if (!season || state.calendar.noted === season) return
  state.calendar.noted = season
  if (!state.stats.seasonsSeen.includes(season)) state.stats.seasonsSeen.push(season)
  ctx.events.push({ type: 'seasonBegan', season })
}
