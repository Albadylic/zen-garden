import { GardenView } from './GardenView'

export function App() {
  return (
    <div className="app">
      <GardenView />
      <div className="hud" data-testid="hud">
        <h1 className="hud__title">Zen Garden</h1>
      </div>
    </div>
  )
}
