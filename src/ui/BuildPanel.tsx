import { useGame } from './hooks'
import { Sheet } from './Sheet'
import { Cost } from './Cost'

export function BuildPanel() {
  const controller = useGame()
  const { content } = controller
  // Only what the player has discovered; the rest appears as the garden is restored.
  const recipes = Object.values(content.recipes).filter(
    (r) => r.output.kind !== 'item' && controller.recipeAvailable(r.id),
  )
  return (
    <Sheet title="Build" onClose={() => controller.closePanel()} testId="build-panel">
      <ul className="choice-list">
        {recipes.map((recipe) => {
          const affordable = controller.canAfford(recipe.inputs)
          const def =
            recipe.output.kind === 'structure'
              ? content.structures[recipe.output.id]
              : content.decorations[recipe.output.id]
          return (
            <li key={recipe.id}>
              <button
                type="button"
                className="choice"
                disabled={!affordable}
                onClick={() => controller.startPlacing({ kind: 'recipe', recipeId: recipe.id })}
              >
                <span className="choice__name">{recipe.name}</span>
                <span className="choice__detail">{def?.description}</span>
                <Cost items={recipe.inputs} />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="muted">
        {recipes.length === 0 ? 'Nothing to build yet. ' : ''}More appears here as you restore the
        garden.
      </p>
    </Sheet>
  )
}
