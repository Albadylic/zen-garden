import { useState, type ReactNode } from 'react'

export interface Category<T> {
  id: string
  label: string
  items: T[]
}

interface Props<T> {
  categories: Category<T>[]
  /** Whether an item is new, so it is marked, listed first and counted on its category. */
  isNew: (item: T) => boolean
  render: (item: T, isNew: boolean) => ReactNode
  /** Key for an item, unique within the panel. */
  keyOf: (item: T) => string
  /** Shown when the chosen category has nothing in it. */
  empty?: string
  testId?: string
}

/**
 * A panel's list split into categories, chosen with a row of chips. "New"
 * comes first while anything is new, and is where the panel opens; "All"
 * shows everything, new things first.
 */
export function CategoryList<T>({
  categories,
  isNew,
  render,
  keyOf,
  empty = 'Nothing here yet.',
  testId,
}: Props<T>) {
  const all = categories.flatMap((c) => c.items)
  const fresh = all.filter(isNew)
  const shown = categories.filter((c) => c.items.length > 0)
  const [chosen, setChosen] = useState(() => (fresh.length > 0 ? 'new' : 'all'))
  const tabs = [
    ...(fresh.length > 0 ? [{ id: 'new', label: 'New', count: fresh.length }] : []),
    { id: 'all', label: 'All', count: 0 },
    ...shown.map((c) => ({ id: c.id, label: c.label, count: c.items.filter(isNew).length })),
  ]
  const active = tabs.some((t) => t.id === chosen) ? chosen : 'all'
  const items =
    active === 'new'
      ? fresh
      : active === 'all'
        ? [...fresh, ...all.filter((i) => !isNew(i))]
        : (shown.find((c) => c.id === active)?.items ?? [])
  return (
    <div className="category-list" data-testid={testId}>
      <div className="chips" role="tablist" aria-label="Categories">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`chip${active === t.id ? ' is-active' : ''}${t.id === 'new' ? ' chip--new' : ''}`}
            data-testid={`chip-${t.id}`}
            onClick={() => setChosen(t.id)}
          >
            {t.label}
            {t.count > 0 && <span className="chip__count">{t.count}</span>}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="choice-list">
          {items.map((item) => (
            <li key={keyOf(item)}>{render(item, isNew(item))}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
