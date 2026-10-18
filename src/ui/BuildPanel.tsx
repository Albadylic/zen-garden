import type { BuildGroup, RecipeDef } from '../core/content'
import { isNewChoice } from '../core/novelty'
import { CategoryList } from './Categories'
import { Cost } from './Cost'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

const GROUPS: { id: BuildGroup; label: string }[] = [
  { id: 'habitats', label: 'Habitats' },
  { id: 'paths', label: 'Paths' },
  { id: 'features', label: 'Features' },
]

export function BuildPanel() {
  const controller = useGame()
  const { content, state } = controller
  // Only what the player has discovered; the rest appears as the garden is restored.
  const recipes = Object.values(content.recipes).filter(
    (r) => r.output.kind !== 'item' && controller.recipeAvailable(r.id),
  )
  const describe = (recipe: RecipeDef) =>
    recipe.output.kind === 'structure'
      ? content.structures[recipe.output.id]?.description
      : content.decorations[recipe.output.id]?.description
  return (
    <Sheet title="Build" onClose={() => controller.closePanel()} testId="build-panel">
      <CategoryList
        categories={GROUPS.map((g) => ({ ...g, items: recipes.filter((r) => r.group === g.id) }))}
        isNew={(r) => isNewChoice(state, `recipe:${r.id}`)}
        keyOf={(r) => r.id}
        empty="Nothing to build yet."
        render={(recipe, isNew) => (
          <button
            type="button"
            className="choice"
            disabled={!controller.canAfford(recipe.inputs)}
            onClick={() => controller.startPlacing({ kind: 'recipe', recipeId: recipe.id })}
          >
            <span className="choice__name">
              {recipe.name}
              {isNew && <span className="tag-new">New</span>}
            </span>
            <span className="choice__detail">{describe(recipe)}</span>
            <Cost items={recipe.inputs} />
          </button>
        )}
      />
      <p className="muted">More appears here as you restore the garden.</p>
    </Sheet>
  )
}
