import { chapterComplete, conditionProgress, currentChapter } from '../core/progression'
import { suggestions } from '../core/suggestions'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

export function GoalsPanel() {
  const controller = useGame()
  const { content, state } = controller
  const chapter = currentChapter(state, content)
  const done = chapter.milestones.filter((m) => state.milestones[m.id] !== undefined).length
  const current = chapter.milestones.find((m) => state.milestones[m.id] === undefined)
  const ideas = suggestions(state, content).filter((s) => !s.id.startsWith('milestone:'))
  return (
    <Sheet title={chapter.title} onClose={() => controller.closePanel()} testId="goals-panel">
      <p className="muted">
        {chapterComplete(state, content)
          ? 'Chapter complete.'
          : `Restoration: ${done} of ${chapter.milestones.length} milestones`}
      </p>
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
                    <span className="milestone__hint">{m.hint}</span>
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
          <h3 className="inventory-group__title">Other ideas</h3>
          <ul className="facts">
            {ideas.map((s) => (
              <li key={s.id}>{s.text}</li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}
