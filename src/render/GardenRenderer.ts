// Draws the garden with PixiJS. It reads game state through a RenderHost and
// reports taps back; it never changes the game itself.

import { Application, Container, Sprite } from 'pixi.js'
import type { Content } from '../core/content'
import type { GameState } from '../core/state'
import { type Overlay, PlaceholderArt } from './art'
import { Camera } from './camera'
import { PointerInput } from './input'
import { openAreas, isTileOpen } from '../core/areas'
import {
  depth,
  gridToWorld,
  mapBounds,
  type Point,
  rectBounds,
  tileCentre,
  unionBounds,
  worldToTile,
} from './iso'

export type Selection =
  | { kind: 'entity'; id: number }
  | { kind: 'creature'; id: number }
  | { kind: 'tile'; x: number; y: number }

export interface PlacementPreview {
  x: number
  y: number
  /** Texture key of the thing being placed. */
  art: string
  valid: boolean
  /** Entity being moved, hidden from its old spot while previewing. */
  movingId?: number
}

export interface RenderView {
  preview: PlacementPreview | null
  /** Suitability overlay per tile index while placing, or null. */
  overlay: (Overlay | null)[] | null
  selection: Selection | null
  gateOpen: boolean
  /** Turns off decorative motion such as bobbing and wing flaps. */
  reduceMotion: boolean
}

/** What lies under a tap: the tile (if inside the garden) and any creature or drop nearest the finger. */
export interface TapTarget {
  tile: Point | null
  /** "mouse", "touch" or "pen". */
  pointerType: string
  creatureId?: number
  dropId?: number
}

export interface RenderHost {
  content: Content
  getState(): GameState
  getView(): RenderView
  /** Changes whenever the game state or UI changes in a way that needs redrawing. */
  getVersion(): number
  /** Called every frame with real elapsed milliseconds. */
  onFrame(dtMs: number): void
  onTap(target: TapTarget): void
  onHover(tile: Point | null): void
}

const BACKGROUND = 0x3f4a33
/** Height flying creatures hover above the ground, in world pixels. */
const FLIGHT_HEIGHT = 34
/** Frame time for ambient animation when nothing else has changed (30 fps). */
const AMBIENT_FRAME_MS = 1000 / 30 - 1
const CREATURE_HIT_PX = 30
/** Creatures are drawn larger than life so they read clearly at garden scale. */
const CREATURE_SCALE = 1.5
const DROP_HIT_PX = 24
/** How much closer a drop must be than a creature to be picked instead. */
const CREATURE_PRIORITY_PX = 14

interface CreatureSprite {
  sprite: Sprite
  x: number
  y: number
  phase: number
}

export class GardenRenderer {
  private app: Application | null = null
  private destroyed = false
  private art!: PlaceholderArt
  private camera!: Camera
  private input: PointerInput | null = null
  private world = new Container()
  private ground = new Container()
  private overlayLayer = new Container()
  private flatObjects = new Container({ sortableChildren: true })
  private markers = new Container()
  private objects = new Container({ sortableChildren: true })
  private terrainSprites: Sprite[] = []
  private terrainKeys: string[] = []
  private overlaySprites: Sprite[] = []
  private entitySprites = new Map<number, Sprite>()
  private dropSprites = new Map<number, Sprite>()
  private creatureSprites = new Map<number, CreatureSprite>()
  private openKey = ''
  private dirty = true
  private drawnVersion = -1
  private sinceDraw = 0
  private hover: Point | null = null
  private hoverSprite = new Sprite()
  private selectSprite = new Sprite()
  private previewSprite = new Sprite()
  private previewOutline = new Sprite()
  private creatureRing = new Sprite()
  private time = 0

  private readonly host: RenderHost

  constructor(host: RenderHost) {
    this.host = host
  }

