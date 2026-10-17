// Owns the running game: the state, the simulation loop, player actions and
// the UI state shared by React and the renderer.

import type { Content } from '../core/content'
import {
  plantSuitability,
  type Rating,
  structureSuitability,
  type Suitability,
} from '../core/environment'
import type { GameEvent } from '../core/events'
import { entityAt, entityById, terrainAt } from '../core/grid'
import {
  type ActionResult,
  buildRecipe,
  type Check,
  checkPlacement,
  hasUnlock,
  moveEntity,
  type Placeable,
  placeableName,
  removeEntity,
  undo,
  type UndoRecord,
} from '../core/layout'
import { upgradeStructure } from '../core/habitats'
import { plant, water } from '../core/plants'
import { clearOvergrowth, collectAll, collectDrop } from '../core/resources'
import { advance } from '../core/simulation'
import type { GameState } from '../core/state'
import type { Point } from '../render/iso'
import type { RenderHost, RenderView, Selection, TapTarget } from '../render/GardenRenderer'
import { createStore, type Store } from './store'
import { formatItems } from './text'

export type PlaceSource =
  | { kind: 'seed'; plantId: string }
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'move'; entityId: number }

export type Mode =
  { type: 'idle' } | { type: 'place'; source: PlaceSource; tile: Point | null } | { type: 'clear' }

export type Panel = null | 'plants' | 'build' | 'inventory' | 'goals' | 'settings'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'warning' | 'milestone'
  expiresAt: number
}

export interface UiState {
  mode: Mode
  selection: Selection | null
  panel: Panel
  toasts: Toast[]
  canUndo: boolean
  /** Shown once when the chapter is completed. */
  chapterCelebration: boolean
  /** Whether the suggestion card is expanded. */
  suggestionsOpen: boolean
}

export interface PlacementInfo {
  name: string
  placeable: Placeable
  tile: Point | null
  check: Check | null
  suitability: Suitability | null
  cost: Record<string, number>
}

/** How often (ms of real time) the UI is told that game state has moved on. */
const UI_REFRESH_MS = 500
const TOAST_MS = 4000
const UNDO_LIMIT = 20

export class GameController {
  readonly ui: Store<UiState>
  /** Multiplies simulated time; only changed from the debug tools. */
  timeScale = 1
  private version = 0
  private listeners = new Set<() => void>()
  private sinceRefresh = 0
  private realTime = 0
  private toastId = 0
  private undoStack: UndoRecord[] = []
  private hoverTile: Point | null = null
  private overlayCache: { key: string; overlay: RenderView['overlay'] } | null = null

  readonly content: Content
  state: GameState

  constructor(content: Content, state: GameState) {
    this.content = content
    this.state = state
    this.ui = createStore<UiState>({
      mode: { type: 'idle' },
      selection: null,
      panel: null,
      toasts: [],
      canUndo: false,
      chapterCelebration: false,
      suggestionsOpen: true,
    })
  }

  // --- Subscriptions for React --------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = (): number => this.version

  private notify(): void {
    this.version++
    this.sinceRefresh = 0
    for (const listener of this.listeners) listener()
  }

  // --- Simulation loop ------------------------------------------------------

  /** Simulates time the player was away, in coarse offline steps. */
  passTime(ms: number): GameEvent[] {
    const events = advance(this.state, this.content, ms, { offline: true })
    this.handleEvents(events)
    this.notify()
    return events
  }

  /** Advances the game by real elapsed time. Called every animation frame. */
  frame(realDtMs: number): void {
    // Long gaps (a backgrounded tab) are handled by catch-up, not by one huge frame.
    const dt = Math.min(realDtMs, 1000)
    this.realTime += dt
    const events = advance(this.state, this.content, dt * this.timeScale)
    if (events.length > 0) this.handleEvents(events)
    this.expireToasts()
    this.sinceRefresh += dt
    if (events.length > 0 || this.sinceRefresh >= UI_REFRESH_MS) this.notify()
  }

