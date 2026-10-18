import { plantSuitability } from '../core/environment'
import { entityById, terrainAt } from '../core/grid'
import { isFinalStage, plantsToWater, timeToMaturity, timeToNextStage } from '../core/plants'
import { describeActivity, REFUGE_REACH, visitorsAt } from '../core/wildlife'
import type { PlantEntity } from '../core/state'
import type { TileOption } from '../app/GameController'
import { describePreferences, formatDuration, formatItems, RATING_LABELS } from './format'
import { useGame, useUi } from './hooks'
import { FeederDetails } from './FeederDetails'
import { HarvestAction } from './HarvestAction'
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

/** Creatures visiting what is selected, each with a link to its journal page. */
function Visitors({ x, y, entityId }: { x: number; y: number; entityId?: number }) {
  const controller = useGame()
  const { content, state } = controller
  // One row per species, described by the nearest of them.
  const all = visitorsAt(state, x, y, entityId)
  const visitors = all.filter((c, i) => all.findIndex((o) => o.speciesId === c.speciesId) === i)
  if (visitors.length === 0) return null
  const count = (speciesId: string) => all.filter((o) => o.speciesId === speciesId).length
  return (
    <section className="visitors" data-testid="visitors">
      <h3 className="inventory-group__title">Visiting now</h3>
      <ul className="visitors__list">
        {visitors.map((c) => {
          const def = content.wildlife[c.speciesId]
          if (!def) return null
          return (
            <li key={c.id} className="visitors__item" data-testid={`visitor-${c.speciesId}`}>
              <span className="visitors__swatch" style={{ background: def.colour }} />
              <span className="visitors__text">
                <span className="visitors__name">
                  {def.name}
                  {count(c.speciesId) > 1 && ` ×${count(c.speciesId)}`}
                </span>
                <span className="muted">{describeActivity(state, content, c)}</span>
              </span>
              <button
                type="button"
                className="icon-button visitors__book"
                aria-label={`Open the journal at ${def.name}`}
                title="Open in the journal"
                onClick={() => controller.openJournal(`wildlife:${def.id}`)}
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/icons/icon_journal.svg`}
                  width={24}
                  height={24}
                  alt=""
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** What can be planted or built on an empty tile, ready to place with one tap. */
function TileOptions({ x, y }: { x: number; y: number }) {
  const controller = useGame()
  const { content } = controller
  const options = controller.optionsForTile(x, y)
  const plants = options.filter((o) => o.kind === 'plant')
  const builds = options.filter((o) => o.kind === 'build')
  if (options.length === 0) return <p className="muted">Nothing you have can go here yet.</p>
  const list = (items: TileOption[]) => (
    <ul className="choice-list">
      {items.map((o) => (
        <li key={o.name}>
          <button
            type="button"
            className="choice"
            disabled={!o.affordable}
            onClick={() => controller.placeOnTile(o.source, x, y)}
          >
            <span className="choice__name">{o.name}</span>
            {o.suitability && (
              <span className={`choice__detail rating--${o.suitability.rating}`}>
                {RATING_LABELS[o.suitability.rating]} spot
                {o.suitability.reasons.length > 0 && ` · ${o.suitability.reasons[0]}`}
              </span>
            )}
            <span className={`choice__cost${o.affordable ? '' : ' choice__cost--short'}`}>
              {formatItems(content, o.cost)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
  return (
    <div data-testid="tile-options">
      {plants.length > 0 && (
        <section>
          <h3 className="inventory-group__title">Plant here</h3>
          {list(plants)}
        </section>
      )}
      {builds.length > 0 && (
        <section>
          <h3 className="inventory-group__title">Build here</h3>
          {list(builds)}
        </section>
      )}
    </div>
  )
}

function PlantDetails({ plant }: { plant: PlantEntity }) {
  const controller = useGame()
  const { content, state } = controller
  const def = content.plants[plant.defId]
  if (!def) return null
  const final = isFinalStage(def, plant.stage)
  const duration = (def.stages[plant.stage]?.durationSec ?? 0) * 1000
  const remaining = timeToNextStage(state, content, plant)
  const toMaturity = timeToMaturity(state, content, plant)
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
          {toMaturity !== null && plant.stage < def.stages.length - 2 && (
            <p className="muted" data-testid="time-to-maturity">
              Fully grown in {formatDuration(toMaturity)}
              {toMaturity > 60 * 60_000 && ', and it keeps growing while you are away'}.
            </p>
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
        {overgrown ? (
          <>
            <p className="muted">
              Tangled growth hides the ground. Clear it first; it often turns up twigs, leaf litter
              and seeds, and you can carry on clearing the tangles around it.
            </p>
            <div className="actions">
              <button
                type="button"
                className="button button--primary"
                onClick={() => controller.clearTile(selection.x, selection.y)}
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <TileOptions x={selection.x} y={selection.y} />
        )}
        <Visitors x={selection.x} y={selection.y} />
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
    const thirsty =
      entity.kind === 'plant' && plantDef && !entity.fixed && !isFinalStage(plantDef, entity.stage)
        ? plantsToWater(state, content, entity.x, entity.y).length
        : 0
    return (
      <Sheet title={def?.name ?? entity.defId} onClose={close} testId="inspect-panel">
        {entity.kind === 'plant' ? (
          <PlantDetails plant={entity} />
        ) : entity.kind === 'structure' ? (
          content.structures[entity.defId]?.feeder ? (
            <FeederDetails feeder={entity} />
          ) : (
            <ShelterDetails shelter={entity} />
          )
        ) : (
          <>
            <p>{def?.description}</p>
            {entity.kind === 'decoration' && content.decorations[entity.defId]?.refuge && (
              <p className="muted">
                Ground creatures living within {REFUGE_REACH} tiles bask and shelter here, and stay
                a little longer.
              </p>
            )}
            {entity.kind === 'decoration' && content.decorations[entity.defId]?.flat && (
              <p className="muted">
                Ground creatures follow paths and stepping stones to forage further from their
                shelter.
              </p>
            )}
          </>
        )}
        {entity.kind === 'plant' && <HarvestAction plant={entity} />}
        <Visitors x={entity.x} y={entity.y} entityId={entity.id} />
        {!entity.fixed && (
          <div className="actions">
            {thirsty > 0 && (
              <button type="button" className="button" onClick={() => controller.waterSelected()}>
                {thirsty > 1 ? `Water ${thirsty} plants` : 'Water'}
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
