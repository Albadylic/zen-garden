import { harvestStatus } from '../core/plants'
import type { PlantEntity } from '../core/state'
import { formatDuration, formatItems } from './format'
import { useGame } from './hooks'

/** Harvest button and status for plants that can be harvested by hand. */
export function HarvestAction({ plant }: { plant: PlantEntity }) {
  const controller = useGame()
  const { content } = controller
  const h = content.plants[plant.defId]?.harvest
  const status = harvestStatus(content, plant)
  if (!h || status.kind === 'none') return null
  return (
    <div className="upgrade" data-testid="harvest">
      <strong>Harvest {formatItems(content, { [h.item]: h.amount })}</strong>
      {status.kind === 'growing' && <span className="muted">Ready once fully grown.</span>}
      {status.kind === 'recovering' && (
        <span className="muted">Recovering: ready again in {formatDuration(status.ms)}.</span>
      )}
      <button
        type="button"
        className="button button--primary"
        disabled={status.kind !== 'ready'}
        onClick={() => controller.harvestSelected()}
      >
        Harvest
      </button>
    </div>
  )
}
