import { useGame, useUi } from './hooks'

export function Hud() {
  const controller = useGame()
  const { canUndo, mode } = useUi()
  const lying = controller.state.drops.length
  return (
    <header className="hud-top">
      <h1 className="hud-title">{controller.content.map.name}</h1>
      <div className="hud-top__actions">
        {lying > 0 && mode.type === 'idle' && (
          <button type="button" className="pill" onClick={() => controller.collectAll()}>
            Gather all ({lying})
          </button>
        )}
        {canUndo && mode.type === 'idle' && (
          <button type="button" className="pill" onClick={() => controller.undoLast()}>
            Undo
          </button>
        )}
      </div>
    </header>
  )
}
