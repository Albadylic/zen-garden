// Habitat structures: upgrading through levels.

import type { Content, StructureLevelDef } from './content'
import { entityById } from './grid'
import { hasItems, removeItems } from './inventory'
import { type ActionResult, hasUnlock } from './layout'
import type { GameState, StructureEntity } from './state'

export type UpgradeStatus =
  | { kind: 'max' }
  | { kind: 'locked' }
  | { kind: 'needsVisits'; visits: number; needed: number }
  | { kind: 'needsItems'; cost: Record<string, number> }
  | { kind: 'ready'; cost: Record<string, number> }

export function nextLevel(content: Content, s: StructureEntity): StructureLevelDef | undefined {
  return content.structures[s.defId]?.levels[s.level + 1]
}

export function upgradeStatus(
  state: GameState,
  content: Content,
  s: StructureEntity,
): UpgradeStatus {
  const next = nextLevel(content, s)
  if (!next) return { kind: 'max' }
  if (!hasUnlock(state, `upgrade:${s.defId}`)) return { kind: 'locked' }
  const needed = next.upgradeAfterVisits ?? 0
  if (s.visits < needed) return { kind: 'needsVisits', visits: s.visits, needed }
  const cost = next.upgradeCost ?? {}
  return hasItems(state, cost) ? { kind: 'ready', cost } : { kind: 'needsItems', cost }
}

export function upgradeStructure(
  state: GameState,
  content: Content,
  entityId: number,
): ActionResult {
  const s = entityById(state, entityId)
  if (s?.kind !== 'structure') return { ok: false, reason: 'Nothing to improve' }
  const status = upgradeStatus(state, content, s)
  switch (status.kind) {
    case 'max':
      return { ok: false, reason: 'Already fully improved' }
    case 'locked':
      return { ok: false, reason: 'Not discovered yet' }
    case 'needsVisits':
      return { ok: false, reason: 'Wait until wildlife has used it' }
    case 'needsItems':
      return { ok: false, reason: 'Not enough materials' }
  }
  removeItems(state, status.cost)
  s.level++
  s.produceMs = (content.structures[s.defId]?.levels[s.level]?.produces ?? []).map(() => 0)
  state.stats.upgraded++
  state.layoutVersion++
  return {
    ok: true,
    events: [{ type: 'upgraded', entityId: s.id, structureId: s.defId, level: s.level }],
  }
}
