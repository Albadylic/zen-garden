import { entityById, terrainAt } from '../core/grid'
import { useGame, useUi } from './hooks'
import { Sheet } from './Sheet'

const TERRAIN_LABELS: Record<string, string> = {
  grass: 'Grass',
  moss: 'Moss',
  path: 'Old stone path',
  water: 'Pond',
  margin: 'Pond margin',
  overgrown: 'Overgrowth',
}

export function InspectPanel() {
  const controller = useGame()
  const { selection } = useUi()
  const { content, state } = controller
  if (!selection) return null
  const close = () => controller.select(null)

  if (selection.kind === 'tile') {
    const terrain = terrainAt(state, selection.x, selection.y) ?? 'grass'
    return (
      <Sheet title={TERRAIN_LABELS[terrain] ?? terrain} onClose={close} testId="inspect-panel">
        <p className="muted">An open patch of the garden.</p>
      </Sheet>
    )
  }

  if (selection.kind === 'entity') {
    const entity = entityById(state, selection.id)
    if (!entity) return null
    const def =
      entity.kind === 'plant'
        ? content.plants[entity.defId]
        : entity.kind === 'structure'
          ? content.structures[entity.defId]
          : content.decorations[entity.defId]
    return (
      <Sheet title={def?.name ?? entity.defId} onClose={close} testId="inspect-panel">
        <p>{def?.description}</p>
        {!entity.fixed && (
          <div className="actions">
            <button type="button" className="button" onClick={() => controller.moveSelected()}>
              Move
            </button>
            <button type="button" className="button" onClick={() => controller.removeSelected()}>
              Remove
            </button>
          </div>
        )}
      </Sheet>
    )
  }

  return null
}
