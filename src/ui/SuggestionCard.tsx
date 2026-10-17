import { suggestions } from '../core/suggestions'
import { useGame, useUi } from './hooks'

/** A small, collapsible card with the most relevant optional suggestion; the rest are in Goals. */
export function SuggestionCard() {
  const controller = useGame()
  const { suggestionsOpen } = useUi()
  const list = suggestions(controller.state, controller.content)
  if (list.length === 0) return null
  if (!suggestionsOpen) {
    return (
      <button
        type="button"
        className="pill suggestion-toggle"
        onClick={() => controller.toggleSuggestions()}
      >
        Ideas ({list.length})
      </button>
    )
  }
  return (
    <aside className="suggestion-card" aria-label="Suggestions" data-testid="suggestions">
      <p className="suggestion-card__text">{list[0]!.text}</p>
      <div className="suggestion-card__actions">
        <button type="button" className="link-button" onClick={() => controller.openPanel('goals')}>
          {list.length > 1
            ? `Goals and ${list.length - 1} more ${list.length === 2 ? 'idea' : 'ideas'}`
            : 'Chapter goals'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => controller.toggleSuggestions()}
        >
          Hide
        </button>
      </div>
    </aside>
  )
}
