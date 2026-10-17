import { formatItems } from './format'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

export function BuildPanel() {
  const controller = useGame()
  const { content } = controller
  const recipes = Object.values(content.recipes).filter((r) => r.output.kind !== 'item')
  return (
    <Sheet title="Build" onClose={() => controller.closePanel()} testId="build-panel">
      <ul className="choice-list">
        {recipes.map((recipe) => {
          const known = controller.recipeAvailable(recipe.id)
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
                disabled={!known || !affordable}
                onClick={() => controller.startPlacing({ kind: 'recipe', recipeId: recipe.id })}
              >
                <span className="choice__name">{recipe.name}</span>
                <span className="choice__detail">
                  {known ? def?.description : 'Not discovered yet. Keep restoring the garden.'}
                </span>
                <span className={`choice__cost${affordable ? '' : ' choice__cost--short'}`}>
                  {formatItems(content, recipe.inputs)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
