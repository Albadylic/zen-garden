import { itemSources } from '../core/sources'
import { useGame } from './hooks'

interface Props {
  items: Record<string, number>
  /** One line, without where to find what is missing (for the placement bar). */
  compact?: boolean
}

/**
 * What something needs, item by item: how many the player has against how
 * many it takes, ticked in green when there are enough and crossed in red
 * when not, with where to gather what is still missing.
 */
export function Cost({ items, compact = false }: Props) {
  const { content, state } = useGame()
  const entries = Object.entries(items)
  if (entries.length === 0) return null
  const short = entries.filter(([id, n]) => (state.inventory[id] ?? 0) < n)
  return (
    <span className={`cost${compact ? ' cost--compact' : ''}`} data-testid="cost">
      <span className="cost__items">
        {entries.map(([id, need]) => {
          const have = state.inventory[id] ?? 0
          const met = have >= need
          const name = content.items[id]?.name ?? id
          return (
            <span
              key={id}
              className={`cost__item ${met ? 'is-met' : 'is-short'}`}
              data-testid={`cost-${id}`}
              aria-label={`${name}: ${have} of ${need}${met ? ', enough' : `, ${need - have} more needed`}`}
            >
              <span
                className="cost__swatch"
                style={{ background: content.items[id]?.colour }}
                aria-hidden="true"
              />
              <span aria-hidden="true">{name}</span>
              <span className="cost__count" aria-hidden="true">
                {Math.min(have, need)}/{need}
              </span>
              <span className="cost__mark" aria-hidden="true">
                {met ? '✓' : '✗'}
              </span>
            </span>
          )
        })}
      </span>
      {!compact &&
        short.map(([id, need]) => {
          const more = need - (state.inventory[id] ?? 0)
          const sources = itemSources(content, id, state).slice(0, 3)
          return (
            <span key={id} className="cost__gather" data-testid={`gather-${id}`}>
              Gather {more} more {content.items[id]?.name.toLowerCase() ?? id}
              {sources.length > 0 && `: from ${sources.join(', ')}`}
            </span>
          )
        })}
    </span>
  )
}
