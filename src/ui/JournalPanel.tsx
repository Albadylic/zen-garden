import { useState } from 'react'
import { currentHint, journalEntries, type JournalSection, knownFacts } from '../core/journal'
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
  const entries = journalEntries(content).filter((e) => e.section === section)
  const found = entries.filter((e) => state.journal[e.key]).length
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
          return (
            <li key={entry.key} className="journal-entry" data-testid={`journal-${entry.key}`}>
              <span className="journal-entry__name">{entry.name}</span>
              <span className="journal-entry__detail">{entry.description}</span>
              {facts.length > 0 && (
                <ul className="facts">
                  {facts.map((f) => (
                    <li key={f.text}>{f.text}</li>
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
