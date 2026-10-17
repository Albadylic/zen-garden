// Restoration projects: the player picks an approach, then completes its
// stages. Finishing one approach opens the choice again, so nothing is
// ever locked out; the order only changes what is discovered first.

import type { ApproachDef, Content, ProjectDef, ProjectStageDef } from './content'
import type { GameEvent } from './events'
import { hasItems, removeItems } from './inventory'
import type { ActionResult } from './layout'
import { conditionMet } from './progression'
import type { GameState, ProjectProgress } from './state'

export function progressOf(state: GameState, projectId: string): ProjectProgress {
  return state.projects[projectId] ?? { approach: null, stagesDone: [], approachesDone: [] }
}

/** Projects the player can work on now. */
export function availableProjects(state: GameState, content: Content): ProjectDef[] {
  return Object.values(content.projects).filter((p) => state.unlocks.includes(p.requires))
}

export function isProjectComplete(state: GameState, project: ProjectDef): boolean {
  return progressOf(state, project.id).approachesDone.length === project.approaches.length
}

/** Approaches that can be chosen now (none while one is under way). */
export function choosableApproaches(state: GameState, project: ProjectDef): ApproachDef[] {
  const progress = progressOf(state, project.id)
  if (progress.approach !== null) return []
  return project.approaches.filter((a) => !progress.approachesDone.includes(a.id))
}

export function currentApproach(state: GameState, project: ProjectDef): ApproachDef | undefined {
  const id = progressOf(state, project.id).approach
  return project.approaches.find((a) => a.id === id)
}

/** The next stage of the current approach, if any. */
export function currentStage(state: GameState, project: ProjectDef): ProjectStageDef | undefined {
  const approach = currentApproach(state, project)
  const done = progressOf(state, project.id).stagesDone
  return approach?.stages.find((s) => !done.includes(s.id))
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
  if (!approach) return { ok: false, reason: 'Finish the current approach first' }
  const progress = progressOf(state, projectId)
  state.projects[projectId] = { ...progress, approach: approach.id }
  const events: GameEvent[] = [{ type: 'approachChosen', projectId, approachId }]
  grant(state, approach.unlocks, events)
  return { ok: true, events }
}

export function completeStage(state: GameState, content: Content, projectId: string): ActionResult {
  const project = content.projects[projectId]
  if (!project) return { ok: false, reason: 'Unknown project' }
  const stage = currentStage(state, project)
  const approach = currentApproach(state, project)
  if (!stage || !approach) return { ok: false, reason: 'Choose an approach first' }
  const status = stageStatus(state, content, stage)
  if (status.kind === 'waiting') return { ok: false, reason: 'Not quite there yet' }
  if (status.kind === 'needsItems') return { ok: false, reason: 'Not enough materials' }
  removeItems(state, stage.cost)
  const progress = progressOf(state, projectId)
  progress.stagesDone = [...progress.stagesDone, stage.id]
  const events: GameEvent[] = [
    { type: 'stageComplete', projectId, stageId: stage.id, title: stage.title },
  ]
  grant(state, stage.unlocks, events)
  if (approach.stages.every((s) => progress.stagesDone.includes(s.id))) {
    progress.approachesDone = [...progress.approachesDone, approach.id]
    progress.approach = null
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
