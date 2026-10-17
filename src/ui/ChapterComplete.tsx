import { useController, useUi } from './hooks'

export function ChapterComplete() {
  const controller = useController()
  const { chapterCelebration } = useUi()
  if (!chapterCelebration) return null
  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="chapter-title">
        <p className="modal__eyebrow">Chapter complete</p>
        <h2 id="chapter-title" className="modal__title">
          The forgotten garden is alive again
        </h2>
        <p>
          Flowers draw butterflies along the old paths, and small creatures shelter beneath the
          pines.
        </p>
        <p>
          With a creak, the old gate in the garden wall swings open. Beyond it, bamboo rustles in
          the wind: the Bamboo Grove is waiting for the next chapter of your sanctuary.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => controller.dismissCelebration()}
        >
          Keep tending the garden
        </button>
      </section>
    </div>
  )
}
