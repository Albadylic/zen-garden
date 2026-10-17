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
import { isTileOpen, openOvergrowth, visitGarden } from '../core/gardens'
import { entityAt, entityById, forEachTile, terrainAt, tileKey } from '../core/grid'
import {
  type ActionResult,
  buildRecipe,
  craftItem,
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
import { markRead, observe, recordJournal } from '../core/journal'
import { fillFeeder } from '../core/feeders'
import { harvest, plant, water } from '../core/plants'
import { chooseApproach, completeStage } from '../core/projects'
import { clearOvergrowth, collectAll, collectDrop } from '../core/resources'
import { catchUp, hasNews, type Recap } from '../core/offline'
import { currentSeason } from '../core/seasons'
import { advance } from '../core/simulation'
import type { GameState } from '../core/state'
import type { Point } from '../render/iso'
import type { Flyout, RenderHost, RenderView, Selection, TapTarget } from '../render/GardenRenderer'
import { createStore, type Store } from './store'
import { loadReduceMotion, saveReduceMotion } from './preferences'
import { formatItems } from './text'

export type PlaceSource =
  | { kind: 'seed'; plantId: string }
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'move'; entityId: number }

export type Mode =
  { type: 'idle' } | { type: 'place'; source: PlaceSource; tile: Point | null } | { type: 'clear' }

export type Panel =
  null | 'plants' | 'build' | 'restore' | 'inventory' | 'journal' | 'goals' | 'gardens' | 'settings'

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
  chapterCelebration: string | null
  /** Whether the suggestion card is expanded. */
  suggestionsOpen: boolean
  /** Summary shown after returning from time away. */
  recap: Recap | null
  /** First-visit introduction to the garden. */
  welcome: boolean
}

export interface PlacementInfo {
  name: string
  placeable: Placeable
  tile: Point | null
  check: Check | null
  suitability: Suitability | null
  cost: Record<string, number>
}

/** "the Bamboo Grove", "Living Waters": a chapter's garden named mid-sentence. */
function gardenTitle(content: Content, chapterId: string): string {
  const title = content.chapters.find((c) => c.id === chapterId)?.title ?? 'The new garden'
  return title.replace(/^The /, 'the ')
}

/** How often (ms of real time) the UI is told that game state has moved on. */
const UI_REFRESH_MS = 500
const TOAST_MS = 4000
/** How long a gathered item's icon stays on screen. */
const FLYOUT_MS = 1100
/** The most icons one gathering shows; a large haul is summed into fewer icons. */
const FLYOUT_LIMIT = 8

