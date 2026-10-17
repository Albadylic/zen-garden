// Chapter milestones: conditions, completion, unlocks, and progress for the UI.

import type { Condition, Content, MilestoneDef } from './content'
import type { StepContext } from './simulation'
import type { GameEvent } from './events'
import type { GameState } from './state'

const sum = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0)

/** How far along a condition is: current value against its target. */
export function conditionProgress(
  state: GameState,
  c: Condition,
): { current: number; target: number } {
  const s = state.stats
  switch (c.kind) {
    case 'planted':
      return { current: c.plant ? (s.planted[c.plant] ?? 0) : sum(s.planted), target: c.count }
    case 'grown':
      return { current: s.grown[c.stage] ?? 0, target: c.count }
    case 'flowering':
      return { current: s.flowered, target: c.count }
    case 'collected':
      return { current: s.collected, target: c.count }
    case 'cleared':
      return { current: s.cleared, target: c.count }
    case 'seen':
      return { current: c.wildlife ? (s.seen[c.wildlife] ?? 0) : sum(s.seen), target: c.count }
    case 'built':
      return { current: s.built[c.structure] ?? 0, target: c.count }
    case 'visited':
      return { current: s.visits[c.structure] ?? 0, target: c.count }
    case 'speciesMature':
      return { current: Object.keys(s.matured).length, target: c.count }
    case 'milestone':
      return { current: state.milestones[c.id] !== undefined ? 1 : 0, target: 1 }
  }
}

export function conditionMet(state: GameState, c: Condition): boolean {
  const { current, target } = conditionProgress(state, c)
  return current >= target
}

/** The first milestone not yet completed, or undefined once the chapter is done. */
export function currentMilestone(state: GameState, content: Content): MilestoneDef | undefined {
  return content.chapter.milestones.find((m) => state.milestones[m.id] === undefined)
}

export function chapterComplete(state: GameState, content: Content): boolean {
  return state.unlocks.includes(content.chapter.completionUnlock)
}

function unlock(state: GameState, key: string, events: GameEvent[]): void {
  if (state.unlocks.includes(key)) return
  state.unlocks.push(key)
  events.push({ type: 'unlocked', key })
}

/**
 * Completes milestones in order while their conditions hold. Progress made
 * out of order still counts, so several may complete at once.
 */
export function checkMilestones(state: GameState, content: Content): GameEvent[] {
  const events: GameEvent[] = []
  for (const m of content.chapter.milestones) {
    if (state.milestones[m.id] !== undefined) continue
    if (!m.conditions.every((c) => conditionMet(state, c))) break
    state.milestones[m.id] = state.elapsedMs
    events.push({ type: 'milestone', milestoneId: m.id, title: m.title })
    for (const key of m.unlocks) unlock(state, key, events)
  }
  if (!currentMilestone(state, content) && !chapterComplete(state, content)) {
    unlock(state, content.chapter.completionUnlock, events)
    events.push({ type: 'chapterComplete', chapterId: content.chapter.id })
  }
  return events
}

/** System: checks milestones every step. */
export function progressSystem(
  state: GameState,
  content: Content,
  _dtMs: number,
  ctx: StepContext,
): void {
  ctx.events.push(...checkMilestones(state, content))
}
