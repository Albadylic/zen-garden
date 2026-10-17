// Habitat structures: upgrading through levels, including branching choices.
// Each level names the level it grows from, so a structure can offer one
// next step or several branches, and new levels never renumber old ones.

import type { Content, StructureLevelDef } from './content'
import { entityById } from './grid'
import { hasItems, removeItems } from './inventory'
import { type ActionResult, hasUnlock } from './layout'
import type { GameState, StructureEntity } from './state'

export type UpgradeStatus =
  | { kind: 'locked' }
  | { kind: 'needsVisits'; visits: number; needed: number }
  | { kind: 'needsItems'; cost: Record<string, number> }
  | { kind: 'ready'; cost: Record<string, number> }

export interface UpgradeOption {
  /** Index of the level this option upgrades to. */
  level: number
  def: StructureLevelDef
  status: UpgradeStatus
}

/** The level a level grows from: its `from`, or the one before it. */
export function parentLevel(def: StructureLevelDef, index: number): number | undefined {
  if (index === 0) return undefined
  return def.from ?? index - 1
}

/** Levels the structure can grow into from its current level. */
export function upgradeOptions(
  state: GameState,
  content: Content,
  s: StructureEntity,
): UpgradeOption[] {
  const levels = content.structures[s.defId]?.levels ?? []
  return levels.flatMap((def, index) => {
    if (parentLevel(def, index) !== s.level) return []
    let status: UpgradeStatus
    const needed = def.upgradeAfterVisits ?? 0
    const cost = def.upgradeCost ?? {}
    if (!hasUnlock(state, def.unlock ?? `upgrade:${s.defId}`)) status = { kind: 'locked' }
    else if (s.visits < needed) status = { kind: 'needsVisits', visits: s.visits, needed }
    else status = hasItems(state, cost) ? { kind: 'ready', cost } : { kind: 'needsItems', cost }
    return [{ level: index, def, status }]
  })
}

/** The tier of the structure's current level (0 for the first). */
export function tierOf(content: Content, s: StructureEntity): number {
  return content.structures[s.defId]?.levels[s.level]?.tier ?? s.level
}

export function upgradeStructure(
  state: GameState,
  content: Content,
  entityId: number,
  toLevel?: number,
): ActionResult {
  const s = entityById(state, entityId)
  if (s?.kind !== 'structure') return { ok: false, reason: 'Nothing to improve' }
  const options = upgradeOptions(state, content, s)
  if (options.length === 0) return { ok: false, reason: 'Already fully improved' }
  const option = toLevel === undefined ? options[0]! : options.find((o) => o.level === toLevel)
  if (!option) return { ok: false, reason: 'That is not a next step for this shelter' }
  switch (option.status.kind) {
    case 'locked':
      return { ok: false, reason: 'Not discovered yet' }
    case 'needsVisits':
      return { ok: false, reason: 'Wait until wildlife has used it' }
    case 'needsItems':
      return { ok: false, reason: 'Not enough materials' }
  }
  removeItems(state, option.status.cost)
  s.level = option.level
  s.produceMs = option.def.produces.map(() => 0)
  state.stats.upgraded++
  if (option.def.branch) {
    state.stats.branched[option.def.branch] = (state.stats.branched[option.def.branch] ?? 0) + 1
  }
  state.layoutVersion++
  return {
    ok: true,
    events: [{ type: 'upgraded', entityId: s.id, structureId: s.defId, level: s.level }],
  }
}
