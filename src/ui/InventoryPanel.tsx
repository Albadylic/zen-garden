import type { ItemCategory } from '../core/content'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'seed', label: 'Seeds and cuttings' },
  { id: 'material', label: 'Natural materials' },
  { id: 'food', label: 'Food' },
]

export function InventoryPanel() {
  const controller = useGame()
  const { content, state } = controller
  return (
    <Sheet title="Inventory" onClose={() => controller.closePanel()} testId="inventory-panel">
      {CATEGORIES.map((category) => {
        const items = Object.values(content.items).filter(
          (i) => i.category === category.id && (state.inventory[i.id] ?? 0) > 0,
        )
        if (items.length === 0) return null
        return (
          <section key={category.id} className="inventory-group">
            <h3 className="inventory-group__title">{category.label}</h3>
            <ul className="inventory-list">
              {items.map((item) => (
                <li key={item.id} className="inventory-item" data-testid={`item-${item.id}`}>
                  <span className="inventory-item__swatch" style={{ background: item.colour }} />
                  <span className="inventory-item__text">
                    <span className="inventory-item__name">{item.name}</span>
                    <span className="inventory-item__detail">{item.description}</span>
                  </span>
                  <span className="inventory-item__count">{state.inventory[item.id]}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {Object.keys(state.inventory).length === 0 && (
        <p className="muted">Nothing gathered yet. Look for twigs and seeds lying in the garden.</p>
      )}
    </Sheet>
  )
}
