import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrap } from './app/bootstrap'
import { App } from './ui/App'
import { ControllerContext, GameContext } from './ui/hooks'
import './ui/styles.css'

const game = await bootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameContext.Provider value={game}>
      <ControllerContext.Provider value={game.controller}>
        <App mountGarden={game.mountGarden} />
      </ControllerContext.Provider>
    </GameContext.Provider>
  </StrictMode>,
)
