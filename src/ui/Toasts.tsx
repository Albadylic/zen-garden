import { useController, useUi } from './hooks'

export function Toasts() {
  const controller = useController()
  const { toasts } = useUi()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button
          type="button"
          key={t.id}
          className={`toast toast--${t.tone}`}
          onClick={() => controller.dismissToast(t.id)}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
