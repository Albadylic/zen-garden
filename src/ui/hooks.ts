import { createContext, useContext, useSyncExternalStore } from 'react'
import type { GameController, UiState } from '../app/GameController'

export const ControllerContext = createContext<GameController | null>(null)

export function useController(): GameController {
  const controller = useContext(ControllerContext)
  if (!controller) throw new Error('useController must be used inside ControllerContext')
  return controller
}

/** UI state (mode, selection, panels, toasts). */
export function useUi(): UiState {
  const controller = useController()
  return useSyncExternalStore(controller.ui.subscribe, controller.ui.get)
}

/** Re-renders when the game state moves on; returns the controller for reading it. */
export function useGame(): GameController {
  const controller = useController()
  useSyncExternalStore(controller.subscribe, controller.getVersion)
  return controller
}
