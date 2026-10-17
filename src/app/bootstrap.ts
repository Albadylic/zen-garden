// Wires the game together: content, saved state, controller, autosave and renderer.

import { getContent } from '../content'
import { createGame } from '../core/game'
import { RECAP_THRESHOLD_MS } from '../core/offline'
import { deserialize, type SaveData, SaveError, serialize } from '../core/save'
import { requestPersistentStorage } from '../persistence/browser'
import { openIndexedDbStore } from '../persistence/IndexedDbSaveStore'
import { MemorySaveStore, type SaveStore } from '../persistence/SaveStore'
import { GardenRenderer } from '../render/GardenRenderer'
import { AutoSaver } from './autosave'
import { GameController } from './GameController'
import { installTestHooks } from './testHooks'

export interface Game {
  controller: GameController
  saver: AutoSaver
  /** False when saves only last until the page closes (no IndexedDB). */
  persistent: boolean
  mountGarden: (element: HTMLElement) => () => void
  /** The current garden as save data, for export. */
  exportSave: () => SaveData
  /** Replaces the garden with an imported save. Throws SaveError if it is invalid. */
  importSave: (raw: unknown) => Promise<void>
  /** Discards the garden and starts again. */
  resetGarden: () => Promise<void>
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

async function openStore(): Promise<{ store: SaveStore; persistent: boolean }> {
  const idb = await openIndexedDbStore()
  return idb
    ? { store: idb, persistent: true }
    : { store: new MemorySaveStore(), persistent: false }
}

export async function bootstrap(): Promise<Game> {
  const content = getContent()
  const { store, persistent } = await openStore()

  let saved: SaveData | null = null
  try {
    const raw = await store.load()
    if (raw) saved = deserialize(raw)
  } catch (e) {
    // A damaged save should never block play; start fresh and keep the old data aside.
    if (!(e instanceof SaveError)) throw e
    console.warn('Could not load the saved garden:', e.message)
  }

  const controller = new GameController(content, saved?.state ?? createGame(content, newSeed()))
  const saver = new AutoSaver(controller, store)
  saver.start()
  if (saved) {
    const away = Date.now() - saved.savedAt
    if (away >= RECAP_THRESHOLD_MS) controller.returnAfter(away)
  } else {
    void saver.saveNow()
  }
  void requestPersistentStorage()

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

  const game: Game = {
    controller,
    saver,
    persistent,
    mountGarden,
    exportSave: () => serialize(controller.state, Date.now()),
    importSave: async (raw) => {
      const data = deserialize(raw)
      controller.replaceState(data.state)
      await saver.saveNow()
    },
    resetGarden: async () => {
      controller.replaceState(createGame(content, newSeed()))
      await saver.saveNow()
    },
  }
  installTestHooks(game, () => renderer)
  return game
}
