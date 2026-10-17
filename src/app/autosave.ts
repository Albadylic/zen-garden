// Saves the garden automatically: shortly after changes, whenever the page is
// hidden or closed, and catches up on time away when the page returns.

import { RECAP_THRESHOLD_MS } from '../core/offline'
import { serialize } from '../core/save'
import type { SaveStore } from '../persistence/SaveStore'
import type { GameController } from './GameController'

/** Save at most this often while playing. */
const SAVE_INTERVAL_MS = 5000

export class AutoSaver {
  private dirty = false
  private hiddenAt: number | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private unsubscribe: (() => void) | null = null
  private readonly controller: GameController
  private readonly store: SaveStore
  private readonly now: () => number

  constructor(controller: GameController, store: SaveStore, now: () => number = Date.now) {
    this.controller = controller
    this.store = store
    this.now = now
  }

  start(): void {
    this.unsubscribe = this.controller.subscribe(() => {
      this.dirty = true
    })
    this.timer = setInterval(() => {
      if (this.dirty) void this.saveNow()
    }, SAVE_INTERVAL_MS)
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('pagehide', this.onPageHide)
  }

  stop(): void {
    this.unsubscribe?.()
    if (this.timer) clearInterval(this.timer)
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pagehide', this.onPageHide)
  }

  async saveNow(): Promise<void> {
    this.dirty = false
    try {
      await this.store.save(serialize(this.controller.state, this.now()))
    } catch {
      this.dirty = true
    }
  }

  async clear(): Promise<void> {
    await this.store.clear()
  }

  private onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      this.hiddenAt = this.now()
      void this.saveNow()
      return
    }
    if (this.hiddenAt === null) return
    const away = this.now() - this.hiddenAt
    this.hiddenAt = null
    // Animation frames stop while hidden, so the time away is caught up here.
    if (away >= RECAP_THRESHOLD_MS) this.controller.returnAfter(away)
  }

  private onPageHide = () => {
    void this.saveNow()
  }
}
