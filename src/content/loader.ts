// Validates raw JSON content and assembles it into the Content the simulation
// uses. Reports every problem at once, with the file and entry it came from.

import { z } from 'zod'
import type { Condition, Content, FixedObject, MapDef, Terrain } from '../core/content'
import {
  chapterSchema,
  decorationSchema,
  itemSchema,
  mapFileSchema,
  plantSchema,
  projectSchema,
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
  chapters: unknown
  projects: unknown
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
    areas: file.areas,
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
  const chapters = parse(z.array(chapterSchema).min(1), raw.chapters, 'chapters.json', problems)
  const projects = byId(
    parse(z.array(projectSchema), raw.projects, 'projects.json', problems),
    'projects.json',
    problems,
  )
  const map = buildMap(raw.map, problems)

  // Cross-references between files.
  const needItem = (itemId: string, where: string) => {
    if (!items[itemId]) problems.push(`${where}: unknown item "${itemId}"`)
  }
  for (const plant of Object.values(plants)) {
    if (plant.seedItem) needItem(plant.seedItem, `plants.json ${plant.id}.seedItem`)
    for (const p of plant.produces) needItem(p.item, `plants.json ${plant.id}.produces`)
    if (plant.harvest) needItem(plant.harvest.item, `plants.json ${plant.id}.harvest`)
    if (plant.flowerStage >= plant.stages.length) {
      problems.push(`plants.json ${plant.id}: flowerStage is beyond its last stage`)
    }
  }
  for (const s of Object.values(structures)) {
    if (s.feeder) needItem(s.feeder.item, `structures.json ${s.id}.feeder`)
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
      r.output.kind === 'structure'
        ? structures[r.output.id]
        : r.output.kind === 'item'
          ? items[r.output.id]
          : decorations[r.output.id]
    if (!target) problems.push(`recipes.json ${r.id}: unknown ${r.output.kind} "${r.output.id}"`)
  }
  for (const w of Object.values(wildlife)) {
    const a = w.attraction
    if (a.kind === 'perch') {
      for (const pid of [...a.plants, ...(a.bonus ? [a.bonus.plant] : [])]) {
        if (!plants[pid]) problems.push(`wildlife.json ${w.id}: unknown plant "${pid}"`)
      }
    }
    if (a.kind === 'feeder' && !structures[a.structure]?.feeder) {
      problems.push(`wildlife.json ${w.id}: "${a.structure}" is not a feeder structure`)
    }
    if (w.attraction.kind === 'shelter' && !structures[w.attraction.structure]) {
      problems.push(`wildlife.json ${w.id}: unknown structure "${w.attraction.structure}"`)
    }
  }
  const areaIds = new Set(map?.areas.map((a) => a.id) ?? [])
  const milestoneIds = new Set(
    (chapters ?? []).flatMap((ch) => [...ch.milestones, ...(ch.optional ?? [])].map((m) => m.id)),
  )
  const checkCondition = (c: Condition, where: string) => {
    const need = (ok: boolean, what: string) => {
      if (!ok) problems.push(`${where}: unknown ${what}`)
    }
    switch (c.kind) {
      case 'planted':
        if (c.plant) need(!!plants[c.plant], `plant "${c.plant}"`)
        break
      case 'seen':
        if (c.wildlife) need(!!wildlife[c.wildlife], `wildlife "${c.wildlife}"`)
        break
      case 'built':
      case 'visited':
        need(!!structures[c.structure], `structure "${c.structure}"`)
        break
      case 'milestone':
        need(milestoneIds.has(c.id), `milestone "${c.id}"`)
        break
      case 'visitedArea':
      case 'visitedIn':
      case 'clearedIn':
        need(areaIds.has(c.area), `area "${c.area}"`)
        break
      case 'plantedIn':
        need(areaIds.has(c.area), `area "${c.area}"`)
        for (const id of c.plants ?? []) need(!!plants[id], `plant "${id}"`)
        break
      case 'builtIn':
        need(areaIds.has(c.area), `area "${c.area}"`)
        for (const id of c.ids)
          need(!!structures[id] || !!decorations[id], `structure or decoration "${id}"`)
        break
      case 'gathered':
        needItem(c.item, where)
        break
      case 'seenAny':
        for (const id of c.wildlife) need(!!wildlife[id], `wildlife "${id}"`)
        break
      case 'matured':
        need(!!plants[c.plant], `plant "${c.plant}"`)
        break
      case 'approachChosen':
      case 'stagesDone':
        need(!!projects[c.project], `project "${c.project}"`)
        break
    }
  }
  const hinted = [
    ...Object.values(items).map((d) => ['items.json', d] as const),
    ...Object.values(plants).map((d) => ['plants.json', d] as const),
    ...Object.values(structures).map((d) => ['structures.json', d] as const),
    ...Object.values(wildlife).map((d) => ['wildlife.json', d] as const),
  ]
  for (const [file, def] of hinted) {
    for (const h of def.hints ?? []) {
      if (h.after && !milestoneIds.has(h.after))
        problems.push(`${file} ${def.id}: hint after unknown milestone "${h.after}"`)
    }
  }
  for (const ch of chapters ?? []) {
    for (const m of [...ch.milestones, ...(ch.optional ?? [])]) {
      for (const c of m.conditions) checkCondition(c, `chapters.json ${ch.id}/${m.id}`)
    }
    for (const itemId of Object.keys(ch.gift ?? {})) needItem(itemId, `chapters.json ${ch.id}.gift`)
  }
  for (const project of Object.values(projects)) {
    if (!areaIds.has(project.area))
      problems.push(`projects.json ${project.id}: unknown area "${project.area}"`)
    for (const a of project.approaches) {
      for (const stage of a.stages) {
        const where = `projects.json ${project.id}/${a.id}/${stage.id}`
        for (const c of stage.conditions) checkCondition(c, where)
        for (const itemId of Object.keys(stage.cost)) needItem(itemId, where)
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
    for (const area of map.areas) {
      for (const c of area.clearing ?? []) needItem(c.item, `map.json area ${area.id} clearing`)
      const b = area.bounds
      if (b.x + b.w > map.width || b.y + b.h > map.height)
        problems.push(`map.json: area ${area.id} extends beyond the map`)
    }
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const inAreas = map.areas.filter(
          (a) =>
            x >= a.bounds.x &&
            y >= a.bounds.y &&
            x < a.bounds.x + a.bounds.w &&
            y < a.bounds.y + a.bounds.h,
        )
        if (inAreas.length !== 1)
          problems.push(`map.json: tile ${x},${y} is in ${inAreas.length} areas, expected 1`)
      }
    }
  }

  if (problems.length > 0 || !chapters || !map) throw new ContentError(problems)
  return { items, plants, structures, decorations, recipes, wildlife, chapters, projects, map }
}
