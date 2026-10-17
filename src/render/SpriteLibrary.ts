import { Assets, Graphics, Sprite, Texture, type Renderer } from 'pixi.js'
import type { SpriteManifest } from '../content'
import { TILE_HEIGHT, TILE_WIDTH } from '../core/iso'

// Loads the textures listed in the sprite manifest and hands out sprites by
// id. A missing or broken image falls back to a drawn placeholder so the
// garden still renders while art is incomplete.
export class SpriteLibrary {
  private readonly textures = new Map<string, Texture>()
  private readonly warned = new Set<string>()
  private readonly manifest: SpriteManifest
  private fallback: Texture = Texture.EMPTY

  constructor(manifest: SpriteManifest) {
    this.manifest = manifest
  }

  async load(renderer: Renderer): Promise<void> {
    const placeholder = new Graphics()
      .poly([0, -TILE_HEIGHT / 4, TILE_WIDTH / 4, 0, 0, TILE_HEIGHT / 4, -TILE_WIDTH / 4, 0])
      .fill(0xc9b98f)
      .stroke({ color: 0x8a7a55, width: 2 })
    this.fallback = renderer.generateTexture(placeholder)
    placeholder.destroy()

    const base = `${import.meta.env.BASE_URL}${this.manifest.basePath}`
    const entries = Object.entries(this.manifest.sprites)
    const results = await Promise.allSettled(
      entries.map(([, def]) => Assets.load<Texture>(`${base}${def.src}`)),
    )
    results.forEach((result, i) => {
      const [id] = entries[i]
      if (result.status === 'fulfilled') this.textures.set(id, result.value)
      else this.warn(id, `failed to load: ${String(result.reason)}`)
    })
  }

  create(id: string): Sprite {
    const texture = this.textures.get(id)
    if (!texture) {
      if (!(id in this.manifest.sprites)) this.warn(id, 'not in the sprite manifest')
      const sprite = new Sprite(this.fallback)
      sprite.anchor.set(0.5)
      return sprite
    }
    const sprite = new Sprite(texture)
    const [ax, ay] = this.manifest.sprites[id].anchor
    sprite.anchor.set(ax, ay)
    return sprite
  }

  private warn(id: string, message: string): void {
    if (this.warned.has(id)) return
    this.warned.add(id)
    console.warn(`Sprite "${id}" ${message}; using a placeholder.`)
  }
}
