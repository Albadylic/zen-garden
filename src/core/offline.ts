// Catching up on time away, and summarising what changed for the return recap.

import type { Content } from './content'
import type { GameEvent } from './events'
import { unreadCount } from './journal'
import { isSlowGrowing, timeToMaturity } from './plants'
import { advance } from './simulation'
import type { GameState } from './state'

/** The garden grows for at most this long while the player is away. */
export const OFFLINE_CAP_MS = 8 * 60 * 60_000
/** Absences shorter than this are simply played through, with no recap. */
export const RECAP_THRESHOLD_MS = 60_000

export interface Recap {
  awayMs: number
  simulatedMs: number
  capped: boolean
  stagesGrown: number
  matured: string[]
  flowered: number
  mossSpread: number
  itemsWaiting: number
  visits: number
  newSpecies: string[]
  newEntries: number
  factsLearned: number
  /** Journal entries with something unread, shown as one line rather than listed. */
  unreadNotes: number
  milestones: string[]
  shelterResidents: number
  /** Slow-growing plants still on their way, as a gentle reminder (not news by itself). */
  growing: { name: string; stage: string; remainingMs: number }[]
}

export function hasNews(r: Recap): boolean {
  return (
    r.stagesGrown +
      r.flowered +
      r.mossSpread +
      r.itemsWaiting +
      r.visits +
      r.newEntries +
      r.factsLearned +
      r.shelterResidents >
      0 || r.milestones.length > 0
  )
}

export function summarise(
  state: GameState,
  content: Content,
  events: GameEvent[],
  awayMs: number,
  simulatedMs: number,
): Recap {
  const matured = new Set<string>()
  const newSpecies: string[] = []
  const recap: Recap = {
    awayMs,
    simulatedMs,
    capped: simulatedMs < awayMs,
    stagesGrown: 0,
    matured: [],
    flowered: 0,
    mossSpread: 0,
    itemsWaiting: state.drops.reduce((n, d) => n + d.amount, 0),
    visits: 0,
    newSpecies,
    newEntries: 0,
    factsLearned: 0,
    unreadNotes: unreadCount(state, content),
    milestones: [],
    shelterResidents: 0,
    growing: [],
  }
  for (const e of events) {
    switch (e.type) {
      case 'plantStage': {
        recap.stagesGrown++
        const def = content.plants[e.plantId]
        if (def && e.stage === def.stages.length - 1) matured.add(def.name)
        break
      }
      case 'flowering':
        recap.flowered++
        break
      case 'mossSpread':
        recap.mossSpread++
        break
      case 'wildlifeArrived':
        recap.visits++
        break
      case 'shelterVisited':
        recap.shelterResidents++
        break
      case 'discovery':
        recap.newEntries++
        if (e.key.startsWith('wildlife:')) newSpecies.push(e.name)
        break
      case 'factRevealed':
        recap.factsLearned++
        break
      case 'milestone':
        recap.milestones.push(e.title)
        break
    }
  }
  recap.matured = [...matured]
  // One line per slow-growing species: the planting nearest to maturity.
  const nearest = new Map<string, Recap['growing'][number]>()
  for (const e of state.entities) {
    if (e.kind !== 'plant' || e.fixed || !isSlowGrowing(content, e.defId)) continue
    const remainingMs = timeToMaturity(state, content, e)
    const def = content.plants[e.defId]
    if (remainingMs === null || !def) continue
    const known = nearest.get(e.defId)
    if (!known || remainingMs < known.remainingMs) {
      const stage = def.stages[e.stage]?.name ?? ''
      nearest.set(e.defId, { name: def.name, stage, remainingMs })
    }
  }
  recap.growing = [...nearest.values()]
  return recap
}

/** Simulates time away (capped) and returns a summary of what happened. */
export function catchUp(
  state: GameState,
  content: Content,
  awayMs: number,
): { events: GameEvent[]; recap: Recap } {
  const simulatedMs = Math.max(0, Math.min(awayMs, OFFLINE_CAP_MS))
  const events = advance(state, content, simulatedMs, { offline: true })
  return { events, recap: summarise(state, content, events, awayMs, simulatedMs) }
}
