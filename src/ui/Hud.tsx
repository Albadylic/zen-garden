import { openGardens } from '../core/gardens'
import { currentChapter } from '../core/progression'
import { useGame, useUi } from './hooks'
import { SuggestionCard } from './SuggestionCard'

export function Hud() {
  const controller = useGame()
  const { canUndo, mode, panel, selection } = useUi()
  const lying = controller.state.drops.length
  const idle = mode.type === 'idle'
  return (
    <header className="hud-top">
      <div className="hud-top__left">
        <h1 className="hud-title">
          <button
            type="button"
            className="hud-title__button"
            onClick={() => controller.openPanel('goals')}
            aria-label={`${currentChapter(controller.state, controller.content).title}: chapter goals`}
          >
            {currentChapter(controller.state, controller.content).title}
          </button>
        </h1>
        {idle && !panel && !selection && <SuggestionCard />}
      </div>
      <div className="hud-top__actions">
        {lying > 0 && idle && (
          <button type="button" className="pill" onClick={() => controller.collectAll()}>
            Gather all ({lying})
          </button>
        )}
        {canUndo && idle && (
          <button type="button" className="pill" onClick={() => controller.undoLast()}>
            Undo
          </button>
        )}
        {openGardens(controller.state, controller.content).length > 1 && (
          <button
            type="button"
            className="pill pill--icon"
            aria-label="Gardens"
            onClick={() => controller.openPanel('gardens')}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
              <path d="M9 4v14M15 6v14" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="pill pill--icon"
          aria-label="Settings"
          onClick={() => controller.openPanel('settings')}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="2.5" fill="var(--paper)" />
            <circle cx="15" cy="17" r="2.5" fill="var(--paper)" />
          </svg>
        </button>
      </div>
    </header>
  )
}