  async mount(element: HTMLElement): Promise<void> {
    const app = new Application()
    await app.init({
      resizeTo: element,
      background: BACKGROUND,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    })
    // React StrictMode may unmount before init resolves.
    if (this.destroyed) {
      app.destroy(true)
      return
    }
    this.app = app
    app.canvas.dataset.testid = 'garden-canvas'
    element.appendChild(app.canvas)

    const { content } = this.host
    const colours = {
      items: Object.fromEntries(Object.values(content.items).map((i) => [i.id, i.colour])),
      wildlife: Object.fromEntries(Object.values(content.wildlife).map((w) => [w.id, w.colour])),
    }
    this.art = new PlaceholderArt(app.renderer, colours)
    const state = this.host.getState()
    this.camera = new Camera(mapBounds(state.width, state.height))
    this.camera.resize(app.screen.width, app.screen.height)
    this.camera.reset()

    this.markers.addChild(
      this.hoverSprite,
      this.selectSprite,
      this.previewOutline,
      this.creatureRing,
    )
    this.world.addChild(
      this.ground,
      this.overlayLayer,
      this.flatObjects,
      this.markers,
      this.objects,
    )
    app.stage.addChild(this.world)

    this.input = new PointerInput(app.canvas, this.camera, {
      onTap: (p, pointerType) => this.host.onTap(this.hitTest(p, pointerType)),
      onHover: (p) => {
        this.hover = p ? this.tileAt(p) : null
        this.dirty = true
        this.host.onHover(this.hover)
      },
      onCameraChange: () => {
        this.dirty = true
      },
    })
    app.renderer.on('resize', (w: number, h: number) => {
      this.camera.resize(w, h)
      this.dirty = true
    })
    // Draw only when something has changed, to spare phone batteries; the
    // simulation itself still runs every frame.
    app.ticker.remove(app.render, app)
    app.ticker.add((ticker) => this.tick(ticker.deltaMS))
  }

  destroy(): void {
    this.destroyed = true
    this.input?.destroy()
    this.app?.destroy(true, { children: true })
    this.app = null
  }

  /** Screen position (CSS pixels) of a tile centre; used by tests and onboarding. */
  tileToScreen(x: number, y: number): Point | null {
    if (!this.app) return null
    const c = tileCentre(x, y)
    return this.camera.worldToScreen(c.x, c.y)
  }

  /** Screen position of a creature, or null if it is hidden or gone. */
  creatureToScreen(id: number): Point | null {
    if (!this.app) return null
    const entry = this.creatureSprites.get(id)
    if (!entry?.sprite.visible) return null
    return this.camera.worldToScreen(entry.sprite.x, entry.sprite.y)
  }

  /** Centres the camera on a tile. */
  centreOn(x: number, y: number): void {
    if (!this.app) return
    const c = tileCentre(x, y)
    this.camera.x = c.x
    this.camera.y = c.y
    this.camera.panBy(0, 0)
    this.dirty = true
  }

  resetCamera(): void {
    this.camera?.reset()
  }

  private tileAt(screen: Point): Point {
    const w = this.camera.screenToWorld(screen.x, screen.y)
    return worldToTile(w.x, w.y)
  }

  private hitTest(screen: Point, pointerType: string): TapTarget {
    const state = this.host.getState()
    const t = this.tileAt(screen)
    const tile =
      t.x >= 0 && t.y >= 0 && t.x < state.width && t.y < state.height && this.tileOpen(t.x, t.y)
        ? t
        : null
    const target: TapTarget = { tile, pointerType }
    // Whichever creature or drop is nearest the finger wins. Creatures get a
    // head start, since a butterfly feeding on top of fallen seeds is the more
    // deliberate target (and seeds are gathered automatically anyway).
    let best = Infinity
    for (const [id, c] of this.creatureSprites) {
      if (!c.sprite.visible) continue
      const s = this.camera.worldToScreen(c.sprite.x, c.sprite.y)
      const d = Math.hypot(s.x - screen.x, s.y - screen.y)
      if (d < CREATURE_HIT_PX && d - CREATURE_PRIORITY_PX < best) {
        target.creatureId = id
        best = d - CREATURE_PRIORITY_PX
      }
    }
    for (const [id, sprite] of this.dropSprites) {
      const s = this.camera.worldToScreen(sprite.x, sprite.y - 12)
      const d = Math.hypot(s.x - screen.x, s.y - screen.y)
      if (d < DROP_HIT_PX && d < best) {
        target.dropId = id
        delete target.creatureId
        best = d
      }
    }
    return target
  }

