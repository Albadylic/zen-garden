// The garden layout: one terrain type per tile, plus scenery objects placed on
// tiles. Maps are authored as JSON and validated here before use.

export interface MapObject {
  kind: string
  x: number
  y: number
}

export interface GardenMap {
  id: string
  name: string
  width: number
  height: number
  /** Terrain id per tile, row by row (index = y * width + x). */
  terrain: string[]
  objects: MapObject[]
}

/** Ids the map is allowed to reference, taken from the content files. */
export interface MapVocabulary {
  terrain: ReadonlySet<string>
  objects: ReadonlySet<string>
}

interface RawMap {
  id: string
  name: string
  legend: Record<string, string>
  rows: string[]
  objects: MapObject[]
}

export function parseGardenMap(data: unknown, vocabulary: MapVocabulary): GardenMap {
  const raw = data as RawMap
  const fail = (message: string): never => {
    throw new Error(`Invalid garden map "${raw?.id ?? '?'}": ${message}`)
  }

  if (typeof raw?.id !== 'string' || typeof raw.name !== 'string') fail('missing id or name')
  if (!Array.isArray(raw.rows) || raw.rows.length === 0) fail('rows must be a non-empty array')
  if (typeof raw.legend !== 'object' || raw.legend === null) fail('missing legend')
  if (!Array.isArray(raw.objects)) fail('objects must be an array')

  for (const [symbol, terrain] of Object.entries(raw.legend)) {
    if (!vocabulary.terrain.has(terrain))
      fail(`legend "${symbol}" uses unknown terrain "${terrain}"`)
  }

  const height = raw.rows.length
  const width = raw.rows[0].length
  const terrain: string[] = []
  raw.rows.forEach((row, y) => {
    if (row.length !== width) fail(`row ${y} has ${row.length} tiles, expected ${width}`)
    for (const symbol of row) {
      terrain.push(
        raw.legend[symbol] ?? fail(`row ${y} uses "${symbol}", which is not in the legend`),
      )
    }
  })

  const objects = raw.objects.map((object, i) => {
    const { kind, x, y } = object
    if (!vocabulary.objects.has(kind)) fail(`object ${i} has unknown kind "${kind}"`)
    const inside = (n: number, size: number) => Number.isInteger(n) && n >= 0 && n < size
    if (!inside(x, width) || !inside(y, height)) {
      fail(`object ${i} (${kind}) is outside the map at (${x}, ${y})`)
    }
    return { kind, x, y }
  })

  return { id: raw.id, name: raw.name, width, height, terrain, objects }
}

export function terrainAt(map: GardenMap, x: number, y: number): string {
  return map.terrain[y * map.width + x]
}
