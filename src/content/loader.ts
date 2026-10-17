// Validates raw JSON content and assembles it into the Content the simulation
// uses. Reports every problem at once, with the file and entry it came from.

import { z } from 'zod'
import type { Content, FixedObject, MapDef, Terrain } from '../core/content'
import {
  chapterSchema,
  decorationSchema,
  itemSchema,
  mapFileSchema,
  plantSchema,
  recipeSchema,
  structureSchema,
  wildlifeSchema,
} from './schema'

export interface RawContent {
  items: unknown
  plants: unknown
  structures: unknown
  decorations: unknown
  recipes: unknown
  wildlife: unknown
  chapter: unknown
  map: unknown
}

export class ContentError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`Invalid game content:\n- ${problems.join('\n- ')}`)
    this.name = 'ContentError'
    this.problems = problems
  }
}

function parse<T>(
  schema: z.ZodType<T>,
  value: unknown,
  file: string,
  problems: string[],
): T | undefined {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  }
  return undefined
}

function byId<T extends { id: string }>(list: T[] | undefined, file: string, problems: string[]) {
  const record: Record<string, T> = {}
  for (const entry of list ?? []) {
    if (record[entry.id]) problems.push(`${file}: duplicate id "${entry.id}"`)
    record[entry.id] = entry
  }
  return record
}

/** Tiles next to the garden wall get a little shade from it. */
function wallShade(terrain: Terrain[], width: number, height: number): number[] {
  return terrain.map((t, i) => {
    if (t === 'boundary') return 0
    const x = i % width
    const y = Math.floor(i / width)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < width &&
          ny < height &&
          terrain[ny * width + nx] === 'boundary'
        ) {
          return 0.1
        }
      }
    }
    return 0
  })
}

function buildMap(raw: unknown, problems: string[]): MapDef | undefined {
  const file = parse(mapFileSchema, raw, 'map.json', problems)
  if (!file) return undefined
  const height = file.rows.length
  const width = file.rows[0]?.length ?? 0
  const terrain: Terrain[] = []
  const fixed: FixedObject[] = []
  file.rows.forEach((row, y) => {
    if (row.length !== width)
      problems.push(`map.json: row ${y} has ${row.length} tiles, expected ${width}`)
    ;[...row].forEach((char, x) => {
      const entry = file.legend[char]
      if (!entry) {
        problems.push(`map.json: unknown tile "${char}" at ${x},${y}`)
        terrain.push('grass')
        return
      }
      terrain.push(entry.terrain)
      if (entry.fixed) fixed.push({ ...entry.fixed, x, y })
    })
  })
  return {
    id: file.id,
    name: file.name,
    width,
    height,
    terrain,
    baseShade: wallShade(terrain, width, height),
    fixed,
    startingInventory: file.startingInventory,
    clearing: file.clearing,
  }
}

export function loadContent(raw: RawContent): Content {
  const problems: string[] = []
  const items = byId(
    parse(z.array(itemSchema), raw.items, 'items.json', problems),
    'items.json',
    problems,
  )
  const plants = byId(
    parse(z.array(plantSchema), raw.plants, 'plants.json', problems),
    'plants.json',
    problems,
  )
  const structures = byId(
    parse(z.array(structureSchema), raw.structures, 'structures.json', problems),
    'structures.json',
    problems,
  )
  const decorations = byId(
    parse(z.array(decorationSchema), raw.decorations, 'decorations.json', problems),
    'decorations.json',
    problems,
  )
  const recipes = byId(
    parse(z.array(recipeSchema), raw.recipes, 'recipes.json', problems),
    'recipes.json',
    problems,
  )
  const wildlife = byId(
    parse(z.array(wildlifeSchema), raw.wildlife, 'wildlife.json', problems),
    'wildlife.json',
    problems,
  )
  const chapter = parse(chapterSchema, raw.chapter, 'chapter.json', problems)
  const map = buildMap(raw.map, problems)

  // Cross-references between files.
  const needItem = (itemId: string, where: string) => {
    if (!items[itemId]) problems.push(`${where}: unknown item "${itemId}"`)
  }
  for (const plant of Object.values(plants)) {
    if (plant.seedItem) needItem(plant.seedItem, `plants.json ${plant.id}.seedItem`)
    for (const p of plant.produces) needItem(p.item, `plants.json ${plant.id}.produces`)
    if (plant.flowerStage >= plant.stages.length) {
      problems.push(`plants.json ${plant.id}: flowerStage is beyond its last stage`)
    }
  }
  for (const s of Object.values(structures)) {
    s.levels.forEach((level, i) => {
      for (const itemId of Object.keys(level.upgradeCost ?? {}))
        needItem(itemId, `structures.json ${s.id}.levels[${i}]`)
      for (const p of level.produces)
        needItem(p.item, `structures.json ${s.id}.levels[${i}].produces`)
    })
  }
  for (const r of Object.values(recipes)) {
    for (const itemId of Object.keys(r.inputs)) needItem(itemId, `recipes.json ${r.id}.inputs`)
    const target =
      r.output.kind === 'structure' ? structures[r.output.id] : decorations[r.output.id]
    if (!target) problems.push(`recipes.json ${r.id}: unknown ${r.output.kind} "${r.output.id}"`)
  }
  for (const w of Object.values(wildlife)) {
    if (w.attraction.kind === 'shelter' && !structures[w.attraction.structure]) {
      problems.push(`wildlife.json ${w.id}: unknown structure "${w.attraction.structure}"`)
    }
  }
  if (chapter) {
    const milestoneIds = new Set(chapter.milestones.map((m) => m.id))
    for (const m of chapter.milestones) {
      for (const c of m.conditions) {
        if (c.kind === 'planted' && c.plant && !plants[c.plant])
          problems.push(`chapter.json ${m.id}: unknown plant "${c.plant}"`)
        if (c.kind === 'seen' && c.wildlife && !wildlife[c.wildlife]) {
          problems.push(`chapter.json ${m.id}: unknown wildlife "${c.wildlife}"`)
        }
        if ((c.kind === 'built' || c.kind === 'visited') && !structures[c.structure]) {
          problems.push(`chapter.json ${m.id}: unknown structure "${c.structure}"`)
        }
        if (c.kind === 'milestone' && !milestoneIds.has(c.id))
          problems.push(`chapter.json ${m.id}: unknown milestone "${c.id}"`)
      }
    }
  }
  if (map) {
    for (const f of map.fixed) {
      const known = f.kind === 'plant' ? plants[f.id] : decorations[f.id]
      if (!known) problems.push(`map.json: unknown fixed ${f.kind} "${f.id}"`)
    }
    for (const itemId of Object.keys(map.startingInventory))
      needItem(itemId, 'map.json startingInventory')
    for (const c of map.clearing) needItem(c.item, 'map.json clearing')
  }

  if (problems.length > 0 || !chapter || !map) throw new ContentError(problems)
  return { items, plants, structures, decorations, recipes, wildlife, chapter, map }
}
