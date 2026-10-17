// Chapter milestones: conditions, completion, unlocks, and progress for the UI.

import { isInArea } from './areas'
import type { ChapterDef, Condition, Content, MilestoneDef } from './content'
import { addItems } from './inventory'
import type { StepContext } from './simulation'
import type { GameEvent } from './events'
import type { GameState } from './state'

const sum = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0)

/** How far along a condition is: current value against its target. */
export function conditionProgress(
  state: GameState,
  content: Content,
  c: Condition,
): { current: number; target: number } {
  const s = state.stats
  const inArea = (areaId: string, x: number, y: number) => {
    const area = content.map.areas.find((a) => a.id === areaId)
    return !!area && isInArea(area, x, y)
  }
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
    case 'visitedArea':
      return { current: state.areasVisited.includes(c.area) ? 1 : 0, target: 1 }
    case 'plantedIn': {
      const n = state.entities.filter(
        (e) =>
          e.kind === 'plant' &&
          !e.fixed &&
          e.stage >= (c.minStage ?? 0) &&
          (!c.plants || c.plants.includes(e.defId)) &&
          inArea(c.area, e.x, e.y),
      ).length
      return { current: n, target: c.count }
    }
    case 'builtIn': {
      const n = state.entities.filter(
        (e) => !e.fixed && c.ids.includes(e.defId) && inArea(c.area, e.x, e.y),
      ).length
      return { current: n, target: c.count }
    }
    case 'visitedIn': {
      let n = 0
      for (const e of state.entities)
        if (e.kind === 'structure' && inArea(c.area, e.x, e.y)) n += e.visits
      return { current: n, target: c.count }
    }
    case 'clearedIn':
      return { current: s.clearedIn[c.area] ?? 0, target: c.count }
    case 'gathered':
      return { current: s.gathered[c.item] ?? 0, target: c.count }
    case 'branched':
      return { current: sum(s.branched), target: c.count }
    case 'seenAny':
      return { current: c.wildlife.reduce((n, w) => n + (s.seen[w] ?? 0), 0), target: c.count }
    case 'matured':
      return { current: s.matured[c.plant] ?? 0, target: c.count }
    case 'approachChosen': {
      const p = state.projects[c.project]
      return {
        current: p && (p.approach !== null || p.approachesDone.length > 0) ? 1 : 0,
        target: 1,
      }
    }
    case 'stagesDone':
      return { current: state.projects[c.project]?.stagesDone.length ?? 0, target: c.count }
  }
}

export function conditionMet(state: GameState, content: Content, c: Condition): boolean {
  const { current, target } = conditionProgress(state, content, c)
  return current >= target
}

export function isChapterComplete(state: GameState, chapter: ChapterDef): boolean {
  return state.unlocks.includes(chapter.completionUnlock)
}

export function isChapterStarted(state: GameState, chapter: ChapterDef): boolean {
  return chapter.requires === undefined || state.unlocks.includes(chapter.requires)
}

/** The chapter being played: the first started one not yet complete, else the last completed. */
export function currentChapter(state: GameState, content: Content): ChapterDef {
  const active = content.chapters.find(
    (ch) => isChapterStarted(state, ch) && !isChapterComplete(state, ch),
  )
  if (active) return active
  const done = content.chapters.filter((ch) => isChapterComplete(state, ch))
  return done.at(-1) ?? content.chapters[0]!
}

/** The next milestone to work towards, or undefined when every started chapter is done. */
export function currentMilestone(state: GameState, content: Content): MilestoneDef | undefined {
  const chapter = currentChapter(state, content)
  if (isChapterComplete(state, chapter)) return undefined
  return chapter.milestones.find((m) => state.milestones[m.id] === undefined)
}

/** Whether the current chapter (or the given one) is complete. */
export function chapterComplete(
  state: GameState,
  content: Content,
  chapter = currentChapter(state, content),
): boolean {
  return isChapterComplete(state, chapter)
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
  for (const chapter of content.chapters) {
    if (!isChapterStarted(state, chapter)) continue
    const giftKey = `gift:${chapter.id}`
    if (chapter.gift && !state.unlocks.includes(giftKey)) {
      state.unlocks.push(giftKey)
      addItems(state, chapter.gift)
      events.push({ type: 'gift', chapterId: chapter.id, items: { ...chapter.gift } })
    }
    // Optional milestones can be reached at any time once their chapter has started.
    for (const m of chapter.optional ?? []) {
      if (state.milestones[m.id] !== undefined) continue
      if (!m.conditions.every((c) => conditionMet(state, content, c))) continue
      state.milestones[m.id] = state.elapsedMs
      events.push({ type: 'milestone', milestoneId: m.id, title: m.title })
      for (const key of m.unlocks) unlock(state, key, events)
    }
    if (isChapterComplete(state, chapter)) continue
    for (const m of chapter.milestones) {
      if (state.milestones[m.id] !== undefined) continue
      if (!m.conditions.every((c) => conditionMet(state, content, c))) break
      state.milestones[m.id] = state.elapsedMs
      events.push({ type: 'milestone', milestoneId: m.id, title: m.title })
      for (const key of m.unlocks) unlock(state, key, events)
    }
    if (chapter.milestones.every((m) => state.milestones[m.id] !== undefined)) {
      unlock(state, chapter.completionUnlock, events)
      events.push({ type: 'chapterComplete', chapterId: chapter.id })
    }
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
