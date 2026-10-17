import { describePreferences } from './format'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

export function PlantsPanel() {
  const controller = useGame()
  const { content, state } = controller
  const plants = Object.values(content.plants).filter((p) => p.seedItem)
  return (
    <Sheet title="Plants" onClose={() => controller.closePanel()} testId="plants-panel">
      <ul className="choice-list">
        {plants.map((def) => {
          const seeds = state.inventory[def.seedItem!] ?? 0
          return (
            <li key={def.id}>
              <button
                type="button"
                className="choice"
                disabled={seeds === 0}
                onClick={() => controller.startPlacing({ kind: 'seed', plantId: def.id })}
              >
                <span className="choice__name">{def.name}</span>
                <span className="choice__detail">{describePreferences(def)}</span>
                <span className={`choice__cost${seeds === 0 ? ' choice__cost--short' : ''}`}>
                  {content.items[def.seedItem!]?.name}: {seeds}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
