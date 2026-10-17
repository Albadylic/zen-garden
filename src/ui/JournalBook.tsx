import { useEffect, useMemo, useRef, useState } from 'react'
import {
  currentHint,
  isUnread,
  journalEntries,
  type JournalEntryDef,
  type JournalSection,
  knownFacts,
} from '../core/journal'
import { useGame } from './hooks'
import { Icon } from './Icon'

const SECTIONS: { id: JournalSection; label: string }[] = [
  { id: 'plant', label: 'Plants' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'structure', label: 'Habitats' },
  { id: 'item', label: 'Materials' },
]

/** A page of the book: a section's contents, or one entry. */
interface Page {
  section: JournalSection
  entry?: JournalEntryDef
}

/** Horizontal distance, in pixels, that turns a page. */
const SWIPE_PX = 48

/**
 * The naturalist's journal as a book in a side panel. Each section opens with
 * a contents page, followed by a page for each discovered entry; the player turns pages with
 * the arrows, a swipe or the arrow keys. An entry is marked as read when its
 * page is shown.
 */
export function JournalBook() {
  const controller = useGame()
  const { content, state } = controller
  const all = useMemo(() => journalEntries(content), [content])
  // Only discovered entries have a page; the rest wait in the contents.
  const pages: Page[] = SECTIONS.flatMap((s) => [
    { section: s.id },
    ...all
      .filter((e) => e.section === s.id && state.journal[e.key])
      .map((entry) => ({ section: s.id, entry })),
  ])
  // The page showing, by section and entry, so it stays put as new entries are found.
  // The book opens at the first page with something new, or at the beginning.
  const [at, setAt] = useState<{ section: JournalSection; key?: string }>(() => {
    const first = pages.find((p) => p.entry && isUnread(state, content, p.entry.key))
    return first ? { section: first.section, key: first.entry!.key } : { section: 'plant' }
  })
  const index = Math.max(
    0,
    pages.findIndex((p) => p.section === at.section && p.entry?.key === at.key),
  )
  const go = (p: Page | undefined) => p && setAt({ section: p.section, key: p.entry?.key })
  // Facts read before each entry's page was first shown this time (null for a
  // whole new entry), so what is new stays highlighted after it is marked read.
  const [seen, setSeen] = useState<Record<string, number | null>>({})
  const page = pages[index]!
  const key = page.entry?.key
  const unreadNow = key !== undefined && isUnread(state, content, key)
  if (key !== undefined && unreadNow && !(key in seen)) {
    setSeen((prev) => ({ ...prev, [key]: state.journal[key]?.read ?? null }))
  }
  useEffect(() => {
    if (key !== undefined && unreadNow) controller.markJournalRead([key])
  }, [controller, key, unreadNow])

  const turn = (by: number) => go(pages[Math.min(pages.length - 1, Math.max(0, index + by))])
  const openSection = (id: JournalSection) => setAt({ section: id })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') turn(-1)
      else if (e.key === 'ArrowRight') turn(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const swipeFrom = useRef<number | null>(null)
  const sectionPages = pages.filter((p) => p.section === page.section)
  const pageInSection = sectionPages.indexOf(page)
  const sectionHasNew = (id: JournalSection) =>
    pages.some((p) => p.section === id && p.entry && isUnread(state, content, p.entry.key))

  return (
    <aside className="journal-book" aria-label="Journal" data-testid="journal-panel">
      <header className="journal-book__header">
        <h2 className="journal-book__title">Journal</h2>
        <button
          type="button"
          className="icon-button"
          onClick={() => controller.closePanel()}
          aria-label="Close Journal"
        >
          <Icon name="close" size={22} />
        </button>
      </header>
      <div className="tabs journal-book__bookmarks" role="tablist" aria-label="Journal sections">
        {SECTIONS.map((s) => (
          <button
            type="button"
            key={s.id}
            role="tab"
            aria-selected={page.section === s.id}
            className={`tab${page.section === s.id ? ' is-active' : ''}`}
            onClick={() => openSection(s.id)}
          >
            {s.label}
            {s.id !== page.section && sectionHasNew(s.id) && (
              <span className="dot" aria-hidden="true" data-testid={`journal-new-${s.id}`} />
            )}
          </button>
        ))}
      </div>
      <div
        className="journal-book__page"
        data-testid="journal-page"
        onPointerDown={(e) => (swipeFrom.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipeFrom.current === null) return
          const dx = e.clientX - swipeFrom.current
          swipeFrom.current = null
          if (Math.abs(dx) >= SWIPE_PX) turn(dx < 0 ? 1 : -1)
        }}
        onPointerCancel={() => (swipeFrom.current = null)}
      >
        {page.entry ? (
          <EntryPage entry={page.entry} readBefore={seen[page.entry.key]} />
        ) : (
          <Contents
            entries={all.filter((e) => e.section === page.section)}
            onOpen={(key) => setAt({ section: page.section, key })}
            label={SECTIONS.find((s) => s.id === page.section)!.label}
          />
        )}
      </div>
      <footer className="journal-book__footer">
        <button
          type="button"
          className="icon-button"
          onClick={() => turn(-1)}
          disabled={index === 0}
          aria-label="Previous page"
        >
          <Icon name="back" size={22} />
        </button>
        <span className="muted" data-testid="journal-page-number">
          {pageInSection === 0 ? 'Contents' : `${pageInSection} of ${sectionPages.length - 1}`}
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={() => turn(1)}
          disabled={index === pages.length - 1}
          aria-label="Next page"
        >
          <Icon name="back" size={22} className="icon--flip" />
        </button>
      </footer>
    </aside>
  )
}

