// Restoration projects: each has several approaches, each a short run of
// stages. Every approach is under way as soon as its project opens, so the
// player can work on them side by side (one while plants grow for another).
// Completing a stage can bring a reward: materials, or something rare.

import type { ApproachDef, Content, ProjectDef, ProjectStageDef } from './content'
import type { GameEvent } from './events'
import { addItems, hasItems, removeItems } from './inventory'
import type { ActionResult } from './layout'
import { conditionMet } from './progression'
import type { StepContext } from './simulation'
import type { GameState, ProjectProgress } from './state'

export function progressOf(state: GameState, projectId: string): ProjectProgress {
  return state.projects[projectId] ?? { active: [], stagesDone: [], approachesDone: [] }
}

/** Projects the player can work on now. */
export function availableProjects(state: GameState, content: Content): ProjectDef[] {
  return Object.values(content.projects).filter((p) => state.unlocks.includes(p.requires))
}

export function isProjectComplete(state: GameState, project: ProjectDef): boolean {
  return progressOf(state, project.id).approachesDone.length === project.approaches.length
}

/** Approaches not begun yet. */
export function choosableApproaches(state: GameState, project: ProjectDef): ApproachDef[] {
  const progress = progressOf(state, project.id)
  return project.approaches.filter(
    (a) => !progress.active.includes(a.id) && !progress.approachesDone.includes(a.id),
  )
}

/** Approaches under way, in the order they were begun. */
export function activeApproaches(state: GameState, project: ProjectDef): ApproachDef[] {
  return progressOf(state, project.id)
    .active.map((id) => project.approaches.find((a) => a.id === id))
    .filter((a): a is ApproachDef => a !== undefined)
}

export function isApproachDone(state: GameState, project: ProjectDef, approach: ApproachDef) {
  return progressOf(state, project.id).approachesDone.includes(approach.id)
}

/** The next stage of an approach under way, if any. */
export function nextStage(
  state: GameState,
  project: ProjectDef,
  approach: ApproachDef,
): ProjectStageDef | undefined {
  if (!progressOf(state, project.id).active.includes(approach.id)) return undefined
  const done = progressOf(state, project.id).stagesDone
  return approach.stages.find((s) => !done.includes(s.id))
}

export type StageStatus = { kind: 'waiting' } | { kind: 'needsItems' } | { kind: 'ready' }

export function stageStatus(
  state: GameState,
  content: Content,
  stage: ProjectStageDef,
): StageStatus {
  if (!stage.conditions.every((c) => conditionMet(state, content, c))) return { kind: 'waiting' }
  return hasItems(state, stage.cost) ? { kind: 'ready' } : { kind: 'needsItems' }
}

function grant(state: GameState, keys: string[], events: GameEvent[]): void {
  for (const key of keys) {
    if (state.unlocks.includes(key)) continue
    state.unlocks.push(key)
    events.push({ type: 'unlocked', key })
  }
}

export function chooseApproach(
  state: GameState,
  content: Content,
  projectId: string,
  approachId: string,
): ActionResult {
  const project = content.projects[projectId]
  if (!project || !state.unlocks.includes(project.requires))
    return { ok: false, reason: 'Not available yet' }
  const approach = choosableApproaches(state, project).find((a) => a.id === approachId)
  if (!approach) return { ok: false, reason: 'Already begun' }
  return { ok: true, events: beginApproach(state, project, approach) }
}

export function completeStage(
  state: GameState,
  content: Content,
  projectId: string,
  approachId: string,
): ActionResult {
  const project = content.projects[projectId]
  if (!project) return { ok: false, reason: 'Unknown project' }
  const approach = project.approaches.find((a) => a.id === approachId)
  const stage = approach && nextStage(state, project, approach)
  if (!stage || !approach) return { ok: false, reason: 'Begin this first' }
  const status = stageStatus(state, content, stage)
  if (status.kind === 'waiting') return { ok: false, reason: 'Not quite there yet' }
  if (status.kind === 'needsItems') return { ok: false, reason: 'Not enough materials' }
  removeItems(state, stage.cost)
  const reward = stage.reward ?? {}
  addItems(state, reward)
  for (const [id, n] of Object.entries(reward))
    state.stats.gathered[id] = (state.stats.gathered[id] ?? 0) + n
  const progress = progressOf(state, projectId)
  progress.stagesDone = [...progress.stagesDone, stage.id]
  const events: GameEvent[] = [
    { type: 'stageComplete', projectId, stageId: stage.id, title: stage.title, reward },
  ]
  grant(state, stage.unlocks, events)
  if (approach.stages.every((s) => progress.stagesDone.includes(s.id))) {
    progress.approachesDone = [...progress.approachesDone, approach.id]
    progress.active = progress.active.filter((id) => id !== approach.id)
    events.push({
      type: 'approachComplete',
      projectId,
      approachId: approach.id,
      title: approach.title,
    })
  }
  state.projects[projectId] = progress
  return { ok: true, events }
}

/** Stages that can be completed right now, across every project and approach under way. */
export function readyStages(state: GameState, content: Content) {
  const out: { project: ProjectDef; approach: ApproachDef; stage: ProjectStageDef }[] = []
  for (const project of availableProjects(state, content)) {
    for (const approach of activeApproaches(state, project)) {
      const stage = nextStage(state, project, approach)
      if (stage && stageStatus(state, content, stage).kind === 'ready')
        out.push({ project, approach, stage })
    }
  }
  return out
}

/**
 * System: every approach of a project that has opened is under way, with the
 * discoveries it brings. (Approaches used to wait for the player to begin
 * them; older saves catch up here.)
 */
export function openProjects(state: GameState, content: Content, _dtMs: number, ctx: StepContext) {
  for (const project of availableProjects(state, content)) {
    for (const approach of choosableApproaches(state, project))
      ctx.events.push(...beginApproach(state, project, approach))
  }
}

function beginApproach(state: GameState, project: ProjectDef, approach: ApproachDef): GameEvent[] {
  const progress = progressOf(state, project.id)
  state.projects[project.id] = { ...progress, active: [...progress.active, approach.id] }
  const events: GameEvent[] = [
    { type: 'approachChosen', projectId: project.id, approachId: approach.id },
  ]
  grant(state, approach.unlocks, events)
  return events
}
