import type { Panel } from '../app/GameController'
import { type ChoicePanel, newChoices } from '../core/novelty'
import { readyStages } from '../core/projects'
import { Icon } from './Icon'
import type { IconName } from './icons'
import { useGame, useUi } from './hooks'

const TABS: { panel: Exclude<Panel, null>; label: string; icon: IconName }[] = [
  { panel: 'plants', label: 'Plants', icon: 'plant_cutting' },
  { panel: 'build', label: 'Build', icon: 'build' },
  { panel: 'restore', label: 'Restore', icon: 'restore' },
  { panel: 'inventory', label: 'Inventory', icon: 'inventory' },
]

const COUNTED: readonly string[] = ['plants', 'build', 'inventory']

/**
 * The garden tools, as icons. Each keeps its name for screen readers and as a
 * tooltip. Plants, Build and Inventory show how many new things they hold;
 * Restore shows how many restoration stages are ready to complete.
 */
export function BottomBar() {
  const controller = useGame()
  const { panel } = useUi()
  const ready = readyStages(controller.state, controller.content).length
  const fresh = (p: string) =>
    p === panel
      ? 0
      : p === 'restore'
        ? ready
        : COUNTED.includes(p)
          ? newChoices(controller.state, controller.content, p as ChoicePanel).length
          : 0
  return (
    <nav className="bottom-bar" aria-label="Garden tools">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.panel}
          className={`bottom-bar__tab${panel === tab.panel ? ' is-active' : ''}`}
          aria-pressed={panel === tab.panel}
          aria-label={tab.label}
          title={
            fresh(tab.panel) === 0
              ? tab.label
              : tab.panel === 'restore'
                ? `${tab.label}: ${fresh(tab.panel)} ready to complete`
                : `${tab.label}: ${fresh(tab.panel)} new`
          }
          onClick={() => controller.openPanel(tab.panel)}
        >
          <Icon name={tab.icon} size={32} />
          {fresh(tab.panel) > 0 && (
            <span className="badge" data-testid={`new-${tab.panel}`} aria-hidden="true">
              {fresh(tab.panel)}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
