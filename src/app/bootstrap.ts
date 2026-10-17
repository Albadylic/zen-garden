// Wires the game together: content, state, controller and renderer.

import { getContent } from '../content'
import { createGame } from '../core/game'
import { GardenRenderer } from '../render/GardenRenderer'
import { GameController } from './GameController'
import { installTestHooks } from './testHooks'

export interface Game {
  controller: GameController
  mountGarden: (element: HTMLElement) => () => void
}

export function bootstrap(): Game {
  const content = getContent()
  const seed = Math.floor(Math.random() * 2 ** 31)
  const controller = new GameController(content, createGame(content, seed))
  let renderer: GardenRenderer | null = null

  const mountGarden = (element: HTMLElement) => {
    const r = new GardenRenderer(controller.renderHost())
    renderer = r
    void r.mount(element)
    return () => {
      r.destroy()
      if (renderer === r) renderer = null
    }
  }

  installTestHooks(controller, () => renderer)
  return { controller, mountGarden }
}
