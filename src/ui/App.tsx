import { useEffect } from 'react'
import { BottomBar } from './BottomBar'
import { BuildPanel } from './BuildPanel'
import { GardenView } from './GardenView'
import { useController, useUi } from './hooks'
import { Hud } from './Hud'
import { InspectPanel } from './InspectPanel'
import { PlacementBar } from './PlacementBar'
import { PlantsPanel } from './PlantsPanel'
import { Toasts } from './Toasts'

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
        <Toasts />
        <div className="hud-bottom">
          {placing ? (
            <PlacementBar />
          ) : (
            <>
              {panel === 'plants' && <PlantsPanel />}
              {panel === 'build' && <BuildPanel />}
              {!panel && selection && <InspectPanel />}
              <BottomBar />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