type FlyoutSource = { x: number; y: number; itemId: string; amount: number }
type ActiveFlyout = Omit<Flyout, 't'> & { born: number }
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
  private flyoutId = 0
  private flyouts: ActiveFlyout[] = []
  private focus: RenderView['focus'] = null
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
      chapterCelebration: null,
      suggestionsOpen: true,
      recap: null,
      welcome: false,
    })
    // Any UI change (mode, selection, panels) may change what the garden shows.
    this.ui.subscribe(() => this.renderVersion++)
    this.reduceMotion = loadReduceMotion()
  }

  /** Turns off decorative motion; remembered on this device. */
  reduceMotion: boolean
  private renderVersion = 0

  setReduceMotion(value: boolean): void {
    this.reduceMotion = value
    saveReduceMotion(value)
    this.renderVersion++
    this.notify()
  }

  // --- Subscriptions for React --------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = (): number => this.version

  private notify(): void {
    this.version++
    this.renderVersion++
    this.sinceRefresh = 0
    for (const listener of this.listeners) listener()
  }

  // --- Simulation loop ------------------------------------------------------

  /**
   * Catches up on time the player was away (capped), then shows a recap if
   * anything worth mentioning happened. The recap replaces individual toasts.
   */
  returnAfter(awayMs: number): Recap {
    const { events, recap } = catchUp(this.state, this.content, awayMs)
    this.handleEvents(events, { quiet: true })
    this.ui.set({ recap: hasNews(recap) ? recap : null, mode: { type: 'idle' } })
    this.notify()
    return recap
  }

  showWelcome(): void {
    this.ui.set({ welcome: true })
  }

  dismissWelcome(): void {
    this.ui.set({ welcome: false })
  }

  dismissRecap(gather: boolean): void {
    if (gather && this.state.drops.length > 0) this.collectAll()
    this.ui.set({ recap: null })
  }

  /** Replaces the whole garden, for loading, importing or starting over. */
  replaceState(state: GameState): void {
    this.state = state
    this.undoStack = []
    this.overlayCache = null
    this.flyouts = []
    this.ui.set({
      mode: { type: 'idle' },
      selection: null,
      panel: null,
      toasts: [],
      canUndo: false,
      chapterCelebration: null,
      recap: null,
    })
    this.notify()
  }

  /** Advances the game by real elapsed time. Called every animation frame. */
  frame(realDtMs: number): void {
    // Long gaps (a backgrounded tab) are handled by catch-up, not by one huge frame.
    const dt = Math.min(realDtMs, 1000)
    this.realTime += dt
    const events = advance(this.state, this.content, dt * this.timeScale)
    if (events.length > 0) this.handleEvents(events)
    this.expireToasts()
    this.expireFlyouts()
    this.sinceRefresh += dt
    if (events.length > 0 || this.sinceRefresh >= UI_REFRESH_MS) this.notify()
  }

  /**
   * Turns simulation and action events into player-facing feedback. Gathering
   * shows as small item icons in the garden, the journal waits behind a badge,
   * and text is kept for moments worth pausing on.
   */
  private handleEvents(events: GameEvent[], { quiet = false } = {}): void {
    for (const e of events) {
      // While catching up, only lasting moments are surfaced; the recap covers the rest.
      if (quiet && e.type !== 'chapterComplete') continue
      switch (e.type) {
        case 'collected':
          this.addFlyouts(e.from)
          break
        case 'cleared':
          this.addFlyouts(
            Object.entries(e.items).map(([itemId, amount]) => ({ x: e.x, y: e.y, itemId, amount })),
          )
          break
        case 'harvested': {
          const at = entityById(this.state, e.entityId)
          if (at) {
            this.addFlyouts(
              Object.entries(e.items).map(([itemId, amount]) => ({
                x: at.x,
                y: at.y,
                itemId,
                amount,
              })),
            )
          }
          break
        }
        case 'watered':
          if (e.count > 1) this.toast(`Watered ${e.count} plants`)
          break
        case 'stageComplete':
          this.toast(`Restoration: ${e.title}`, 'milestone')
          break
        case 'approachComplete':
          this.toast(`Approach complete: ${e.title}`, 'milestone')
          break
        case 'gift':
          this.toast(
            `Waiting in ${gardenTitle(this.content, e.chapterId)}: ${formatItems(this.content, e.items)}`,
            'milestone',
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
          this.ui.set({ chapterCelebration: e.chapterId, panel: null, mode: { type: 'idle' } })
          break
      }
    }
  }

  // --- Item icons -------------------------------------------------------------

  /** Shows gathered items as icons rising from where they were found. */
  private addFlyouts(sources: FlyoutSource[]): void {
    if (sources.length === 0) return
    // One icon per item per spot, with the amount summed.
    const grouped = new Map<string, FlyoutSource>()
    for (const s of sources) {
      const key = `${s.x},${s.y},${s.itemId}`
      const g = grouped.get(key)
      if (g) g.amount += s.amount
      else grouped.set(key, { ...s })
    }
    let list = [...grouped.values()]
    // A large haul from many spots sums into one icon per item at the first spot.
    if (list.length > FLYOUT_LIMIT) {
      const byItem = new Map<string, FlyoutSource>()
      for (const s of list) {
        const g = byItem.get(s.itemId)
        if (g) g.amount += s.amount
        else byItem.set(s.itemId, { ...s })
      }
      list = [...byItem.values()].slice(0, FLYOUT_LIMIT)
    }
    const perSpot = new Map<string, number>()
    for (const s of list) {
      const spot = `${s.x},${s.y}`
      const index = perSpot.get(spot) ?? 0
      perSpot.set(spot, index + 1)
      this.flyouts.push({ ...s, id: ++this.flyoutId, index, born: this.realTime })
    }
    this.renderVersion++
  }

  private expireFlyouts(): void {
    if (this.flyouts.length === 0) return
    this.flyouts = this.flyouts.filter((f) => this.realTime - f.born < FLYOUT_MS)
    // Fading icons need redrawing every frame they are on screen.
    this.renderVersion++
  }

  // --- Travelling between gardens -------------------------------------------

  /** Turns the camera to the middle of a garden and closes the panel. */
  visitGarden(gardenId: string): void {
    const g = this.content.world.gardens.find((d) => d.id === gardenId)
    if (!g) return
    const x = Math.floor(g.bounds.x + g.bounds.w / 2)
    const y = Math.floor(g.bounds.y + g.bounds.h / 2)
    this.focus = { x, y, seq: (this.focus?.seq ?? 0) + 1 }
    this.ui.set({ panel: null, selection: null })
    this.renderVersion++
  }

  // --- Journal ----------------------------------------------------------------

  /** Marks journal entries as read once the player has seen them. */
  markJournalRead(keys: string[]): void {
    if (markRead(this.state, this.content, keys)) this.notify()
  }

  dismissCelebration(): void {
    this.ui.set({ chapterCelebration: null })
  }

  toggleSuggestions(): void {
    this.ui.set((s) => ({ suggestionsOpen: !s.suggestionsOpen }))
  }

  // --- Gathering and restoring ---------------------------------------------

  collectAll(): void {
    this.applyResult(collectAll(this.state))
  }

  chooseApproach(projectId: string, approachId: string): void {
    this.applyResult(chooseApproach(this.state, this.content, projectId, approachId))
  }

  completeStage(projectId: string): void {
    this.applyResult(completeStage(this.state, this.content, projectId))
  }

  startClearing(): void {
    this.ui.set({ mode: { type: 'clear' }, panel: null, selection: null })
  }

  clearTile(x: number, y: number): void {
    const result = clearOvergrowth(this.state, this.content, x, y)
    // Tapping cleared ground while restoring is harmless, so stay quiet about it.
    if (!result.ok && this.ui.get().mode.type === 'clear') return
    if (!this.applyResult(result) || this.ui.get().mode.type === 'clear') return
    // Clearing one patch from its own panel carries on into clearing mode, so the
    // next tangle is a single tap away. Done (or Escape) ends it.
    if (openOvergrowth(this.state, this.content) > 0) this.startClearing()
    else if (this.ui.get().selection?.kind === 'tile') this.select(null)
  }

  // --- Toasts ---------------------------------------------------------------

  toast(text: string, tone: Toast['tone'] = 'info'): void {
    const toast: Toast = { id: ++this.toastId, text, tone, expiresAt: this.realTime + TOAST_MS }
    // One line at a time: a new message replaces the one showing.
    this.ui.set({ toasts: [toast] })
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
    // Looking around a newly opened area counts towards exploring it.
    if (selection?.kind === 'tile' || selection?.kind === 'entity') {
      const at = selection.kind === 'tile' ? selection : entityById(this.state, selection.id)
      if (at && visitGarden(this.state, this.content, at.x, at.y)) this.notify()
    }
    // Looking closely at something is how it first enters the journal.
    const key = this.journalKeyFor(selection)
    if (key) {
      const events = observe(this.state, this.content, key)
      if (events.length > 0) {
        this.handleEvents(events)
        this.notify()
      }
    }
  }

  private journalKeyFor(selection: Selection | null): string | null {
    if (selection?.kind === 'creature') {
      const c = this.state.creatures.find((cr) => cr.id === selection.id)
      return c ? `wildlife:${c.speciesId}` : null
    }
    if (selection?.kind === 'entity') {
      const e = entityById(this.state, selection.id)
      if (e?.kind === 'plant') return `plant:${e.defId}`
      if (e?.kind === 'structure') return `structure:${e.defId}`
    }
    return null
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
      return recipe && recipe.output.kind !== 'item'
        ? { kind: recipe.output.kind, defId: recipe.output.id }
        : null
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

  craft(recipeId: string): void {
    this.applyResult(craftItem(this.state, this.content, recipeId))
  }

  harvestSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.applyResult(harvest(this.state, this.content, sel.id))
  }

  fillSelected(): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.applyResult(fillFeeder(this.state, this.content, sel.id))
  }

  upgradeSelected(toLevel?: number): void {
    const sel = this.ui.get().selection
    if (sel?.kind !== 'entity') return
    this.applyResult(upgradeStructure(this.state, this.content, sel.id, toLevel))
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
    if (result.events.length > 0) {
      this.handleEvents([
        ...result.events,
        ...recordJournal(this.state, this.content, result.events),
      ])
    }
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
      const clearable = new Map<string, Rating | 'invalid'>()
      forEachTile(this.state, (x, y, t) => {
        if (t === 'overgrown' && isTileOpen(this.state, this.content, x, y))
          clearable.set(tileKey(x, y), 'good')
      })
      overlay = clearable
    }
    return {
      preview,
      overlay,
      selection,
      reduceMotion: this.reduceMotion,
      focus: this.focus,
      season: currentSeason(this.state),
      flyouts: this.flyouts.map(({ born, ...f }) => ({
        ...f,
        t: Math.min(1, (this.realTime - born) / FLYOUT_MS),
      })),
    }
  }

  /** Suitability of every tile for what is being placed, cached until the layout changes. */
  private overlayFor(placeable: Placeable, movingId?: number): RenderView['overlay'] {
    const key = `${placeable.kind}:${placeable.defId}:${movingId ?? ''}:${this.state.layoutVersion}`
    if (this.overlayCache?.key === key) return this.overlayCache.overlay
    const overlay = new Map<string, Rating | 'invalid'>()
    forEachTile(this.state, (x, y, terrain) => {
      if (terrain === 'boundary' || !isTileOpen(this.state, this.content, x, y)) return
      if (!checkPlacement(this.state, this.content, placeable, x, y, movingId).ok) {
        overlay.set(tileKey(x, y), 'invalid')
        return
      }
      const rating = this.suitabilityFor(placeable, x, y, movingId)?.rating
      if (rating) overlay.set(tileKey(x, y), rating)
    })
    this.overlayCache = { key, overlay }
    return overlay
  }

  renderHost(): RenderHost {
    return {
      content: this.content,
      getState: () => this.state,
      getView: () => this.view(),
      getVersion: () => this.renderVersion,
      onFrame: (dt) => this.frame(dt),
      onTap: (target) => this.tap(target),
      onHover: (tile) => this.hover(tile),
    }
  }
}
