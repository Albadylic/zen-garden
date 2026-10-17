import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  testId?: string
}

/** A bottom sheet panel that sits above the garden without covering all of it. */
export function Sheet({ title, onClose, children, testId }: Props) {
  return (
    <section className="sheet" aria-label={title} data-testid={testId}>
      <header className="sheet__header">
        <h2 className="sheet__title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </header>
      <div className="sheet__body">{children}</div>
    </section>
  )
}
