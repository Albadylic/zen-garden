import type { Panel } from '../app/GameController'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { useGame, useUi } from './hooks'

const TABS: { panel: Exclude<Panel, null>; label: string; icon: IconName }[] = [
  { panel: 'plants', label: 'Plants', icon: 'plant_cutting' },
  { panel: 'build', label: 'Build', icon: 'build' },
  { panel: 'restore', label: 'Restore', icon: 'restore' },
  { panel: 'inventory', label: 'Inventory', icon: 'inventory' },
]

/** The garden tools, as icons. Each keeps its name for screen readers and as a tooltip. */
export function BottomBar() {
  const controller = useGame()
  const { panel } = useUi()
  return (
    <nav className="bottom-bar" aria-label="Garden tools">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.panel}
          className={`bottom-bar__tab${panel === tab.panel ? ' is-active' : ''}`}
          aria-pressed={panel === tab.panel}
          aria-label={tab.label}
          title={tab.label}
          onClick={() => controller.openPanel(tab.panel)}
        >
          <Icon name={tab.icon} size={32} />
        </button>
      ))}
    </nav>
  )
}
