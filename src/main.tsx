import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrap } from './app/bootstrap'
import { App } from './ui/App'
import { ControllerContext } from './ui/hooks'
import './ui/styles.css'

const { controller, mountGarden } = bootstrap()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ControllerContext.Provider value={controller}>
      <App mountGarden={mountGarden} />
    </ControllerContext.Provider>
  </StrictMode>,
)