  private applyArt(sprite: Sprite, key: string): void {
    if (sprite.label === key) return
    const art = this.art.get(key)
    sprite.texture = art.texture
    sprite.anchor.set(art.anchorX, art.anchorY)
    sprite.label = key
  }

  private tick(dtMs: number): void {
    this.host.onFrame(dtMs)
    this.sinceDraw += dtMs
    const version = this.host.getVersion()
    if (version !== this.drawnVersion) this.dirty = true
    const state = this.host.getState()
    // Creatures moving and items bobbing need gentle animation, which 30 fps covers.
    const animating =
      state.creatures.length > 0 || (state.drops.length > 0 && !this.host.getView().reduceMotion)
    if (!this.dirty && !(animating && this.sinceDraw >= AMBIENT_FRAME_MS)) return
    this.drawnVersion = version
    this.dirty = false
    this.render(this.sinceDraw)
    this.sinceDraw = 0
    this.app?.render()
  }

  private render(dtMs: number): void {
    if (!this.app) return
    this.time += dtMs
    const state = this.host.getState()
    const view = this.host.getView()
    this.syncAreas(state)
    this.syncTerrain(state)
    this.syncOverlay(view)
    this.syncEntities(state, view)
    this.syncDrops(state, view)
    this.syncCreatures(state, view, dtMs)
    this.syncMarkers(view)
    this.world.scale.set(this.camera.zoom)
    this.world.position.set(
      this.camera.viewWidth / 2 - this.camera.x * this.camera.zoom,
      this.camera.viewHeight / 2 - this.camera.y * this.camera.zoom,
    )
  }

