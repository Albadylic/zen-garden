import { structureSuitability } from '../core/environment'
import { type UpgradeOption, upgradeOptions } from '../core/habitats'
import type { StructureEntity } from '../core/state'
import { residents } from '../core/wildlife'
import { RATING_LABELS } from './format'
import { useGame } from './hooks'
import { Cost } from './Cost'

function OptionCard({ option, branching }: { option: UpgradeOption; branching: boolean }) {
  const controller = useGame()
  const { status, def } = option
  return (
    <div className="upgrade" data-testid={`upgrade-${def.branch ?? option.level}`}>
      <strong>{branching ? def.name : `Improve to ${def.name}`}</strong>
      {def.description && <span className="muted">{def.description}</span>}
      {status.kind === 'needsVisits' && (
        <span className="muted">Available once wildlife has moved in.</span>
      )}
      {(status.kind === 'ready' || status.kind === 'needsItems') && <Cost items={status.cost} />}
      <button
        type="button"
        className="button button--primary"
        disabled={status.kind !== 'ready'}
        onClick={() => controller.upgradeSelected(option.level)}
      >
        {branching ? 'Choose this' : 'Improve'}
      </button>
    </div>
  )
}

export function ShelterDetails({ shelter }: { shelter: StructureEntity }) {
  const controller = useGame()
  const { content, state } = controller
  const def = content.structures[shelter.defId]
  if (!def) return null
  const level = def.levels[shelter.level]!
  const suit = structureSuitability(state, content, shelter.defId, shelter.x, shelter.y, shelter.id)
  const living = residents(state, shelter.id)
  const options = upgradeOptions(state, content, shelter).filter((o) => o.status.kind !== 'locked')
  const branching = options.length > 1
  const names = [...new Set(living.map((c) => content.wildlife[c.speciesId]?.name ?? c.speciesId))]
  return (
    <>
      <p>{level.description ?? def.description}</p>
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
      {branching && (
        <p className="activity">
          Choose a direction. You can always build another shelter to try a different one.
        </p>
      )}
      {options.map((option) => (
        <OptionCard key={option.level} option={option} branching={branching} />
      ))}
    </>
  )
}
