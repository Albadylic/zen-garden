import type { Panel } from '../app/GameController'
import { useController, useUi } from './hooks'

type Tab =
  { kind: 'panel'; panel: Exclude<Panel, null>; label: string } | { kind: 'restore'; label: string }

const TABS: Tab[] = [
  { kind: 'panel', panel: 'plants', label: 'Plants' },
  { kind: 'panel', panel: 'build', label: 'Build' },
  { kind: 'restore', label: 'Restore' },
  { kind: 'panel', panel: 'inventory', label: 'Inventory' },
  { kind: 'panel', panel: 'journal', label: 'Journal' },
]

export function BottomBar() {
  const controller = useController()
  const { panel } = useUi()
  return (
    <nav className="bottom-bar" aria-label="Garden tools">
      {TABS.map((tab) => {
        const active = tab.kind === 'panel' && panel === tab.panel
        return (
          <button
            type="button"
            key={tab.label}
            className={`bottom-bar__tab${active ? ' is-active' : ''}`}
            aria-pressed={tab.kind === 'panel' ? active : undefined}
            onClick={() =>
              tab.kind === 'panel' ? controller.openPanel(tab.panel) : controller.startClearing()
            }
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