  private syncTerrain(state: GameState): void {
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = y * state.width + x
        const terrain = state.terrain[i]!
        const key = `terrain:${terrain}:${(x * 7 + y * 13) % 3}`
        if (this.terrainKeys[i] === key) continue
        this.terrainKeys[i] = key
        let sprite = this.terrainSprites[i]
        if (!sprite) {
          sprite = new Sprite()
          const c = tileCentre(x, y)
          sprite.position.set(c.x, c.y)
          this.terrainSprites[i] = sprite
        }
        this.applyArt(sprite, key)
        sprite.visible = this.tileOpen(x, y)
        // Walls stand up, so they sort with objects; everything else is ground.
        sprite.removeFromParent()
        if (terrain === 'boundary') {
          sprite.zIndex = depth(x + 0.5, y + 0.5) * 10
          this.objects.addChild(sprite)
        } else {
          this.ground.addChild(sprite)
        }
      }
    }
  }

  private syncOverlay(view: RenderView): void {
    const overlay = view.overlay
    this.overlayLayer.visible = overlay !== null
    if (!overlay) return
    const state = this.host.getState()
    overlay.forEach((value, i) => {
      let sprite = this.overlaySprites[i]
      if (!sprite) {
        sprite = new Sprite()
        const c = tileCentre(i % state.width, Math.floor(i / state.width))
        sprite.position.set(c.x, c.y)
        this.overlaySprites[i] = sprite
        this.overlayLayer.addChild(sprite)
      }
      sprite.visible = value !== null
      if (value) this.applyArt(sprite, `overlay:${value}`)
    })
  }

  private entityArt(state: GameState, view: RenderView, id: number): string | null {
    const e = state.entities.find((en) => en.id === id)
    if (!e) return null
    if (e.kind === 'plant') return `plant:${e.defId}:${e.stage}`
    if (e.kind === 'structure') {
      if (this.host.content.structures[e.defId]?.feeder) {
        return `structure:${e.defId}:${(e.filledMs ?? 0) > 0 ? 'full' : 'empty'}`
      }
      const level = this.host.content.structures[e.defId]?.levels[e.level]
      return `structure:${e.defId}:${level?.art ?? e.level}`
    }
    if (e.defId === 'grove-gate')
      return `decoration:grove-gate:${view.gateOpen ? 'open' : 'closed'}`
    return `decoration:${e.defId}`
  }

  private syncEntities(state: GameState, view: RenderView): void {
    const seen = new Set<number>()
    for (const e of state.entities) {
      seen.add(e.id)
      let sprite = this.entitySprites.get(e.id)
      if (!sprite) {
        sprite = new Sprite()
        this.entitySprites.set(e.id, sprite)
      }
      const key = this.entityArt(state, view, e.id)!
      this.applyArt(sprite, key)
      const flat = e.kind === 'decoration' && this.host.content.decorations[e.defId]?.flat
      const parent = flat ? this.flatObjects : this.objects
      if (sprite.parent !== parent) parent.addChild(sprite)
      const c = tileCentre(e.x, e.y)
      sprite.position.set(c.x, c.y)
      sprite.zIndex = depth(e.x + 0.5, e.y + 0.5) * 10 + 1
      sprite.visible = view.preview?.movingId !== e.id && this.tileOpen(e.x, e.y)
      sprite.alpha = 1
    }
    for (const [id, sprite] of this.entitySprites) {
      if (!seen.has(id)) {
        sprite.destroy()
        this.entitySprites.delete(id)
      }
    }
  }

  private syncDrops(state: GameState, view: RenderView): void {
    const seen = new Set<number>()
    // Spread drops evenly around their tile so each can be tapped.
    const totals = new Map<string, number>()
    for (const d of state.drops) totals.set(`${d.x},${d.y}`, (totals.get(`${d.x},${d.y}`) ?? 0) + 1)
    const perTile = new Map<string, number>()
    for (const d of state.drops) {
      seen.add(d.id)
      let sprite = this.dropSprites.get(d.id)
      if (!sprite) {
        sprite = new Sprite()
        this.applyArt(sprite, `drop:${d.itemId}`)
        this.dropSprites.set(d.id, sprite)
        this.objects.addChild(sprite)
      }
      const tileKey = `${d.x},${d.y}`
      const n = perTile.get(tileKey) ?? 0
      perTile.set(tileKey, n + 1)
      const angle = (n / Math.max(3, totals.get(tileKey) ?? 1)) * Math.PI * 2 + Math.PI / 4
      const gx = d.x + 0.5 + Math.cos(angle) * 0.4
      const gy = d.y + 0.5 + Math.sin(angle) * 0.4
      const w = gridToWorld(gx, gy)
      const bob = view.reduceMotion ? 0 : Math.sin(this.time / 500 + d.id) * 2
      sprite.position.set(w.x, w.y + bob)
      sprite.zIndex = depth(gx, gy) * 10 + 2
    }
    for (const [id, sprite] of this.dropSprites) {
      if (!seen.has(id)) {
        sprite.destroy()
        this.dropSprites.delete(id)
      }
    }
  }

  private syncCreatures(state: GameState, view: RenderView, dtMs: number): void {
    const seen = new Set<number>()
    const follow = Math.min(1, dtMs / 120)
    for (const c of state.creatures) {
      seen.add(c.id)
      let entry = this.creatureSprites.get(c.id)
      if (!entry) {
        entry = { sprite: new Sprite(), x: c.x, y: c.y, phase: (c.id * 0.37) % 1 }
        this.creatureSprites.set(c.id, entry)
        this.objects.addChild(entry.sprite)
      }
      // Ease towards the simulated position so steps look like smooth motion.
      entry.x += (c.x - entry.x) * follow
      entry.y += (c.y - entry.y) * follow
      const def = this.host.content.wildlife[c.speciesId]
      const flying = def?.movement === 'flying'
      const resting =
        c.activity === 'feeding' || c.activity === 'resting' || c.activity === 'perching'
      const flapRate = c.speciesId === 'bumblebee' ? 60 : 160
      const frame = view.reduceMotion
        ? 0
        : resting
          ? Math.floor(this.time / 900 + entry.phase * 3) % 4 === 0
            ? 1
            : 0
          : Math.floor(this.time / flapRate + entry.phase * 2) % 2
      this.applyArt(entry.sprite, `creature:${c.speciesId}:${frame}`)
      const w = gridToWorld(entry.x, entry.y)
      const height =
        flying && !resting
          ? FLIGHT_HEIGHT +
            (view.reduceMotion ? 0 : Math.sin(this.time / 300 + entry.phase * 6) * 6)
          : flying
            ? 14
            : 0
      entry.sprite.position.set(w.x, w.y - height)
      entry.sprite.zIndex = depth(entry.x, entry.y) * 10 + (flying ? 5 : 3)
      entry.sprite.visible = !c.hidden
      entry.sprite.scale.set((c.targetX < c.x ? -1 : 1) * CREATURE_SCALE, CREATURE_SCALE)
    }
    for (const [id, entry] of this.creatureSprites) {
      if (!seen.has(id)) {
        entry.sprite.destroy()
        this.creatureSprites.delete(id)
      }
    }
  }

  private syncMarkers(view: RenderView): void {
    const state = this.host.getState()
    const placeTile = (sprite: Sprite, key: string, x: number, y: number) => {
      this.applyArt(sprite, key)
      const c = tileCentre(x, y)
      sprite.position.set(c.x, c.y)
      sprite.visible = true
    }
    this.hoverSprite.visible = false
    if (
      this.hover &&
      !view.preview &&
      this.hover.x >= 0 &&
      this.hover.y >= 0 &&
      this.hover.x < state.width &&
      this.hover.y < state.height
    ) {
      placeTile(this.hoverSprite, 'tile:hover', this.hover.x, this.hover.y)
    }
    this.selectSprite.visible = false
    const sel = view.selection
    if (sel?.kind === 'tile') placeTile(this.selectSprite, 'tile:select', sel.x, sel.y)
    if (sel?.kind === 'entity') {
      const e = state.entities.find((en) => en.id === sel.id)
      if (e) placeTile(this.selectSprite, 'tile:select', e.x, e.y)
    }
    // A ring on the ground under the selected creature, following it.
    this.creatureRing.visible = false
    if (sel?.kind === 'creature') {
      const entry = this.creatureSprites.get(sel.id)
      if (entry?.sprite.visible) {
        this.applyArt(this.creatureRing, 'tile:creature')
        const w = gridToWorld(entry.x, entry.y)
        this.creatureRing.position.set(w.x, w.y)
        this.creatureRing.visible = true
      }
    }
    const preview = view.preview
    this.previewOutline.visible = false
    this.previewSprite.visible = false
    if (preview) {
      placeTile(
        this.previewOutline,
        preview.valid ? 'tile:valid' : 'tile:invalid',
        preview.x,
        preview.y,
      )
      if (!this.previewSprite.parent) this.objects.addChild(this.previewSprite)
      this.applyArt(this.previewSprite, preview.art)
      const c = tileCentre(preview.x, preview.y)
      this.previewSprite.position.set(c.x, c.y)
      this.previewSprite.zIndex = depth(preview.x + 0.5, preview.y + 0.5) * 10 + 4
      this.previewSprite.alpha = preview.valid ? 0.75 : 0.4
      this.previewSprite.tint = preview.valid ? 0xffffff : 0xff9a8a
      this.previewSprite.visible = true
    }
  }

  /** Fits the camera to the open areas, and redraws terrain when an area opens. */
  private syncAreas(state: GameState): void {
    const open = openAreas(state, this.host.content)
    const key = open.map((a) => a.id).join(',')
    if (key === this.openKey) return
    const first = this.openKey === ''
    this.openKey = key
    this.terrainKeys = []
    this.camera.setBounds(
      unionBounds(open.map((a) => rectBounds(a.bounds.x, a.bounds.y, a.bounds.w, a.bounds.h))),
    )
    if (first) {
      this.camera.reset()
      return
    }
    // A newly opened area: turn the camera towards it.
    const area = open.at(-1)!
    this.centreOn(
      Math.floor(area.bounds.x + area.bounds.w / 2),
      Math.floor(area.bounds.y + area.bounds.h / 2),
    )
  }

  private tileOpen(x: number, y: number): boolean {
    return isTileOpen(this.host.getState(), this.host.content, x, y)
  }
}
