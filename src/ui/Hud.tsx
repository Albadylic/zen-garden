import { useGame, useUi } from './hooks'
import { SuggestionCard } from './SuggestionCard'

export function Hud() {
  const controller = useGame()
  const { canUndo, mode, panel, selection } = useUi()
  const lying = controller.state.drops.length
  const idle = mode.type === 'idle'
  return (
    <header className="hud-top">
      <div className="hud-top__left">
        <h1 className="hud-title">
          <button
            type="button"
            className="hud-title__button"
            onClick={() => controller.openPanel('goals')}
            aria-label={`${controller.content.map.name}: chapter goals`}
          >
            {controller.content.map.name}
          </button>
        </h1>
        {idle && !panel && !selection && <SuggestionCard />}
      </div>
      <div className="hud-top__actions">
        {lying > 0 && idle && (
          <button type="button" className="pill" onClick={() => controller.collectAll()}>
            Gather all ({lying})
          </button>
        )}
        {canUndo && idle && (
          <button type="button" className="pill" onClick={() => controller.undoLast()}>
            Undo
          </button>
        )}
      </div>
    </header>
  )
}
