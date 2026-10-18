import { RATING_LABELS } from './format'
import { useGame } from './hooks'
import { Cost } from './Cost'

export function PlacementBar() {
  const controller = useGame()
  const info = controller.placementInfo()
  if (!info) return null
  const { check, suitability, tile } = info
  let status: string
  if (!tile) status = 'Tap a tile to choose a spot.'
  else if (check && !check.ok) status = check.reason
  else if (suitability) {
    status = `${RATING_LABELS[suitability.rating]} spot`
    if (suitability.reasons.length > 0) status += ` · ${suitability.reasons.join(' · ')}`
  } else status = 'A good spot.'
  const canPlace = !!tile && !!check?.ok
  return (
    <div className="placement-bar" data-testid="placement-bar">
      <div className="placement-bar__text">
        <strong>{info.name}</strong>
        {Object.keys(info.cost).length > 0 && (
          <span className="placement-bar__cost">
            <Cost items={info.cost} compact />
          </span>
        )}
        <div
          className={`placement-bar__status${suitability ? ` rating--${suitability.rating}` : ''}`}
          data-testid="placement-status"
        >
          {status}
        </div>
      </div>
      <div className="placement-bar__actions">
        <button type="button" className="button" onClick={() => controller.cancelMode()}>
          Cancel
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={!canPlace}
          onClick={() => controller.confirmPlacement()}
        >
          Place here
        </button>
      </div>
    </div>
  )
}
