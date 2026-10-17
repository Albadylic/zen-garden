import type { Panel } from '../app/GameController'
import { useController, useUi } from './hooks'

const TABS: { panel: Exclude<Panel, null>; label: string }[] = [{ panel: 'build', label: 'Build' }]

export function BottomBar() {
  const controller = useController()
  const { panel } = useUi()
  return (
    <nav className="bottom-bar" aria-label="Garden tools">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.panel}
          className={`bottom-bar__tab${panel === tab.panel ? ' is-active' : ''}`}
          aria-pressed={panel === tab.panel}
          onClick={() => controller.openPanel(tab.panel)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
