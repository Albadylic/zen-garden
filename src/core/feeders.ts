// Feeders: structures filled with an item (maple sap) that attract visitors
// while they last. An empty feeder simply waits to be refilled.

import type { Content } from './content'
import { entityById } from './grid'
import { hasItems, removeItems } from './inventory'
import type { ActionResult } from './layout'
import type { StepContext } from './simulation'
import type { GameState, StructureEntity } from './state'

export function isFilled(s: StructureEntity): boolean {
  return (s.filledMs ?? 0) > 0
}

export function fillFeeder(state: GameState, content: Content, entityId: number): ActionResult {
  const s = entityById(state, entityId)
  const feeder = s?.kind === 'structure' ? content.structures[s.defId]?.feeder : undefined
  if (s?.kind !== 'structure' || !feeder) return { ok: false, reason: 'This is not a feeder' }
  const cost = { [feeder.item]: 1 }
  if (!hasItems(state, cost)) {
    return {
      ok: false,
      reason: `No ${content.items[feeder.item]?.name.toLowerCase() ?? 'filling'} to fill it with`,
    }
  }
  removeItems(state, cost)
  // Topping up adds a full measure, up to two in reserve.
  s.filledMs = Math.min((s.filledMs ?? 0) + feeder.durationSec * 1000, feeder.durationSec * 2000)
  return { ok: true, events: [{ type: 'filled', entityId, structureId: s.defId }] }
}

/** System: feeders empty slowly while visitors use them. */
export function drainFeeders(
  state: GameState,
  content: Content,
  dtMs: number,
  _ctx: StepContext,
): void {
  for (const e of state.entities) {
    if (e.kind === 'structure' && e.filledMs && content.structures[e.defId]?.feeder) {
      e.filledMs = Math.max(0, e.filledMs - dtMs)
    }
  }
}
