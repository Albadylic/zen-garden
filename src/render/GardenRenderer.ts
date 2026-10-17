import { Application, Graphics } from 'pixi.js'

const BACKGROUND = 0xe8e2d0

// Owns the PixiJS application that draws the garden. It reads game state but
// never changes it.
export class GardenRenderer {
  private app: Application | null = null
  private destroyed = false

  async mount(host: HTMLElement): Promise<void> {
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
    app.stage.addChild(this.createPlaceholder())
    this.centre()
    app.renderer.on('resize', () => this.centre())
  }

  destroy(): void {
    this.destroyed = true
    this.app?.destroy(true, { children: true })
    this.app = null
  }

  // A single isometric tile so there is something to see until the grid lands.
  private createPlaceholder(): Graphics {
    const w = 128
    const h = 64
    return new Graphics()
      .poly([0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0])
      .fill(0xc9b98f)
      .stroke({ color: 0x8a7a55, width: 2 })
  }

  private centre(): void {
    if (!this.app) return
    const tile = this.app.stage.children[0]
    tile?.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
  }
}
