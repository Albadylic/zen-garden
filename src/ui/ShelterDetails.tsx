import { structureSuitability } from '../core/environment'
import { upgradeStatus } from '../core/habitats'
import type { StructureEntity } from '../core/state'
import { residents } from '../core/wildlife'
import { formatItems, RATING_LABELS } from './format'
import { useGame } from './hooks'

export function ShelterDetails({ shelter }: { shelter: StructureEntity }) {
  const controller = useGame()
  const { content, state } = controller
  const def = content.structures[shelter.defId]
  if (!def) return null
  const level = def.levels[shelter.level]!
  const next = def.levels[shelter.level + 1]
  const suit = structureSuitability(state, content, shelter.defId, shelter.x, shelter.y, shelter.id)
  const living = residents(state, shelter.id)
  const status = upgradeStatus(state, content, shelter)
  const names = [...new Set(living.map((c) => content.wildlife[c.speciesId]?.name ?? c.speciesId))]
  return (
    <>
      <p>{def.description}</p>
      <div className="stat-row">
        <span>{level.name}</span>
        <span className="muted">
          {living.length} of {level.capacity} residents
        </span>
      </div>
      <p className={`rating--${suit.rating}`}>
        {RATING_LABELS[suit.rating]} spot
        {suit.reasons.length > 0 && ` · ${suit.reasons.join(' · ')}`}
      </p>
      <p className="muted">
        {names.length > 0
          ? `Home to: ${names.join(', ')}.`
          : shelter.visits > 0
            ? 'Its residents are out foraging.'
            : 'No residents yet. Shade and plant cover nearby help.'}
      </p>
      {next && status.kind !== 'locked' && (
        <div className="upgrade" data-testid="upgrade">
          <strong>Improve to {next.name}</strong>
          {status.kind === 'needsVisits' && (
            <span className="muted">Available once wildlife has moved in.</span>
          )}
          {(status.kind === 'ready' || status.kind === 'needsItems') && (
            <span
              className={
                status.kind === 'ready' ? 'choice__cost' : 'choice__cost choice__cost--short'
              }
            >
              {formatItems(content, status.cost)}
            </span>
          )}
          <button
            type="button"
            className="button button--primary"
            disabled={status.kind !== 'ready'}
            onClick={() => controller.upgradeSelected()}
          >
            Improve
          </button>
        </div>
      )}
    </>
  )
}
