import type { Panel } from '../app/GameController'
import { unreadCount } from '../core/journal'
import { useGame, useUi } from './hooks'

const TABS: { panel: Exclude<Panel, null>; label: string }[] = [
  { panel: 'plants', label: 'Plants' },
  { panel: 'build', label: 'Build' },
  { panel: 'restore', label: 'Restore' },
  { panel: 'inventory', label: 'Inventory' },
  { panel: 'journal', label: 'Journal' },
]

export function BottomBar() {
  const controller = useGame()
  const { panel } = useUi()
  const unread = unreadCount(controller.state, controller.content)
  return (
    <nav className="bottom-bar" aria-label="Garden tools">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.panel}
          className={`bottom-bar__tab${panel === tab.panel ? ' is-active' : ''}`}
          aria-pressed={panel === tab.panel}
          title={
            tab.panel === 'journal' && unread > 0 ? `${unread} new in your journal` : undefined
          }
          onClick={() => controller.openPanel(tab.panel)}
        >
          {tab.label}
          {tab.panel === 'journal' && unread > 0 && (
            <span className="badge" data-testid="journal-badge" aria-hidden="true">
              {unread}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
