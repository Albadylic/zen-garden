import { useEffect, useState } from 'react'
import {
  currentHint,
  isUnread,
  journalEntries,
  type JournalSection,
  knownFacts,
} from '../core/journal'
import { useGame } from './hooks'
import { Sheet } from './Sheet'

const SECTIONS: { id: JournalSection; label: string }[] = [
  { id: 'plant', label: 'Plants' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'structure', label: 'Habitats' },
  { id: 'item', label: 'Materials' },
]

export function JournalPanel() {
  const controller = useGame()
  const { content, state } = controller
  const [section, setSection] = useState<JournalSection>('plant')
  // What was unread when it came into view: the facts read before then, or
  // null for a whole new entry. Kept while the panel is open so new things stay
  // highlighted after they are marked as read.
  const [seen, setSeen] = useState<Record<string, number | null>>({})
  const all = journalEntries(content)
  const entries = all.filter((e) => e.section === section)
  const found = entries.filter((e) => state.journal[e.key]).length
  const unread = entries.filter((e) => isUnread(state, content, e.key)).map((e) => e.key)
  const unreadKey = unread.join()

  // Remember what was new the moment it comes into view (an update during
  // render, so the highlight shows on the first paint).
  const unseen = unread.filter((key) => !(key in seen))
  if (unseen.length > 0) {
    setSeen((prev) => ({
      ...prev,
      ...Object.fromEntries(unseen.map((key) => [key, state.journal[key]?.read ?? null])),
    }))
  }
  // Then mark it as read, which clears the badge.
  useEffect(() => {
    if (unreadKey) controller.markJournalRead(unreadKey.split(','))
  }, [controller, unreadKey])

  /** Facts read before this visit, null for a new entry, undefined when nothing is new. */
  const readBefore = (key: string): number | null | undefined => {
    if (key in seen) return seen[key]
    if (unread.includes(key)) return state.journal[key]?.read ?? null
    return undefined
  }
  const sectionHasNew = (id: JournalSection) =>
    id !== section && all.some((e) => e.section === id && isUnread(state, content, e.key))
  return (
    <Sheet title="Journal" onClose={() => controller.closePanel()} testId="journal-panel">
      <div className="tabs" role="tablist" aria-label="Journal sections">
        {SECTIONS.map((s) => (
          <button
            type="button"
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            className={`tab${section === s.id ? ' is-active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            {s.label}
            {sectionHasNew(s.id) && (
              <span className="dot" aria-hidden="true" data-testid={`journal-new-${s.id}`} />
            )}
          </button>
        ))}
      </div>
      <p className="muted">
        {found} of {entries.length} discovered
      </p>
      <ul className="journal-list">
        {entries.map((entry) => {
          const record = state.journal[entry.key]
          if (!record) {
            const hint = currentHint(state, content, entry.key)
            return (
              <li
                key={entry.key}
                className="journal-entry is-unknown"
                data-testid={`journal-${entry.key}`}
              >
                <span className="journal-entry__name">Not yet discovered</span>
                {hint && <span className="journal-entry__hint">{hint}</span>}
              </li>
            )
          }
          const facts = knownFacts(state, content, entry.key)
          const before = readBefore(entry.key)
          const isNew = before === null
          return (
            <li
              key={entry.key}
              className={`journal-entry${isNew ? ' is-new' : ''}`}
              data-testid={`journal-${entry.key}`}
            >
              <span className="journal-entry__name">
                {entry.name}
                {isNew && <span className="tag-new">New</span>}
              </span>
              <span className="journal-entry__detail">{entry.description}</span>
              {facts.length > 0 && (
                <ul className="facts">
                  {facts.map((f, i) => (
                    <li
                      key={f.text}
                      className={typeof before === 'number' && i >= before ? 'is-new' : undefined}
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
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
