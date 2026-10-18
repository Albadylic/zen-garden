import type { PlantDef, PlantGroup } from '../core/content'
import { isNewChoice } from '../core/novelty'
import { sowablePlants } from '../core/plants'
import { CategoryList } from './Categories'
import { describePreferences } from './format'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

const GROUPS: { id: PlantGroup; label: string }[] = [
  { id: 'flowers', label: 'Flowers' },
  { id: 'groundcover', label: 'Ground cover' },
  { id: 'shrubs-trees', label: 'Shrubs and trees' },
  { id: 'water', label: 'Water and marsh' },
]

export function PlantsPanel() {
  const controller = useGame()
  const { content, state } = controller
  const seedsFor = (def: PlantDef) => state.inventory[def.seedItem!] ?? 0
  // Within each group, plants with seed in hand come first.
  const plants = [...sowablePlants(state, content)].sort(
    (a, b) => Number(seedsFor(b) > 0) - Number(seedsFor(a) > 0),
  )
  return (
    <Sheet title="Plants" onClose={() => controller.closePanel()} testId="plants-panel">
      <CategoryList
        categories={GROUPS.map((g) => ({
          ...g,
          items: plants.filter((p) => p.group === g.id),
        }))}
        isNew={(def) => isNewChoice(state, `plant:${def.id}`)}
        keyOf={(def) => def.id}
        render={(def, isNew) => {
          const seeds = seedsFor(def)
          return (
            <button
              type="button"
              className="choice"
              disabled={seeds === 0}
              onClick={() => controller.startPlacing({ kind: 'seed', plantId: def.id })}
            >
              <span className="choice__name">
                {def.name}
                {isNew && <span className="tag-new">New</span>}
              </span>
              <span className="choice__detail">{describePreferences(def)}</span>
              <span className={`choice__cost${seeds === 0 ? ' choice__cost--short' : ''}`}>
                {content.items[def.seedItem!]?.name}: {seeds}
              </span>
            </button>
          )
        }}
      />
      <p className="muted">More plants appear here as you find their seeds.</p>
    </Sheet>
  )
}
