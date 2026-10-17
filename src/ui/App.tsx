import { useEffect } from 'react'
import { BottomBar } from './BottomBar'
import { BuildPanel } from './BuildPanel'
import { ClearBar } from './ClearBar'
import { ChapterComplete } from './ChapterComplete'
import { GardenView } from './GardenView'
import { GardensPanel } from './GardensPanel'
import { GoalsPanel } from './GoalsPanel'
import { useController, useUi } from './hooks'
import { Hud } from './Hud'
import { InspectPanel } from './InspectPanel'
import { InventoryPanel } from './InventoryPanel'
import { JournalPanel } from './JournalPanel'
import { PlacementBar } from './PlacementBar'
import { PlantsPanel } from './PlantsPanel'
import { RestorePanel } from './RestorePanel'
import { ReturnRecap } from './ReturnRecap'
import { SettingsPanel } from './SettingsPanel'
import { Toasts } from './Toasts'
import { Welcome } from './Welcome'

interface Props {
  mountGarden: (element: HTMLElement) => () => void
}

export function App({ mountGarden }: Props) {
  const controller = useController()
  const { mode, panel, selection } = useUi()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (controller.ui.get().mode.type !== 'idle') controller.cancelMode()
      else if (controller.ui.get().panel) controller.closePanel()
      else controller.select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [controller])

  const placing = mode.type === 'place'
  return (
    <div className="app">
      <GardenView mount={mountGarden} />
      <div className="hud">
        <Hud />
        <div className="hud-bottom">
          <Toasts />
          {placing ? (
            <PlacementBar />
          ) : mode.type === 'clear' ? (
            <ClearBar />
          ) : (
            <>
              {panel === 'plants' && <PlantsPanel />}
              {panel === 'build' && <BuildPanel />}
              {panel === 'restore' && <RestorePanel />}
              {panel === 'inventory' && <InventoryPanel />}
              {panel === 'goals' && <GoalsPanel />}
              {panel === 'gardens' && <GardensPanel />}
              {panel === 'journal' && <JournalPanel />}
              {panel === 'settings' && <SettingsPanel />}
              {!panel && selection && <InspectPanel />}
              <BottomBar />
            </>
          )}
        </div>
      </div>
      <ChapterComplete />
      <ReturnRecap />
      <Welcome />
    </div>
  )
}