  /** Turns simulation and action events into player-facing feedback. */
  private handleEvents(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'collected':
          if (!e.auto) this.toast(`Gathered ${formatItems(this.content, e.items)}`)
          break
        case 'cleared':
          this.toast(
            Object.keys(e.items).length > 0
              ? `Cleared overgrowth and found ${formatItems(this.content, e.items)}`
              : 'Cleared overgrowth',
          )
          break
        case 'milestone':
          this.toast(`Milestone: ${e.title}`, 'milestone')
          break
        case 'unlocked':
          if (e.key.startsWith('recipe:')) {
            const recipe = this.content.recipes[e.key.slice('recipe:'.length)]
            if (recipe) this.toast(`New to build: ${recipe.name}`, 'milestone')
          } else if (e.key.startsWith('upgrade:')) {
            this.toast('Shelters can now be improved', 'milestone')
          }
          break
        case 'chapterComplete':
          this.ui.set({ chapterCelebration: true, panel: null, mode: { type: 'idle' } })
          break
        case 'wildlifeArrived':
          if (this.state.stats.seen[e.speciesId] === 1) {
            const name = this.content.wildlife[e.speciesId]?.name ?? 'A new visitor'
            this.toast(`${name}: a first visit to the garden`, 'milestone')
          }
          break
      }
    }
  }

  dismissCelebration(): void {
    this.ui.set({ chapterCelebration: false })
  }

  toggleSuggestions(): void {
    this.ui.set((s) => ({ suggestionsOpen: !s.suggestionsOpen }))
  }

  // --- Gathering and restoring ---------------------------------------------

  collectAll(): void {
    this.applyResult(collectAll(this.state))
  }

  startClearing(): void {
    this.ui.set({ mode: { type: 'clear' }, panel: null, selection: null })
  }

  clearTile(x: number, y: number): void {
    const result = clearOvergrowth(this.state, this.content, x, y)
    // Tapping cleared ground while restoring is harmless, so stay quiet about it.
    if (!result.ok && this.ui.get().mode.type === 'clear') return
    if (this.applyResult(result) && this.ui.get().selection?.kind === 'tile') this.select(null)
  }

  // --- Toasts ---------------------------------------------------------------

  toast(text: string, tone: Toast['tone'] = 'info'): void {
    const toast: Toast = { id: ++this.toastId, text, tone, expiresAt: this.realTime + TOAST_MS }
    this.ui.set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }))
  }

  dismissToast(id: number): void {
    this.ui.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  }

  private expireToasts(): void {
    const { toasts } = this.ui.get()
    if (toasts.some((t) => t.expiresAt <= this.realTime)) {
      this.ui.set({ toasts: toasts.filter((t) => t.expiresAt > this.realTime) })
    }
  }

  // --- Panels and selection -------------------------------------------------

  openPanel(panel: Panel): void {
    this.ui.set((s) => ({ panel: s.panel === panel ? null : panel, mode: { type: 'idle' } }))
  }

  closePanel(): void {
    this.ui.set({ panel: null })
  }

  select(selection: Selection | null): void {
    this.ui.set({ selection })
  }

  // --- Placement ------------------------------------------------------------

  startPlacing(source: PlaceSource): void {
    this.ui.set({ mode: { type: 'place', source, tile: null }, panel: null, selection: null })
  }

  cancelMode(): void {
    this.ui.set({ mode: { type: 'idle' } })
  }

  private placeableFor(source: PlaceSource): Placeable | null {
    if (source.kind === 'seed') return { kind: 'plant', defId: source.plantId }
    if (source.kind === 'recipe') {
      const recipe = this.content.recipes[source.recipeId]
      return recipe ? { kind: recipe.output.kind, defId: recipe.output.id } : null
    }
    const entity = entityById(this.state, source.entityId)
    return entity ? { kind: entity.kind, defId: entity.defId } : null
  }

  private costFor(source: PlaceSource): Record<string, number> {
    if (source.kind === 'seed') {
      const seed = this.content.plants[source.plantId]?.seedItem
      return seed ? { [seed]: 1 } : {}
    }
    if (source.kind === 'recipe') return this.content.recipes[source.recipeId]?.inputs ?? {}
    return {}
  }

  private artFor(placeable: Placeable, source: PlaceSource): string {
    if (source.kind === 'move') {
      const e = entityById(this.state, source.entityId)
      if (e?.kind === 'plant') return `plant:${e.defId}:${e.stage}`
      if (e?.kind === 'structure') return `structure:${e.defId}:${e.level}`
    }
    if (placeable.kind === 'plant') return `plant:${placeable.defId}:1`
    if (placeable.kind === 'structure') return `structure:${placeable.defId}:0`
    return `decoration:${placeable.defId}`
  }

  suitabilityFor(
    placeable: Placeable,
    x: number,
    y: number,
    excludeId?: number,
  ): Suitability | null {
    if (placeable.kind === 'plant')
      return plantSuitability(this.state, this.content, placeable.defId, x, y, excludeId)
    if (placeable.kind === 'structure')
      return structureSuitability(this.state, this.content, placeable.defId, x, y, excludeId)
    return null
  }

  /** Details of the current placement for the placement bar, or null when not placing. */
  placementInfo(): PlacementInfo | null {
    const mode = this.ui.get().mode
    if (mode.type !== 'place') return null
    const placeable = this.placeableFor(mode.source)
    if (!placeable) return null
    const tile = mode.tile ?? this.hoverTile
    const movingId = mode.source.kind === 'move' ? mode.source.entityId : undefined
    return {
      name: placeableName(this.content, placeable),
      placeable,
      tile,
      check: tile
        ? checkPlacement(this.state, this.content, placeable, tile.x, tile.y, movingId)
        : null,
      suitability: tile ? this.suitabilityFor(placeable, tile.x, tile.y, movingId) : null,
      cost: this.costFor(mode.source),
    }
  }

  confirmPlacement(): void {
    const mode = this.ui.get().mode
    if (mode.type !== 'place' || !mode.tile) return
    const { x, y } = mode.tile
    const source = mode.source
    let result: ActionResult
    if (source.kind === 'seed') result = plant(this.state, this.content, source.plantId, x, y)
    else if (source.kind === 'recipe')
      result = buildRecipe(this.state, this.content, source.recipeId, x, y)
    else result = moveEntity(this.state, this.content, source.entityId, x, y)
    if (!this.applyResult(result)) return
    // Keep placing the same thing while it is still affordable; moving is one-off.
    if (source.kind !== 'move' && this.canAfford(this.costFor(source))) {
      this.ui.set({ mode: { type: 'place', source, tile: null } })
    } else {
      const placed = entityAt(this.state, x, y)
      this.ui.set({
        mode: { type: 'idle' },
        selection: placed ? { kind: 'entity', id: placed.id } : null,
      })
    }
  }

  canAfford(cost: Record<string, number>): boolean {
    return Object.entries(cost).every(([id, n]) => (this.state.inventory[id] ?? 0) >= n)
  }

  recipeAvailable(recipeId: string): boolean {
    return hasUnlock(this.state, this.content.recipes[recipeId]?.unlock)
  }

  // --- Entity actions -------------------------------------------------------

  moveSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.startPlacing({ kind: 'move', entityId: sel.id })
  }

  upgradeSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.applyResult(upgradeStructure(this.state, this.content, sel.id))
  }

  waterSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.applyResult(water(this.state, this.content, sel.id))
  }

  removeSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    if (this.applyResult(removeEntity(this.state, this.content, sel.id)))
      this.ui.set({ selection: null })
  }

  undoLast(): void {
    const record = this.undoStack.pop()
    if (!record) return
    const result = undo(this.state, this.content, record)
    if (!result.ok) this.toast(`Can't undo: ${result.reason}`, 'warning')
    this.ui.set({ canUndo: this.undoStack.length > 0, selection: null })
    this.notify()
  }

  /** Applies an action result: records undo, reports failure, handles events. */
  protected applyResult(result: ActionResult): boolean {
    if (!result.ok) {
      this.toast(result.reason, 'warning')
      return false
    }
    if (result.undo) {
      this.undoStack.push(result.undo)
      if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift()
    }
    if (result.events.length > 0) this.handleEvents(result.events)
    this.ui.set({ canUndo: this.undoStack.length > 0 })
    this.notify()
    return true
  }

  // --- Input from the renderer ---------------------------------------------

  tap(target: TapTarget): void {
    const { mode } = this.ui.get()
    if (mode.type === 'place') {
      if (!target.tile) return
      // A mouse click places straight away (the hover already previewed it);
      // a touch first previews, then a second tap on the same tile confirms.
      const same = mode.tile && mode.tile.x === target.tile.x && mode.tile.y === target.tile.y
      this.ui.set({ mode: { ...mode, tile: target.tile } })
      if (same || target.pointerType === 'mouse') this.confirmPlacement()
      return
    }
    if (mode.type === 'clear') {
      if (target.tile) this.clearTile(target.tile.x, target.tile.y)
      return
    }
    this.tapIdle(target)
  }

  private tapIdle(target: TapTarget): void {
    if (target.dropId !== undefined) {
      this.applyResult(collectDrop(this.state, target.dropId))
      return
    }
    if (target.creatureId !== undefined) {
      this.select({ kind: 'creature', id: target.creatureId })
      return
    }
    if (!target.tile) {
      this.select(null)
      return
    }
    const entity = entityAt(this.state, target.tile.x, target.tile.y)
    if (entity) {
      this.select({ kind: 'entity', id: entity.id })
      return
    }
    const terrain = terrainAt(this.state, target.tile.x, target.tile.y)
    if (terrain === 'boundary') this.select(null)
    else this.select({ kind: 'tile', ...target.tile })
  }

  hover(tile: Point | null): void {
    const changed = tile?.x !== this.hoverTile?.x || tile?.y !== this.hoverTile?.y
    this.hoverTile = tile
    if (changed && this.ui.get().mode.type === 'place') this.notify()
  }

  // --- Render view ----------------------------------------------------------

  view(): RenderView {
    const { mode, selection } = this.ui.get()
    let preview: RenderView['preview'] = null
    let overlay: RenderView['overlay'] = null
    if (mode.type === 'place') {
      const placeable = this.placeableFor(mode.source)
      const tile = mode.tile ?? this.hoverTile
      const movingId = mode.source.kind === 'move' ? mode.source.entityId : undefined
      if (placeable && tile) {
        preview = {
          x: tile.x,
          y: tile.y,
          art: this.artFor(placeable, mode.source),
          valid: checkPlacement(this.state, this.content, placeable, tile.x, tile.y, movingId).ok,
          movingId,
        }
      }
      if (placeable) overlay = this.overlayFor(placeable, movingId)
    } else if (mode.type === 'clear') {
      overlay = this.state.terrain.map((t) => (t === 'overgrown' ? 'good' : null))
    }
    return {
      preview,
      overlay,
      selection,
      gateOpen: this.state.unlocks.includes(this.content.chapter.completionUnlock),
    }
  }

  /** Suitability of every tile for what is being placed, cached until the layout changes. */
  private overlayFor(placeable: Placeable, movingId?: number): RenderView['overlay'] {
    const key = `${placeable.kind}:${placeable.defId}:${movingId ?? ''}:${this.state.layoutVersion}`
    if (this.overlayCache?.key === key) return this.overlayCache.overlay
    const overlay: (Rating | 'invalid' | null)[] = []
    for (let y = 0; y < this.state.height; y++) {
      for (let x = 0; x < this.state.width; x++) {
        const terrain = terrainAt(this.state, x, y)
        if (terrain === 'boundary') {
          overlay.push(null)
          continue
        }
        const ok = checkPlacement(this.state, this.content, placeable, x, y, movingId).ok
        if (!ok) overlay.push('invalid')
        else overlay.push(this.suitabilityFor(placeable, x, y, movingId)?.rating ?? null)
      }
    }
    this.overlayCache = { key, overlay }
    return overlay
  }

  renderHost(): RenderHost {
    return {
      content: this.content,
      getState: () => this.state,
      getView: () => this.view(),
      onFrame: (dt) => this.frame(dt),
      onTap: (target) => this.tap(target),
      onHover: (tile) => this.hover(tile),
    }
  }
}
