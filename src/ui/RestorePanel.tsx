import { useRef, useState } from 'react'
import type { ApproachDef, ProjectDef } from '../core/content'
import { gardenById, openOvergrowth } from '../core/gardens'
import { chapterComplete, conditionProgress, currentChapter } from '../core/progression'
import {
  availableProjects,
  isApproachDone,
  nextStage,
  progressOf,
  readyStages,
  stageStatus,
} from '../core/projects'
import { currentSeason } from '../core/seasons'
import { suggestions } from '../core/suggestions'
import { Cost } from './Cost'
import { GardenEmblem } from './GardenEmblem'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

/** Horizontal distance, in pixels, that turns a page. */
const SWIPE_PX = 48

/** A page of Restore: the chapter's goals, or one approach to a restoration project. */
type Page = { kind: 'chapter' } | { kind: 'approach'; project: ProjectDef; approach: ApproachDef }

function pageKey(page: Page): string {
  return page.kind === 'chapter' ? 'chapter' : `${page.project.id}:${page.approach.id}`
}

/** The chapter's milestones, things along the way, ideas and finished restorations. */
function ChapterPage() {
  const controller = useGame()
  const { content, state } = controller
  const chapter = currentChapter(state, content)
  const garden = gardenById(content, chapter.id)
  const season = currentSeason(state)
  const done = chapter.milestones.filter((m) => state.milestones[m.id] !== undefined).length
  const current = chapter.milestones.find((m) => state.milestones[m.id] === undefined)
  const ideas = suggestions(state, content).filter((s) => !s.id.startsWith('milestone:'))
  const finished = availableProjects(state, content).flatMap((p) =>
    p.approaches.filter((a) => isApproachDone(state, p, a)).map((a) => ({ p, a })),
  )
  return (
    <section className="restore-page" data-testid="chapter-page">
      <header className="restore-page__header">
        {garden && <GardenEmblem emblem={garden.emblem} />}
        <span className="restore-page__heading">
          <h1 className="restore-page__title">{chapter.title}</h1>
          <span className="muted">
            {chapterComplete(state, content)
              ? 'Chapter complete'
              : `${done} of ${chapter.milestones.length} milestones`}
            {season && ` · ${season[0]!.toUpperCase() + season.slice(1)}`}
          </span>
        </span>
      </header>
      <ol className="milestones">
        {chapter.milestones.map((m) => {
          const complete = state.milestones[m.id] !== undefined
          const isCurrent = m === current
          return (
            <li
              key={m.id}
              className={`milestone${complete ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
            >
              <span className="milestone__mark" aria-hidden="true">
                {complete ? '✓' : isCurrent ? '•' : ''}
              </span>
              <span className="milestone__text">
                <span className="milestone__title">
                  {complete || isCurrent ? m.title : 'Still to discover'}
                  <span className="visually-hidden">{complete ? ' (done)' : ''}</span>
                </span>
                {isCurrent && (
                  <>
                    <span className="milestone__hint" data-testid="current-hint">
                      {m.hint}
                    </span>
                    {m.conditions.map((c, i) => {
                      const { current: n, target } = conditionProgress(state, content, c)
                      return target > 1 ? (
                        <span key={i} className="milestone__progress">
                          {Math.min(n, target)} of {target}
                        </span>
                      ) : null
                    })}
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      {(chapter.optional ?? []).length > 0 && (
        <>
          <h3 className="inventory-group__title">Along the way</h3>
          <ul className="milestones">
            {(chapter.optional ?? []).map((m) => {
              const complete = state.milestones[m.id] !== undefined
              return (
                <li key={m.id} className={`milestone${complete ? ' is-done' : ''}`}>
                  <span className="milestone__mark" aria-hidden="true">
                    {complete ? '✓' : ''}
                  </span>
                  <span className="milestone__text">
                    <span className="milestone__title">{m.title}</span>
                    <span className="milestone__hint">{complete ? m.description : m.hint}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {ideas.length > 0 && (
        <>
          <h3 className="inventory-group__title">Ideas</h3>
          <ul className="facts" data-testid="ideas">
            {ideas.map((s) => (
              <li key={s.id}>{s.text}</li>
            ))}
          </ul>
        </>
      )}
      {finished.length > 0 && (
        <>
          <h3 className="inventory-group__title">Restored so far</h3>
          <ul className="facts">
            {finished.map(({ p, a }) => (
              <li key={`${p.id}:${a.id}`}>✓ {a.title}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * What a stage gives: materials, or something rare to plant or place, marked
 * with a star.
 */
function Reward({ items, done }: { items: Record<string, number>; done: boolean }) {
  const { content } = useGame()
  return (
    <span className={`reward${done ? ' is-done' : ''}`} data-testid="reward">
      {done ? 'Received: ' : 'Reward: '}
      {Object.entries(items).map(([id, n], i) => {
        const item = content.items[id]
        const plant = Object.values(content.plants).find((p) => p.seedItem === id)
        const rare =
          item?.category === 'keepsake' || (plant !== undefined && plant.produces.length === 0)
        const note =
          item?.category === 'keepsake'
            ? ' (a keepsake to place)'
            : rare
              ? ` (rare: ${plant!.name})`
              : ''
        return (
          <span key={id} className={rare ? 'reward__rare' : undefined}>
            {i > 0 && ', '}
            {rare && '✦ '}
            {item?.name ?? id} ×{n}
            {note}
          </span>
        )
      })}
    </span>
  )
}

/** One approach to a project, under way from the start: complete its stages one by one. */
function ApproachPage({ project, approach }: { project: ProjectDef; approach: ApproachDef }) {
  const controller = useGame()
  const { content, state } = controller
  const garden = gardenById(content, project.garden)
  const doneStages = progressOf(state, project.id).stagesDone
  const stage = nextStage(state, project, approach)
  const status = stage && stageStatus(state, content, stage)
  return (
    <section className="restore-page" data-testid={`approach-${approach.id}`}>
      <header className="restore-page__header">
        {garden && <GardenEmblem emblem={garden.emblem} />}
        <span className="restore-page__heading">
          <span className="muted" data-testid="project-garden">
            {garden?.name} · {project.title}
          </span>
          <h3 className="restore-page__title">{approach.title}</h3>
        </span>
      </header>
      <p className="muted">{approach.description}</p>
      <ol className="stage-list">
        {approach.stages.map((s) => {
          const complete = doneStages.includes(s.id)
          const isNext = s === stage
          return (
            <li
              key={s.id}
              className={`stage${complete ? ' is-done' : ''}${isNext ? ' is-current' : ''}`}
            >
              <span className="milestone__mark" aria-hidden="true">
                {complete ? '✓' : isNext ? '•' : ''}
              </span>
              <span className="stage__text">
                <strong>{s.title}</strong>
                {isNext && <span>{s.description}</span>}
                {s.reward && <Reward items={s.reward} done={complete} />}
              </span>
            </li>
          )
        })}
      </ol>
      {stage && (
        <div className="upgrade" data-testid="current-stage">
          <strong>{stage.title}</strong>
          {stage.conditions.map((c, i) => {
            const { current, target } = conditionProgress(state, content, c)
            return target > 1 ? (
              <span key={i} className="milestone__progress">
                {Math.min(current, target)} of {target}
              </span>
            ) : null
          })}
          <Cost items={stage.cost} />
          <button
            type="button"
            className="button button--primary"
            disabled={status?.kind !== 'ready'}
            onClick={() => controller.completeStage(project.id, approach.id)}
          >
            {status?.kind === 'ready' ? 'Complete stage' : 'Not ready yet'}
          </button>
        </div>
      )}
    </section>
  )
}

/**
 * Restore: clearing overgrowth while any is left, then pages to flick
 * through: the chapter's goals first, then every approach to every
 * restoration project not yet finished. Several approaches can be under way
 * at once, so the player can work on one while plants grow for another.
 */
export function RestorePanel() {
  const controller = useGame()
  const { content, state } = controller
  const overgrown = openOvergrowth(state, content)
  const chapter = currentChapter(state, content)
  // The current chapter's garden first, then the rest in order.
  const projects = [...availableProjects(state, content)].sort(
    (a, b) => Number(b.garden === chapter.id) - Number(a.garden === chapter.id),
  )
  const pages: Page[] = [
    { kind: 'chapter' },
    ...projects.flatMap((project) =>
      project.approaches
        .filter((approach) => !isApproachDone(state, project, approach))
        .map((approach): Page => ({ kind: 'approach', project, approach })),
    ),
  ]
  // Open where there is something to do: a stage ready to complete, else an
  // approach under way, else the chapter's goals.
  const [at, setAt] = useState(() => {
    const ready = readyStages(state, content)[0]
    if (ready) return `${ready.project.id}:${ready.approach.id}`
    const active = pages.find(
      (p) =>
        p.kind === 'approach' && progressOf(state, p.project.id).active.includes(p.approach.id),
    )
    return active ? pageKey(active) : 'chapter'
  })
  const index = Math.max(
    0,
    pages.findIndex((p) => pageKey(p) === at),
  )
  const page = pages[index]!
  const turn = (by: number) =>
    setAt(pageKey(pages[Math.min(pages.length - 1, Math.max(0, index + by))]!))
  const swipeFrom = useRef<number | null>(null)
  const readyKeys = new Set(
    readyStages(state, content).map((r) => `${r.project.id}:${r.approach.id}`),
  )
  return (
    <Sheet title="Restore" onClose={() => controller.closePanel()} testId="restore-panel">
      {overgrown > 0 && (
        <div className="clear-row" data-testid="clear-overgrowth">
          <span className="clear-row__text">
            <strong>Clear overgrowth</strong>
            <span className="muted">
              {overgrown} {overgrown === 1 ? 'tangle' : 'tangles'} left · tap one after another
            </span>
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
      <div className="project-pages__nav">
        <button
          type="button"
          className="icon-button"
          aria-label="Previous page"
          disabled={index === 0}
          onClick={() => turn(-1)}
        >
          ‹
        </button>
        <span className="project-pages__dots" role="tablist" aria-label="Restoration pages">
          {pages.map((p, i) => (
            <button
              type="button"
              key={pageKey(p)}
              role="tab"
              aria-selected={i === index}
              aria-label={p.kind === 'chapter' ? 'Chapter goals' : p.approach.title}
              className={`dot-button${i === index ? ' is-active' : ''}${readyKeys.has(pageKey(p)) ? ' is-ready' : ''}`}
              onClick={() => setAt(pageKey(p))}
            />
          ))}
        </span>
        <span className="muted" data-testid="project-page">
          {index + 1} of {pages.length}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Next page"
          disabled={index === pages.length - 1}
          onClick={() => turn(1)}
        >
          ›
        </button>
      </div>
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
        {page.kind === 'chapter' ? (
          <ChapterPage />
        ) : (
          <ApproachPage key={pageKey(page)} project={page.project} approach={page.approach} />
        )}
      </div>
    </Sheet>
  )
}
