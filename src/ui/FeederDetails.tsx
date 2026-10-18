import type { StructureEntity } from '../core/state'
import { formatDuration } from './format'
import { useGame } from './hooks'
import { UpgradeList } from './ShelterDetails'
import { Cost } from './Cost'

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
        <Cost items={{ [def.feeder.item]: 1 }} />
        <button
          type="button"
          className="button button--primary"
          disabled={have === 0 || left >= def.feeder.durationSec * 2000}
          onClick={() => controller.fillSelected()}
        >
          Fill
        </button>
      </div>
      {/* A feeder that is also a home (such as the leaf-litter bed) can be improved too. */}
      <UpgradeList structure={feeder} />
    </>
  )
}
