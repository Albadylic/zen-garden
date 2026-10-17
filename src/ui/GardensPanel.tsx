import { isGardenOpen } from '../core/gardens'
import { isChapterComplete } from '../core/progression'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

/** The gardens the player has opened, to travel between them. */
export function GardensPanel() {
  const controller = useGame()
  const { content, state } = controller
  const open = content.world.gardens.filter((g) => isGardenOpen(state, g))
  const restored = (gardenId: string) => {
    // Each chapter shares its garden's id.
    const chapter = content.chapters.find((ch) => ch.id === gardenId)
    return chapter ? isChapterComplete(state, chapter) : false
  }
  return (
    <Sheet title="Gardens" onClose={() => controller.closePanel()} testId="gardens-panel">
      <p className="muted">
        {open.filter((g) => restored(g.id)).length} of {content.world.layout.length} gardens
        restored
      </p>
      <ul className="garden-list">
        {open.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              className="garden-list__item"
              onClick={() => controller.visitGarden(g.id)}
            >
              <span className="garden-list__number">{g.number}</span>
              <span className="garden-list__name">{g.name}</span>
              <span className="muted">{restored(g.id) ? 'Restored' : 'In progress'}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
