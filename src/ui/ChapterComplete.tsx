import { useController, useUi } from './hooks'

export function ChapterComplete() {
  const controller = useController()
  const { chapterCelebration } = useUi()
  const chapter = controller.content.chapters.find((c) => c.id === chapterCelebration)
  if (!chapter) return null
  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="chapter-title">
        <p className="modal__eyebrow">Chapter complete: {chapter.title}</p>
        <h2 id="chapter-title" className="modal__title">
          {chapter.completion.title}
        </h2>
        {chapter.completion.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <button
          type="button"
          className="button button--primary"
          autoFocus
          onClick={() => controller.dismissCelebration()}
        >
          Keep tending the garden
        </button>
      </section>
    </div>
  )
}
