// Bundled game content. Everything the game draws or simulates is described
// in these JSON files so it can be changed without touching code.

import { parseGardenMap, type GardenMap } from '../core/garden-map'
import forgottenGarden from './maps/forgotten-garden.json'
import scenery from './scenery.json'
import spriteManifest from './sprites.json'
import terrain from './terrain.json'

export interface SpriteDef {
  /** Path relative to the manifest's basePath. */
  src: string
  /** Point on the image placed on the tile centre, as fractions of width and height. */
  anchor: number[]
}

export interface SpriteManifest {
  basePath: string
  sprites: Record<string, SpriteDef>
}

export interface Drawable {
  name: string
  sprite: string
}

export const sprites: SpriteManifest = spriteManifest
export const terrainTypes: Record<string, Drawable> = terrain
export const sceneryTypes: Record<string, Drawable> = scenery

export const startingMap: GardenMap = parseGardenMap(forgottenGarden, {
  terrain: new Set(Object.keys(terrainTypes)),
  objects: new Set(Object.keys(sceneryTypes)),
})
