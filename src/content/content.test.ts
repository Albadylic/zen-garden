import { describe, expect, it } from 'vitest'
import { sceneryTypes, sprites, startingMap, terrainTypes } from '.'

const spriteFiles = Object.keys(import.meta.glob('/public/assets/sprites/*.png')).map((path) =>
  path.replace('/public/assets/', ''),
)

describe('content', () => {
  it('loads the starting map', () => {
    expect(startingMap.width).toBe(16)
    expect(startingMap.height).toBe(16)
  })

  it('only references sprites that are in the manifest', () => {
    const used = [...Object.values(terrainTypes), ...Object.values(sceneryTypes)].map(
      (type) => type.sprite,
    )
    for (const id of used) expect(sprites.sprites, id).toHaveProperty(id)
  })

  it('has a file on disk for every sprite in the manifest', () => {
    expect(spriteFiles.length).toBeGreaterThan(0)
    for (const def of Object.values(sprites.sprites)) expect(spriteFiles).toContain(def.src)
  })
})
