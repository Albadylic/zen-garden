import { useState } from 'react'
import { useController } from './hooks'

const SPEEDS = [1, 10, 60]

/** Playtesting controls, shown in Settings when the URL has ?debug. */
export function DebugTools() {
  const controller = useController()
  const [speed, setSpeed] = useState(controller.timeScale)
  return (
    <section className="settings-group" data-testid="debug-tools">
      <h3 className="inventory-group__title">Playtesting</h3>
      <p className="muted">
        Speed up time to test pacing. Only visible with ?debug in the address.
      </p>
      <div className="actions">
        {SPEEDS.map((s) => (
          <button
            type="button"
            key={s}
            className={`button${speed === s ? ' button--primary' : ''}`}
            aria-pressed={speed === s}
            onClick={() => {
              controller.timeScale = s
              setSpeed(s)
            }}
          >
            ×{s}
          </button>
        ))}
      </div>
      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            controller.closePanel()
            controller.returnAfter(60 * 60_000)
          }}
        >
          Return after 1 hour away
        </button>
      </div>
    </section>
  )
}
