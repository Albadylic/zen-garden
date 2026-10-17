// The naturalist's journal: entries are discovered by encountering things in
// the garden, and their facts are revealed through repeated encounters.

import type { Content, Fact } from './content'
import type { GameEvent } from './events'
import type { StepContext } from './simulation'
import type { GameState } from './state'

export type JournalSection = 'plant' | 'wildlife' | 'structure' | 'item'

export interface JournalEntryDef {
  key: string
  section: JournalSection
  name: string
  description: string
  facts: Fact[]
}

/** Every entry the journal can hold, in content order. */
export function journalEntries(content: Content): JournalEntryDef[] {
  return [
    ...Object.values(content.plants).map((d) => ({
      key: `plant:${d.id}`,
      section: 'plant' as const,
      ...d,
    })),
    ...Object.values(content.wildlife).map((d) => ({
      key: `wildlife:${d.id}`,
      section: 'wildlife' as const,
      ...d,
    })),
    ...Object.values(content.structures).map((d) => ({
      key: `structure:${d.id}`,
      section: 'structure' as const,
      ...d,
    })),
    ...Object.values(content.items).map((d) => ({
      key: `item:${d.id}`,
      section: 'item' as const,
      ...d,
    })),
  ]
}

export function entryFor(content: Content, key: string): JournalEntryDef | undefined {
  const [section, id] = key.split(':') as [JournalSection, string]
  const def =
    section === 'plant'
      ? content.plants[id]
      : section === 'wildlife'
        ? content.wildlife[id]
        : section === 'structure'
          ? content.structures[id]
          : section === 'item'
            ? content.items[id]
            : undefined
  return def
    ? { key, section, name: def.name, description: def.description, facts: def.facts }
    : undefined
}

export function knownFacts(state: GameState, content: Content, key: string): Fact[] {
  const record = state.journal[key]
  const entry = entryFor(content, key)
  if (!record || !entry) return []
  return entry.facts.filter((f) => f.after <= record.encounters)
}

/** Counts an encounter, discovering the entry the first time and revealing facts as they are earned. */
export function encounter(
  state: GameState,
  content: Content,
  key: string,
  events: GameEvent[],
): void {
  const entry = entryFor(content, key)
  if (!entry) return
  const record = state.journal[key]
  if (!record) {
    state.journal[key] = { discoveredAtMs: state.elapsedMs, encounters: 1 }
    events.push({ type: 'discovery', key, name: entry.name })
  } else {
    record.encounters++
  }
  const n = state.journal[key]!.encounters
  for (const f of entry.facts) {
    // Facts due on the first encounter arrive with the discovery itself.
    if (f.after === n && n > 1) events.push({ type: 'factRevealed', key, text: f.text })
  }
}

/** Records a discovery by observation (for example, inspecting something) without counting repeats. */
export function observe(state: GameState, content: Content, key: string): GameEvent[] {
  const events: GameEvent[] = []
  if (!state.journal[key]) encounter(state, content, key, events)
  return events
}

/** Journal keys that an event counts as an encounter with. */
function keysFor(state: GameState, e: GameEvent): string[] {
  switch (e.type) {
    case 'planted':
      return [`plant:${e.plantId}`]
    case 'plantStage': {
      const plant = state.entities.find((p) => p.id === e.entityId)
      return plant?.kind === 'plant' ? [`plant:${e.plantId}`] : []
    }
    case 'wildlifeArrived':
      return [`wildlife:${e.speciesId}`]
    case 'built':
    case 'upgraded':
      return [`structure:${e.structureId}`]
    case 'shelterVisited':
      return [`structure:${e.structureId}`]
    case 'collected':
    case 'cleared':
    case 'harvested':
      return Object.keys(e.items).map((id) => `item:${id}`)
    default:
      return []
  }
}

/** Records encounters for a batch of events and returns the journal events they caused. */
export function recordJournal(
  state: GameState,
  content: Content,
  events: GameEvent[],
): GameEvent[] {
  const out: GameEvent[] = []
  for (const e of events) for (const key of keysFor(state, e)) encounter(state, content, key, out)
  return out
}

const cursors = new WeakMap<StepContext, number>()

/** System: records encounters for everything that happened earlier in this advance. */
export function journalSystem(
  state: GameState,
  content: Content,
  _dtMs: number,
  ctx: StepContext,
): void {
  const from = cursors.get(ctx) ?? 0
  const fresh = ctx.events.slice(from)
  const out = recordJournal(state, content, fresh)
  ctx.events.push(...out)
  cursors.set(ctx, ctx.events.length)
}
