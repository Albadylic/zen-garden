// Validates raw JSON content and assembles it into the Content the simulation
// uses. Reports every problem at once, with the file and entry it came from.

import { z } from 'zod'
import type {
  Condition,
  Content,
  FixedObject,
  GardenDef,
  GateDef,
  Terrain,
  WorldDef,
} from '../core/content'
import {
  chapterSchema,
  decorationSchema,
  itemSchema,
  gardenMapSchema,
  plantSchema,
  projectSchema,
  recipeSchema,
  structureSchema,
  wildlifeSchema,
  worldSchema,
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
  world: unknown
  /** One map file per built garden. */
  gardens: unknown[]
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

/** Assembles the world: each built garden's map placed at its origin, and the gates between them. */
function buildWorld(
  rawWorld: unknown,
  rawMaps: unknown[],
  problems: string[],
): WorldDef | undefined {
  const file = parse(worldSchema, rawWorld, 'world.json', problems)
  if (!file) return undefined
  const maps = new Map<string, string[]>()
  // Array.from turns any empty slot into undefined, so it is reported rather than skipped.
  Array.from(rawMaps).forEach((raw, i) => {
    const map = parse(gardenMapSchema, raw, `gardens/${i}.json`, problems)
    if (!map) return
    if (maps.has(map.id)) problems.push(`gardens/${map.id}.json: duplicate garden map`)
    maps.set(map.id, map.rows)
  })

  const gardens: GardenDef[] = []
  const fixed: FixedObject[] = []
  for (const g of file.gardens) {
    const rows = maps.get(g.id)
    if (!g.origin) {
      if (rows) problems.push(`world.json: garden ${g.id} has a map but no origin`)
      continue
    }
    if (!rows) {
      problems.push(`world.json: garden ${g.id} has an origin but no map file`)
      continue
    }
    const where = `gardens/${g.id}.json`
    const height = rows.length
    const width = rows[0]?.length ?? 0
    const terrain: Terrain[] = []
    const extraShade: number[] = []
    rows.forEach((row, y) => {
      if (row.length !== width)
        problems.push(`${where}: row ${y} has ${row.length} tiles, expected ${width}`)
      ;[...row].forEach((char, x) => {
        const entry = file.legend[char]
        if (!entry) {
          problems.push(`${where}: unknown tile "${char}" at ${x},${y}`)
          terrain.push('grass')
          extraShade.push(0)
          return
        }
        terrain.push(entry.terrain)
        extraShade.push(entry.shade ?? 0)
        if (entry.fixed) fixed.push({ ...entry.fixed, x: g.origin!.x + x, y: g.origin!.y + y })
      })
    })
    gardens.push({
      id: g.id,
      name: g.name,
      number: g.number,
      bounds: { x: g.origin.x, y: g.origin.y, w: width, h: height },
      terrain,
      baseShade: wallShade(terrain, width, height).map((s, i) => Math.min(1, s + extraShade[i]!)),
      unlock: g.unlock,
      clearing: g.clearing,
    })
  }
  for (const id of maps.keys()) {
    if (!file.gardens.some((g) => g.id === id))
      problems.push(`gardens/${id}.json: no garden "${id}" in world.json`)
  }

  // Built gardens must not overlap.
  for (const [i, a] of gardens.entries()) {
    for (const b of gardens.slice(i + 1)) {
      const A = a.bounds
      const B = b.bounds
      if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h)
        problems.push(`world.json: gardens ${a.id} and ${b.id} overlap`)
    }
  }
  const numbers = new Set<number>()
  const slots = new Set<string>()
  for (const g of file.gardens) {
    if (numbers.has(g.number)) problems.push(`world.json: garden number ${g.number} is used twice`)
    numbers.add(g.number)
    const slot = `${g.slot.col},${g.slot.row}`
    if (slots.has(slot)) problems.push(`world.json: two gardens share slot ${slot}`)
    slots.add(slot)
  }

  // Connections join neighbouring slots; gates sit in touching walls.
  const gates: GateDef[] = []
  const byId = new Map(file.gardens.map((g) => [g.id, g]))
  const built = new Map(gardens.map((g) => [g.id, g]))
  for (const c of file.connections) {
    const [a, b] = c.gardens.map((id) => byId.get(id))
    const where = `world.json connection ${c.gardens.join(' ↔ ')}`
    if (!a || !b) {
      problems.push(`${where}: unknown garden`)
      continue
    }
    if (Math.abs(a.slot.col - b.slot.col) + Math.abs(a.slot.row - b.slot.row) !== 1)
      problems.push(`${where}: the gardens are not side by side on the world map`)
    if (!c.gate) continue
    const from = built.get(a.id)
    const to = built.get(b.id)
    if (!from || !to) {
      problems.push(`${where}: a gate needs both gardens to be built`)
      continue
    }
    const at = { x: from.bounds.x + c.gate.at.x, y: from.bounds.y + c.gate.at.y }
    const passage = { x: to.bounds.x + c.gate.passage.x, y: to.bounds.y + c.gate.passage.y }
    if (Math.abs(at.x - passage.x) + Math.abs(at.y - passage.y) !== 1)
      problems.push(`${where}: the gate and its passage are not next to each other`)
    const terrainOf = (g: GardenDef, local: { x: number; y: number }) =>
      g.terrain[local.y * g.bounds.w + local.x]
    if (terrainOf(from, c.gate.at) !== 'path' || terrainOf(to, c.gate.passage) !== 'path')
      problems.push(`${where}: the gate and its passage must be path tiles`)
    gates.push({
      from: a.id,
      to: b.id,
      at,
      passage,
      ...(c.gate.unlock ? { unlock: c.gate.unlock } : {}),
    })
  }

  return {
    id: file.id,
    name: file.name,
    gardens,
    layout: file.gardens.map((g) => ({
      id: g.id,
      number: g.number,
      name: g.name,
      slot: g.slot,
      built: built.has(g.id),
    })),
    connections: file.connections.map((c) => ({ gardens: c.gardens, kind: c.kind })),
    gates,
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
  const chapters = parse(z.array(chapterSchema).min(1), raw.chapters, 'chapters.json', problems)
  const projects = byId(
    parse(z.array(projectSchema), raw.projects, 'projects.json', problems),
    'projects.json',
    problems,
  )
  const world = buildWorld(raw.world, raw.gardens, problems)

  // Cross-references between files.
  const needItem = (itemId: string, where: string) => {
    if (!items[itemId]) problems.push(`${where}: unknown item "${itemId}"`)
  }
  for (const plant of Object.values(plants)) {
    if (plant.seedItem) needItem(plant.seedItem, `plants.json ${plant.id}.seedItem`)
    for (const p of plant.produces) needItem(p.item, `plants.json ${plant.id}.produces`)
    if (plant.harvest) needItem(plant.harvest.item, `plants.json ${plant.id}.harvest`)
    for (const id of plant.near?.ids ?? []) {
      if (!plants[id] && !decorations[id] && !structures[id])
        problems.push(`plants.json ${plant.id}.near: unknown "${id}"`)
    }
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
      for (const tid of a.things ?? []) {
        if (!decorations[tid] && !structures[tid])
          problems.push(`wildlife.json ${w.id}: unknown decoration or structure "${tid}"`)
      }
      if (a.plants.length === 0 && !a.things?.length)
        problems.push(`wildlife.json ${w.id}: a perch needs plants or things to rest on`)
    }
    if (a.kind === 'feeder' && !structures[a.structure]?.feeder) {
      problems.push(`wildlife.json ${w.id}: "${a.structure}" is not a feeder structure`)
    }
    for (const other of w.alongside?.wildlife ?? []) {
      if (!wildlife[other]) problems.push(`wildlife.json ${w.id}: unknown wildlife "${other}"`)
    }
    if (w.attraction.kind === 'shelter' && !structures[w.attraction.structure]) {
      problems.push(`wildlife.json ${w.id}: unknown structure "${w.attraction.structure}"`)
    }
  }
  const gardenIds = new Set(world?.gardens.map((g) => g.id) ?? [])
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
      case 'visitedGarden':
      case 'visitedIn':
      case 'clearedIn':
        need(gardenIds.has(c.garden), `garden "${c.garden}"`)
        break
      case 'plantedIn':
        need(gardenIds.has(c.garden), `garden "${c.garden}"`)
        for (const id of c.plants ?? []) need(!!plants[id], `plant "${id}"`)
        break
      case 'builtIn':
        need(gardenIds.has(c.garden), `garden "${c.garden}"`)
        for (const id of c.ids)
          need(!!structures[id] || !!decorations[id], `structure or decoration "${id}"`)
        break
      case 'gathered':
        needItem(c.item, where)
        break
      case 'plantedBeside':
        need(gardenIds.has(c.garden), `garden "${c.garden}"`)
        for (const id of c.plants ?? []) need(!!plants[id], `plant "${id}"`)
        break
      case 'speciesIn':
      case 'openWater':
        need(gardenIds.has(c.garden), `garden "${c.garden}"`)
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
    if (!gardenIds.has(ch.id)) problems.push(`chapters.json ${ch.id}: no garden with this id`)
    for (const m of [...ch.milestones, ...(ch.optional ?? [])]) {
      for (const c of m.conditions) checkCondition(c, `chapters.json ${ch.id}/${m.id}`)
    }
    for (const itemId of Object.keys(ch.gift ?? {})) needItem(itemId, `chapters.json ${ch.id}.gift`)
  }
  for (const project of Object.values(projects)) {
    if (!gardenIds.has(project.garden))
      problems.push(`projects.json ${project.id}: unknown garden "${project.garden}"`)
    for (const a of project.approaches) {
      for (const stage of a.stages) {
        const where = `projects.json ${project.id}/${a.id}/${stage.id}`
        for (const c of stage.conditions) checkCondition(c, where)
        for (const itemId of Object.keys(stage.cost)) needItem(itemId, where)
      }
    }
  }
  if (world) {
    for (const f of world.fixed) {
      const known = f.kind === 'plant' ? plants[f.id] : decorations[f.id]
      if (!known) problems.push(`world.json legend: unknown fixed ${f.kind} "${f.id}"`)
    }
    for (const itemId of Object.keys(world.startingInventory))
      needItem(itemId, 'world.json startingInventory')
    for (const c of world.clearing) needItem(c.item, 'world.json clearing')
    for (const g of world.gardens) {
      for (const c of g.clearing ?? []) needItem(c.item, `world.json garden ${g.id} clearing`)
    }
  }

  if (problems.length > 0 || !chapters || !world) throw new ContentError(problems)
  return { items, plants, structures, decorations, recipes, wildlife, chapters, projects, world }
}
