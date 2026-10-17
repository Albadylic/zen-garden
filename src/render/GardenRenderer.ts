import { Application, Container } from 'pixi.js'
import { sceneryTypes, sprites, terrainTypes } from '../content'
import { terrainAt, type GardenMap } from '../core/garden-map'
import { depth, gridToScreen } from '../core/iso'
import { SpriteLibrary } from './SpriteLibrary'

const BACKGROUND = 0xe8e2d0
/** Space kept around the garden when fitting it to the screen, in screen pixels. */
const MARGIN = 24

// Owns the PixiJS application that draws the garden. It reads game state but
// never changes it.
export class GardenRenderer {
  private app: Application | null = null
  private destroyed = false
  private readonly world = new Container()

  async mount(host: HTMLElement, map: GardenMap): Promise<void> {
    const app = new Application()
    await app.init({
      resizeTo: host,
      background: BACKGROUND,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    })

    // React StrictMode may unmount before init resolves.
    if (this.destroyed) {
      app.destroy(true)
      return
    }

    this.app = app
    app.canvas.dataset.testid = 'garden-canvas'
    host.appendChild(app.canvas)

    const library = new SpriteLibrary(sprites)
    await library.load(app.renderer)
    if (this.destroyed) return

    this.build(map, library)
    app.stage.addChild(this.world)
    this.fit()
    app.renderer.on('resize', () => this.fit())
    // Lets end-to-end tests wait until the garden is drawn.
    app.canvas.dataset.ready = 'true'
  }

  destroy(): void {
    this.destroyed = true
    this.app?.destroy(true, { children: true })
    this.app = null
  }

  private build(map: GardenMap, library: SpriteLibrary): void {
    // Terrain is flat, so it all sits beneath the scenery in one layer.
    const terrain = new Container()
    const scenery = new Container({ sortableChildren: true })

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = library.create(terrainTypes[terrainAt(map, x, y)].sprite)
        tile.position.copyFrom(gridToScreen(x, y))
        tile.zIndex = depth(x, y)
        terrain.addChild(tile)
      }
    }
    terrain.sortChildren()

    for (const object of map.objects) {
      const sprite = library.create(sceneryTypes[object.kind].sprite)
      sprite.position.copyFrom(gridToScreen(object.x, object.y))
      sprite.zIndex = depth(object.x, object.y)
      scenery.addChild(sprite)
    }

    this.world.addChild(terrain, scenery)
  }

  // Scales the garden down to fit the screen (never up) and centres it.
  // Replaced by a proper camera once pan and zoom land.
  private fit(): void {
    if (!this.app) return
    const { width, height } = this.app.screen
    this.world.scale.set(1)
    const bounds = this.world.getLocalBounds()
    const scale = Math.min(
      1,
      (width - MARGIN * 2) / bounds.width,
      (height - MARGIN * 2) / bounds.height,
    )
    this.world.scale.set(scale)
    this.world.position.set(
      width / 2 - (bounds.x + bounds.width / 2) * scale,
      height / 2 - (bounds.y + bounds.height / 2) * scale,
    )
  }
}
