import { useEffect, useState } from 'react'
import { gardenById } from '../core/gardens'
import { currentChapter } from '../core/progression'
import { currentSeason } from '../core/seasons'
import type { Suggestion } from '../core/suggestions'
import { GardenEmblem } from './GardenEmblem'
import { useGame } from './hooks'

/**
 * The goals box under the top bar: the chapter's garden and season, then the
 * current ideas one at a time, turned with the arrows. "All goals" opens the
 * chapter's full list; the cross closes the box until the Goals icon opens it.
 */
export function GoalsBox({ ideas }: { ideas: Suggestion[] }) {
  const controller = useGame()
  const { content, state } = controller
  const [page, setPage] = useState(0)
  const index = Math.min(page, Math.max(0, ideas.length - 1))
  const idea = ideas[index]
  const chapter = currentChapter(state, content)
  const garden = gardenById(content, chapter.id)
  const season = currentSeason(state)

  // What is on screen counts as seen, so it no longer raises the Goals badge.
  const shown = idea?.id
  useEffect(() => {
    if (shown) controller.markSuggestionsSeen([shown])
  }, [controller, shown])

  return (
    <aside className="goals-box" aria-label="Goals" data-testid="suggestions">
      <header className="goals-box__header">
        {garden && <GardenEmblem emblem={garden.emblem} size={28} />}
        <span className="goals-box__title">
          <h1 className="goals-box__chapter">{chapter.title}</h1>
          {season && (
            <span className="goals-box__season" data-testid="season">
              {season[0]!.toUpperCase() + season.slice(1)}
            </span>
          )}
        </span>
        <button
          type="button"
          className="icon-button goals-box__close"
          aria-label="Close goals"
          onClick={() => controller.toggleSuggestions()}
        >
          ×
        </button>
      </header>
      {idea ? (
        <p className="goals-box__text" data-testid="suggestion-text">
          {idea.text}
        </p>
      ) : (
        <p className="goals-box__text muted">Nothing pressing. Enjoy the garden.</p>
      )}
      <footer className="goals-box__footer">
        <button
          type="button"
          className="icon-button"
          aria-label="Previous idea"
          disabled={index === 0}
          onClick={() => setPage(index - 1)}
        >
          ‹
        </button>
        <span className="muted" data-testid="suggestion-page">
          {ideas.length > 0 ? `${index + 1} of ${ideas.length}` : ''}
        </span>
        <button type="button" className="link-button" onClick={() => controller.openPanel('goals')}>
          All goals
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Next idea"
          disabled={index >= ideas.length - 1}
          onClick={() => setPage(index + 1)}
        >
          ›
        </button>
      </footer>
    </aside>
  )
}
