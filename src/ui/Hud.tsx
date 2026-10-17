import { useController, useUi } from './hooks'

export function Hud() {
  const controller = useController()
  const { canUndo, mode } = useUi()
  return (
    <header className="hud-top">
      <h1 className="hud-title">{controller.content.map.name}</h1>
      <div className="hud-top__actions">
        {canUndo && mode.type === 'idle' && (
          <button type="button" className="pill" onClick={() => controller.undoLast()}>
            Undo
          </button>
        )}
      </div>
    </header>
  )
}
