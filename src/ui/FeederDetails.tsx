import type { StructureEntity } from '../core/state'
import { formatDuration } from './format'
import { useGame } from './hooks'

export function FeederDetails({ feeder }: { feeder: StructureEntity }) {
  const controller = useGame()
  const { content, state } = controller
  const def = content.structures[feeder.defId]
  if (!def?.feeder) return null
  const item = content.items[def.feeder.item]
  const left = feeder.filledMs ?? 0
  const have = state.inventory[def.feeder.item] ?? 0
  const visitors = state.creatures.filter((c) => c.targetId === feeder.id).length
  return (
    <>
      <p>{def.description}</p>
      <p className="activity">
        {left > 0
          ? `Filled: lasts ${formatDuration(left)} more`
          : 'Empty. Fill it to welcome visitors again.'}
      </p>
      {visitors > 0 && (
        <p className="muted">
          {visitors === 1 ? 'A visitor is here now.' : `${visitors} visitors are here now.`}
        </p>
      )}
      <div className="upgrade">
        <strong>Fill with {item?.name.toLowerCase()}</strong>
        <span className={have > 0 ? 'choice__cost' : 'choice__cost choice__cost--short'}>
          {item?.name} ×1 (you have {have})
        </span>
        <button
          type="button"
          className="button button--primary"
          disabled={have === 0 || left >= def.feeder.durationSec * 2000}
          onClick={() => controller.fillSelected()}
        >
          Fill
        </button>
      </div>
    </>
  )
}
