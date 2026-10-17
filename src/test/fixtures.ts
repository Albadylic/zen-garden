import { getContent } from '../content'
import type { Content } from '../core/content'
import { createGame } from '../core/game'
import type { GameState } from '../core/state'

export function setup(seed = 1): { content: Content; state: GameState } {
  const content = getContent()
  return { content, state: createGame(content, seed) }
}
