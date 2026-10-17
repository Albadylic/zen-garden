import { openOvergrowth } from '../core/gardens'
import type { ProjectDef } from '../core/content'
import { conditionProgress } from '../core/progression'
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

export function RestorePanel() {
  const controller = useGame()
  const { content, state } = controller
  const overgrown = openOvergrowth(state, content)
  const projects = availableProjects(state, content)
  return (
    <Sheet title="Restore" onClose={() => controller.closePanel()} testId="restore-panel">
      <div className="upgrade">
        <strong>Clear overgrowth</strong>
        <span className="muted">
          {overgrown > 0
            ? `${overgrown} overgrown ${overgrown === 1 ? 'patch' : 'patches'} left. Start clearing, then tap as many tangles as you like; each turns up twigs, leaf litter and more.`
            : 'All the reachable overgrowth has been cleared.'}
        </span>
        <button
          type="button"
          className="button button--primary"
          disabled={overgrown === 0}
          onClick={() => controller.startClearing()}
        >
          Start clearing
        </button>
      </div>
      {projects.map((p) => (
        <Project key={p.id} project={p} />
      ))}
    </Sheet>
  )
}
