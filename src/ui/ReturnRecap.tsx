import type { Recap } from '../core/offline'
import { formatAway } from './format'
import { useController, useUi } from './hooks'

function lines(recap: Recap): string[] {
  const out: string[] = []
  if (recap.matured.length > 0) out.push(`Fully grown: ${recap.matured.join(', ')}.`)
  else if (recap.stagesGrown > 0) {
    out.push(
      `Your plants grew${recap.stagesGrown > 1 ? ` (${recap.stagesGrown} new growth stages)` : ''}.`,
    )
  }
  if (recap.flowered > 0) {
    out.push(
      recap.flowered === 1
        ? 'A patch of flowers came into bloom.'
        : `${recap.flowered} patches came into bloom.`,
    )
  }
  if (recap.mossSpread > 0) out.push('Moss crept a little further across the shade.')
  if (recap.newSpecies.length > 0) out.push(`New visitors: ${recap.newSpecies.join(', ')}.`)
  else if (recap.visits > 0)
    out.push(`Wildlife visited ${recap.visits === 1 ? 'once' : `${recap.visits} times`}.`)
  if (recap.shelterResidents > 0) out.push('Creatures settled into your shelter.')
  if (recap.itemsWaiting > 0) out.push(`${recap.itemsWaiting} natural items are ready to gather.`)
  if ((recap.newEntries > 0 || recap.factsLearned > 0) && recap.unreadNotes > 0) {
    out.push(
      `Your journal has ${recap.unreadNotes} new ${recap.unreadNotes === 1 ? 'note' : 'notes'}.`,
    )
  }
  for (const m of recap.milestones) out.push(`Milestone reached: ${m}.`)
  return out
}

export function ReturnRecap() {
  const controller = useController()
  const { recap } = useUi()
  if (!recap) return null
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recap-title"
        data-testid="recap"
      >
        <p className="modal__eyebrow">Welcome back</p>
        <h2 id="recap-title" className="modal__title">
          While you were away ({formatAway(recap.awayMs)})
        </h2>
        <ul className="recap-list">
          {lines(recap).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {recap.capped && (
          <p className="muted">
            The garden grew for the first {formatAway(recap.simulatedMs)}, then rested until you
            returned.
          </p>
        )}
        {recap.itemsWaiting > 0 && (
          <button
            type="button"
            className="button button--primary"
            autoFocus
            onClick={() => controller.dismissRecap(true)}
          >
            Gather and continue
          </button>
        )}
        <button
          type="button"
          className={recap.itemsWaiting > 0 ? 'button' : 'button button--primary'}
          autoFocus={recap.itemsWaiting === 0}
          onClick={() => controller.dismissRecap(false)}
        >
          {recap.itemsWaiting > 0 ? 'Just look around' : 'Continue'}
        </button>
      </section>
    </div>
  )
}
