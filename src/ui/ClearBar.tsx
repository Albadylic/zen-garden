import { openOvergrowth } from '../core/areas'
import { useGame } from './hooks'

export function ClearBar() {
  const controller = useGame()
  const left = openOvergrowth(controller.state, controller.content)
  return (
    <div className="placement-bar" data-testid="clear-bar">
      <div className="placement-bar__text">
        <strong>Restore</strong>
        <div className="placement-bar__status">
          {left > 0
            ? `Tap overgrown tiles to clear them. ${left} left to clear.`
            : 'All the overgrowth has been cleared.'}
        </div>
      </div>
      <div className="placement-bar__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={() => controller.cancelMode()}
        >
          Done
        </button>
      </div>
    </div>
  )
}
