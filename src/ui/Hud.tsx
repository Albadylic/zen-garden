import type { ReactNode } from 'react'
import { openGardens } from '../core/gardens'
import { unreadCount } from '../core/journal'
import { useGame, useUi } from './hooks'
import { Icon } from './Icon'

/** Line icons for the top bar, on a 24 × 24 grid in the current text colour. */
const ICONS = {
  // A basket: gather everything lying in the garden.
  gather: (
    <>
      <path d="M4 10h16l-1.6 9.2a1 1 0 0 1-1 .8H6.6a1 1 0 0 1-1-.8z" />
      <path d="M8 10l4-6 4 6" />
      <path d="M9 14v3M12 14v3M15 14v3" />
    </>
  ),
  // A folded map: travel between gardens.
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  // A curved arrow back: undo.
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  // Two sliders: settings.
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2.5" fill="var(--paper)" />
      <circle cx="15" cy="17" r="2.5" fill="var(--paper)" />
    </>
  ),
}

function LineIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

interface NavButtonProps {
  label: string
  /** Tooltip, when it should say more than the label (such as how many are new). */
  title?: string
  active?: boolean
  disabled?: boolean
  badge?: number
  badgeTestId?: string
  onClick: () => void
  children: ReactNode
}

/** One round icon in the top bar, with a badge for anything new. */
function NavButton({
  label,
  title,
  active = false,
  disabled = false,
  badge = 0,
  badgeTestId,
  onClick,
  children,
}: NavButtonProps) {
  return (
    <button
      type="button"
      className={`pill pill--icon${active ? ' is-active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      {badge > 0 && (
        <span className="badge" data-testid={badgeTestId} aria-hidden="true">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

/**
 * The top bar: one row of icons (journal, gather, map, undo, settings), each
 * with a badge for anything new. Goals live in Restore.
 */
export function Hud() {
  const controller = useGame()
  const { content, state } = controller
  const { canUndo, mode, panel } = useUi()
  const idle = mode.type === 'idle'
  const lying = state.drops.length
  const unread = unreadCount(state, content)
  const gardens = openGardens(state, content)
  // Gardens opened since the start and not looked around yet (the first garden is home).
  const unvisited = gardens.filter(
    (g) => g.unlock !== undefined && !state.gardensVisited.includes(g.id),
  ).length
  return (
    <header className="hud-top">
      <nav className="hud-nav" aria-label="Garden menu">
        <NavButton
          label="Journal"
          title={unread > 0 ? `${unread} new in your journal` : 'Journal'}
          active={panel === 'journal'}
          badge={unread}
          badgeTestId="journal-badge"
          onClick={() => controller.openPanel('journal')}
        >
          <Icon name="journal" size={24} />
        </NavButton>
        <NavButton
          label="Gather all"
          title={lying > 0 ? `Gather all (${lying})` : 'Nothing to gather'}
          disabled={lying === 0 || !idle}
          badge={lying}
          badgeTestId="gather-badge"
          onClick={() => controller.collectAll()}
        >
          <LineIcon name="gather" />
        </NavButton>
        <NavButton
          label="Gardens"
          title={
            unvisited > 0
              ? `${unvisited} garden${unvisited === 1 ? '' : 's'} to explore`
              : 'Gardens'
          }
          active={panel === 'gardens'}
          badge={unvisited}
          badgeTestId="gardens-badge"
          onClick={() => controller.openPanel('gardens')}
        >
          <LineIcon name="map" />
        </NavButton>
        {canUndo && idle && (
          <NavButton label="Undo" onClick={() => controller.undoLast()}>
            <LineIcon name="undo" />
          </NavButton>
        )}
        <NavButton
          label="Settings"
          active={panel === 'settings'}
          onClick={() => controller.openPanel('settings')}
        >
          <LineIcon name="settings" />
        </NavButton>
      </nav>
    </header>
  )
}
