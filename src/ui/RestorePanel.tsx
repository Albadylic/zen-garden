import { useRef, useState } from 'react'
import { openOvergrowth } from '../core/gardens'
import type { ProjectDef } from '../core/content'
import { conditionProgress, currentChapter } from '../core/progression'
import {
  availableProjects,
  choosableApproaches,
  currentApproach,
  currentStage,
  isProjectComplete,
  progressOf,
  stageStatus,
} from '../core/projects'
import { formatItems } from './format'
import { GardenEmblem } from './GardenEmblem'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

function Project({ project }: { project: ProjectDef }) {
  const controller = useGame()
  const { content, state } = controller
  const progress = progressOf(state, project.id)
  const approach = currentApproach(state, project)
  const stage = currentStage(state, project)
  const choices = choosableApproaches(state, project)
  const finished = project.approaches.filter((a) => progress.approachesDone.includes(a.id))
  return (
    <section className="project" data-testid={`project-${project.id}`}>
      <h3 className="project__title">{project.title}</h3>
      <p className="muted">{project.description}</p>
      {finished.length > 0 && (
        <ul className="facts">
          {finished.map((a) => (
            <li key={a.id}>✓ {a.title}</li>
          ))}
        </ul>
      )}
      {isProjectComplete(state, project) && <p className="activity">Every approach is complete.</p>}
      {choices.length > 0 && (
        <>
          <p className="activity">
            {finished.length === 0 ? 'Choose where to begin.' : 'Choose what to do next.'}
          </p>
          {choices.map((a) => (
            <div className="upgrade" key={a.id} data-testid={`approach-${a.id}`}>
              <strong>{a.title}</strong>
              <span className="muted">{a.description}</span>
              <ol className="stage-list">
                {a.stages.map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ol>
              <button
                type="button"
                className="button button--primary"
                onClick={() => controller.chooseApproach(project.id, a.id)}
              >
                Begin this
              </button>
            </div>
          ))}
        </>
      )}
      {approach && stage && (
        <div className="upgrade" data-testid="current-stage">
          <span className="muted">{approach.title}</span>
          <strong>
            Stage {approach.stages.indexOf(stage) + 1} of {approach.stages.length}: {stage.title}
          </strong>
          <span>{stage.description}</span>
          {stage.conditions.map((c, i) => {
            const { current, target } = conditionProgress(state, content, c)
            return target > 1 ? (
              <span key={i} className="milestone__progress">
                {Math.min(current, target)} of {target}
              </span>
            ) : null
          })}
          {Object.keys(stage.cost).length > 0 && (
            <span
              className={
                stageStatus(state, content, stage).kind === 'needsItems'
                  ? 'choice__cost choice__cost--short'
                  : 'choice__cost'
              }
            >
              Uses {formatItems(content, stage.cost)}
            </span>
          )}
          <button
            type="button"
            className="button button--primary"
            disabled={stageStatus(state, content, stage).kind !== 'ready'}
            onClick={() => controller.completeStage(project.id)}
          >
            Complete stage
          </button>
        </div>
      )}
    </section>
  )
}

/** Horizontal distance, in pixels, that turns a page. */
const SWIPE_PX = 48

/**
 * Restoration projects, one page each, with the emblem of the garden each
 * belongs to. Clearing overgrowth sits above them while there is any left.
 */
export function RestorePanel() {
  const controller = useGame()
  const { content, state } = controller
  const overgrown = openOvergrowth(state, content)
  const projects = availableProjects(state, content)
  // Open at the project for the current chapter's garden, else the first one unfinished.
  const [page, setPage] = useState(() => {
    const chapter = currentChapter(state, content)
    const here = projects.findIndex((p) => p.garden === chapter.id && !isProjectComplete(state, p))
    const open = projects.findIndex((p) => !isProjectComplete(state, p))
    return Math.max(0, here >= 0 ? here : open)
  })
  const index = Math.min(page, Math.max(0, projects.length - 1))
  const project = projects[index]
  const garden = project && content.world.gardens.find((g) => g.id === project.garden)
  const turn = (by: number) => setPage(Math.min(projects.length - 1, Math.max(0, index + by)))
  const swipeFrom = useRef<number | null>(null)
  return (
    <Sheet title="Restore" onClose={() => controller.closePanel()} testId="restore-panel">
      {overgrown > 0 && (
        <div className="upgrade" data-testid="clear-overgrowth">
          <strong>Clear overgrowth</strong>
          <span className="muted">
            {`${overgrown} overgrown ${overgrown === 1 ? 'patch' : 'patches'} left. Start clearing, then tap as many tangles as you like; each turns up twigs, leaf litter and more.`}
          </span>
          <button
            type="button"
            className="button button--primary"
            onClick={() => controller.startClearing()}
          >
            Start clearing
          </button>
        </div>
      )}
      {project && (
        <div
          className="project-pages"
          onPointerDown={(e) => (swipeFrom.current = e.clientX)}
          onPointerUp={(e) => {
            if (swipeFrom.current === null) return
            const dx = e.clientX - swipeFrom.current
            swipeFrom.current = null
            if (Math.abs(dx) >= SWIPE_PX) turn(dx < 0 ? 1 : -1)
          }}
          onPointerCancel={() => (swipeFrom.current = null)}
        >
          <div className="project-pages__nav">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous project"
              disabled={index === 0}
              onClick={() => turn(-1)}
            >
              ‹
            </button>
            <span className="project-pages__garden" data-testid="project-garden">
              {garden && <GardenEmblem emblem={garden.emblem} />}
              <span>
                <span className="project-pages__garden-name">{garden?.name}</span>
                <span className="muted" data-testid="project-page">
                  Project {index + 1} of {projects.length}
                </span>
              </span>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next project"
              disabled={index === projects.length - 1}
              onClick={() => turn(1)}
            >
              ›
            </button>
          </div>
          <Project key={project.id} project={project} />
        </div>
      )}
      {!project && overgrown === 0 && (
        <p className="muted">Nothing to restore here yet. Keep tending the garden.</p>
      )}
    </Sheet>
  )
}
