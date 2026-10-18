import type { ItemCategory, ItemDef, RecipeDef } from '../core/content'
import { isNewChoice } from '../core/novelty'
import { CategoryList } from './Categories'
import { Cost } from './Cost'
import { useGame } from './hooks'
import { Icon } from './Icon'
import { ITEM_ICONS } from './icons'
import { Sheet } from './Sheet'

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'seed', label: 'Seeds' },
  { id: 'material', label: 'Materials' },
  { id: 'food', label: 'Food' },
]

/** An item held, or a recipe that makes one. */
type Entry = { kind: 'item'; item: ItemDef } | { kind: 'make'; recipe: RecipeDef }

export function InventoryPanel() {
  const controller = useGame()
  const { content, state } = controller
  const held = Object.values(content.items).filter((i) => (state.inventory[i.id] ?? 0) > 0)
  const makeable = Object.values(content.recipes).filter(
    (r) => r.output.kind === 'item' && controller.recipeAvailable(r.id),
  )
  const keyOf = (e: Entry) => (e.kind === 'item' ? `item:${e.item.id}` : `recipe:${e.recipe.id}`)
  return (
    <Sheet title="Inventory" onClose={() => controller.closePanel()} testId="inventory-panel">
      <CategoryList<Entry>
        categories={[
          ...CATEGORIES.map((c) => ({
            ...c,
            items: held
              .filter((i) => i.category === c.id)
              .map((item): Entry => ({ kind: 'item', item })),
          })),
          {
            id: 'make',
            label: 'Make',
            items: makeable.map((recipe): Entry => ({ kind: 'make', recipe })),
          },
        ]}
        isNew={(e) => isNewChoice(state, keyOf(e))}
        keyOf={keyOf}
        empty="Nothing gathered yet. Look for twigs and seeds lying in the garden."
        render={(e, isNew) =>
          e.kind === 'item' ? (
            <div className="inventory-item" data-testid={`item-${e.item.id}`}>
              {ITEM_ICONS[e.item.id] ? (
                <Icon name={ITEM_ICONS[e.item.id]!} size={28} />
              ) : (
                <span className="inventory-item__swatch" style={{ background: e.item.colour }} />
              )}
              <span className="inventory-item__text">
                <span className="inventory-item__name">
                  {e.item.name}
                  {isNew && <span className="tag-new">New</span>}
                </span>
                <span className="inventory-item__detail">{e.item.description}</span>
              </span>
              <span className="inventory-item__count">{state.inventory[e.item.id]}</span>
            </div>
          ) : (
            <button
              type="button"
              className="choice"
              disabled={!controller.canAfford(e.recipe.inputs)}
              onClick={() => controller.craft(e.recipe.id)}
            >
              <span className="choice__name">
                {e.recipe.name}
                {isNew && <span className="tag-new">New</span>}
              </span>
              <span className="choice__detail">
                {content.items[e.recipe.output.id]?.description}
              </span>
              <Cost items={e.recipe.inputs} />
            </button>
          )
        }
      />
    </Sheet>
  )
}
