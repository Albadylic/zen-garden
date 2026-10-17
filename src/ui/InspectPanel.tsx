import { plantSuitability } from '../core/environment'
import { entityById, terrainAt } from '../core/grid'
import { isFinalStage, timeToNextStage } from '../core/plants'
import { knownFacts } from '../core/journal'
import { describeActivity } from '../core/wildlife'
import type { PlantEntity } from '../core/state'
import { describePreferences, formatDuration, RATING_LABELS } from './format'
import { useGame, useUi } from './hooks'
import { ShelterDetails } from './ShelterDetails'
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
    const overgrown = terrain === 'overgrown'
    return (
      <Sheet title={TERRAIN_LABELS[terrain] ?? terrain} onClose={close} testId="inspect-panel">
        <p className="muted">
          {overgrown
            ? 'Tangled growth hides the ground. Clearing it often turns up twigs and leaf litter.'
            : 'An open patch of the garden.'}
        </p>
        {overgrown && (
          <div className="actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => controller.clearTile(selection.x, selection.y)}
            >
              Clear
            </button>
          </div>
        )}
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
        {entity.kind === 'plant' ? (
          <PlantDetails plant={entity} />
        ) : entity.kind === 'structure' ? (
          <ShelterDetails shelter={entity} />
        ) : (
          <p>{def?.description}</p>
        )}
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

  if (selection.kind === 'creature') {
    const creature = state.creatures.find((c) => c.id === selection.id)
    const def = creature ? content.wildlife[creature.speciesId] : undefined
    if (!creature || !def) return null
    const facts = knownFacts(state, content, `wildlife:${def.id}`)
    return (
      <Sheet title={def.name} onClose={close} testId="inspect-panel">
        <p>{def.description}</p>
        <p className="activity">{describeActivity(state, content, creature)}</p>
        {facts.length > 0 && (
          <ul className="facts">
            {facts.map((f) => (
              <li key={f.text}>{f.text}</li>
            ))}
          </ul>
        )}
        {facts.length < def.facts.length && (
          <p className="muted">Keep watching to learn more about it.</p>
        )}
      </Sheet>
    )
  }

  return null
}
