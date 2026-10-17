import { plantSuitability } from '../core/environment'
import { entityById, terrainAt } from '../core/grid'
import { isFinalStage, timeToNextStage } from '../core/plants'
import type { PlantEntity } from '../core/state'
import { describePreferences, formatDuration, RATING_LABELS } from './format'
import { useGame, useUi } from './hooks'
import { Sheet } from './Sheet'

const TERRAIN_LABELS: Record<string, string> = {
  grass: 'Grass',
  moss: 'Moss',
  path: 'Old stone path',
  water: 'Pond',
  margin: 'Pond margin',
  overgrown: 'Overgrowth',
}

function PlantDetails({ plant }: { plant: PlantEntity }) {
  const controller = useGame()
  const { content, state } = controller
  const def = content.plants[plant.defId]
  if (!def) return null
  const final = isFinalStage(def, plant.stage)
  const duration = (def.stages[plant.stage]?.durationSec ?? 0) * 1000
  const remaining = timeToNextStage(state, content, plant)
  const suit = plantSuitability(state, content, plant.defId, plant.x, plant.y, plant.id)
  return (
    <>
      <p>{def.description}</p>
      {!plant.fixed && (
        <>
          <div className="stat-row">
            <span>
              {def.stages[plant.stage]?.name}
              <span className="muted">
                {' '}
                · stage {plant.stage + 1} of {def.stages.length}
              </span>
            </span>
            {remaining !== null && (
              <span className="muted">next in {formatDuration(remaining)}</span>
            )}
          </div>
          {!final && (
            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((plant.progressMs / duration) * 100)}
            >
              <div
                className="progress__fill"
                style={{ width: `${Math.min(100, (plant.progressMs / duration) * 100)}%` }}
              />
            </div>
          )}
          <p className={`rating--${suit.rating}`}>
            {RATING_LABELS[suit.rating]} spot
            {suit.reasons.length > 0 && ` · ${suit.reasons.join(' · ')}`}
          </p>
          <p className="muted">{describePreferences(def)}.</p>
          {plant.wateredMs > 0 && <p className="muted">Watered: growing faster for a while.</p>}
        </>
      )}
    </>
  )
}

export function InspectPanel() {
  const controller = useGame()
  const { selection } = useUi()
  const { content, state } = controller
  if (!selection) return null
  const close = () => controller.select(null)

  if (selection.kind === 'tile') {
    const terrain = terrainAt(state, selection.x, selection.y) ?? 'grass'
    return (
      <Sheet title={TERRAIN_LABELS[terrain] ?? terrain} onClose={close} testId="inspect-panel">
        <p className="muted">An open patch of the garden.</p>
      </Sheet>
    )
  }

  if (selection.kind === 'entity') {
    const entity = entityById(state, selection.id)
    if (!entity) return null
    const def =
      entity.kind === 'plant'
        ? content.plants[entity.defId]
        : entity.kind === 'structure'
          ? content.structures[entity.defId]
          : content.decorations[entity.defId]
    const plantDef = entity.kind === 'plant' ? content.plants[entity.defId] : undefined
    const canWater =
      entity.kind === 'plant' &&
      plantDef &&
      !entity.fixed &&
      !isFinalStage(plantDef, entity.stage) &&
      entity.wateredMs <= 0
    return (
      <Sheet title={def?.name ?? entity.defId} onClose={close} testId="inspect-panel">
        {entity.kind === 'plant' ? <PlantDetails plant={entity} /> : <p>{def?.description}</p>}
        {!entity.fixed && (
          <div className="actions">
            {canWater && (
              <button type="button" className="button" onClick={() => controller.waterSelected()}>
                Water
              </button>
            )}
            <button type="button" className="button" onClick={() => controller.moveSelected()}>
              Move
            </button>
            <button type="button" className="button" onClick={() => controller.removeSelected()}>
              Remove
            </button>
          </div>
        )}
      </Sheet>
    )
  }

  return null
}