function Contents({
  entries,
  label,
  onOpen,
}: {
  entries: JournalEntryDef[]
  label: string
  onOpen: (key: string) => void
}) {
  const { content, state } = useGame()
  const found = entries.filter((e) => state.journal[e.key])
  // Undiscovered entries are listed only once there is a clue to follow.
  const clues = entries
    .filter((e) => !state.journal[e.key])
    .map((e) => ({ key: e.key, hint: currentHint(state, content, e.key) }))
    .filter((c) => c.hint)
  return (
    <>
      <h3 className="journal-book__heading">{label}</h3>
      <p className="muted">
        {found.length} of {entries.length} discovered
      </p>
      {found.length === 0 && <p className="muted">Nothing here yet. Keep restoring the garden.</p>}
      <ol className="journal-contents">
        {found.map((e, i) => (
          <li key={e.key}>
            <button
              type="button"
              className="journal-contents__item"
              data-testid={`journal-${e.key}`}
              onClick={() => onOpen(e.key)}
            >
              <span className="journal-contents__number">{i + 1}</span>
              <span>{e.name}</span>
              {isUnread(state, content, e.key) && <span className="tag-new">New</span>}
            </button>
          </li>
        ))}
      </ol>
      {clues.length > 0 && (
        <>
          <h4 className="journal-book__subheading">Still to find</h4>
          <ul className="journal-clues">
            {clues.map((c) => (
              <li key={c.key} className="journal-entry__hint" data-testid={`journal-${c.key}`}>
                {c.hint}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function EntryPage({
  entry,
  readBefore,
}: {
  entry: JournalEntryDef
  readBefore: number | null | undefined
}) {
  const { content, state } = useGame()
  const facts = knownFacts(state, content, entry.key)
  const isNew = readBefore === null
  return (
    <article
      className={`journal-entry${isNew ? ' is-new' : ''}`}
      data-testid={`journal-page-${entry.key}`}
    >
      <h3 className="journal-book__heading">
        {entry.name}
        {isNew && <span className="tag-new">New</span>}
      </h3>
      <p className="journal-entry__detail">{entry.description}</p>
      {facts.length > 0 && (
        <ul className="facts">
          {facts.map((f, i) => (
            <li
              key={f.text}
              className={typeof readBefore === 'number' && i >= readBefore ? 'is-new' : undefined}
            >
              {f.text}
            </li>
          ))}
        </ul>
      )}
      {facts.length < entry.facts.length && (
        <span className="journal-entry__more">
          {entry.facts.length - facts.length} more to learn
        </span>
      )}
    </article>
  )
}
