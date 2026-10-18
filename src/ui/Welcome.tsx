import { useController, useUi } from './hooks'

export function Welcome() {
  const controller = useController()
  const { welcome } = useUi()
  if (!welcome) return null
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        data-testid="welcome"
      >
        <p className="modal__brand">
          <span className="modal__brand-name">Satoyama</span>
          <span className="modal__brand-tagline">Bring back the garden</span>
        </p>
        <p className="modal__eyebrow">Chapter 1</p>
        <h2 id="welcome-title" className="modal__title">
          The Forgotten Garden
        </h2>
        <p>
          Behind an old wall lies a garden nobody has tended for a long time. Moss creeps over the
          stones, the pond is quiet, and two ancient pines still shade one corner.
        </p>
        <p>
          Plant, gather and build at your own pace. Nothing here will wither while you are away: the
          garden simply waits, and grows a little, until you return.
        </p>
        <button
          type="button"
          className="button button--primary"
          autoFocus
          onClick={() => controller.dismissWelcome()}
        >
          Step into the garden
        </button>
      </section>
    </div>
  )
}
