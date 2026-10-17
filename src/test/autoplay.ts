// A patient automatic player for tests. It reads the current milestone's
// conditions and does what a player would: plants the right species in the
// best spots, clears overgrowth, gathers, builds, improves shelters, fills
// feeders, works through restoration projects, and lets time pass. If it can
// finish every chapter, so can a player.

import type { ChapterDef, Condition, Content, GardenDef, WildlifeDef } from '../core/content'
import { plantSuitability, structureSuitability } from '../core/environment'
import { fillFeeder, isFilled } from '../core/feeders'
import { gardenById, isInGarden, isTileOpen, visitGarden } from '../core/gardens'
import { entityAt, forEachTile, terrainAt } from '../core/grid'
import { upgradeOptions, upgradeStructure } from '../core/habitats'
import { hasItems, itemCount } from '../core/inventory'
import { buildRecipe, checkPlacement, craftItem, hasUnlock, type Placeable } from '../core/layout'
import { harvest, harvestStatus, plant } from '../core/plants'
import {
  conditionMet,
  conditionProgress,
  currentChapter,
  isChapterComplete,
  isChapterStarted,
} from '../core/progression'
import {
  availableProjects,
  choosableApproaches,
  chooseApproach,
  completeStage,
  currentStage,
  stageStatus,
} from '../core/projects'
import { clearOvergrowth, collectAll } from '../core/resources'
import { advance } from '../core/simulation'
import type { Entity, GameState, PlantEntity, StructureEntity } from '../core/state'

const TICK_MS = 30_000

export interface ChapterResult {
  id: string
  /** Minutes of play the chapter took. */
  minutes: number
  done: boolean
  /** The milestone it was stuck on, if it did not finish. */
  stuckOn?: string
}

/** Plays from the current state until the chapter is complete or time runs out. */
export function playChapter(
  state: GameState,
  content: Content,
  chapter: ChapterDef,
  maxMinutes = 240,
): ChapterResult {
  const bot = new Autoplayer(state, content, chapter)
  const start = state.elapsedMs
  while (!isChapterComplete(state, chapter) && state.elapsedMs - start < maxMinutes * 60_000) {
    bot.act()
    advance(state, content, TICK_MS, { offline: true })
  }
  const minutes = Math.round((state.elapsedMs - start) / 60_000)
  const done = isChapterComplete(state, chapter)
  const stuck = chapter.milestones.find((m) => state.milestones[m.id] === undefined)
  return { id: chapter.id, minutes, done, ...(done ? {} : { stuckOn: stuck?.id }) }
}

/** Plays every chapter in order from the current state. */
export function playAll(state: GameState, content: Content, maxMinutes = 240): ChapterResult[] {
  const results: ChapterResult[] = []
  for (const chapter of content.chapters) {
    if (!isChapterStarted(state, chapter)) break
    const result = playChapter(state, content, chapter, maxMinutes)
    results.push(result)
    if (!result.done) break
  }
  return results
}

class Autoplayer {
  private readonly state: GameState
  private readonly content: Content
  private readonly chapter: ChapterDef
  private readonly garden: GardenDef
  /** Items being sought this tick, to avoid going round in circles. */
  private seeking = new Set<string>()

  constructor(state: GameState, content: Content, chapter: ChapterDef) {
    this.state = state
    this.content = content
    this.chapter = chapter
    this.garden = gardenById(content, chapter.id) ?? content.world.gardens[0]!
  }

  act(): void {
    const { state, content } = this
    collectAll(state)
    this.seeking.clear()
    // Look around every open garden once.
    for (const g of content.world.gardens) {
      const x = Math.floor(g.bounds.x + g.bounds.w / 2)
      const y = Math.floor(g.bounds.y + g.bounds.h / 2)
      visitGarden(state, content, x, y)
    }
    const chapter = currentChapter(state, content)
    if (chapter.id !== this.chapter.id) return
    const next = chapter.milestones.find((m) => state.milestones[m.id] === undefined)
    if (!next) return
    for (const c of next.conditions) if (!conditionMet(state, content, c)) this.work(c)
  }

  // --- Conditions -----------------------------------------------------------

  private work(c: Condition): void {
    const { state, content } = this
    const garden = 'garden' in c ? (gardenById(content, c.garden) ?? this.garden) : this.garden
    const { current, target } = conditionProgress(state, content, c)
    const missing = Math.max(1, target - current)
    switch (c.kind) {
      case 'visitedGarden':
        return
      case 'planted':
        this.plantSome(garden, c.plant ? [c.plant] : this.plantable(garden), missing)
        return
      case 'plantedIn':
        if (this.countPlants(garden, c.plants) < c.count)
          this.plantSome(garden, c.plants ?? this.plantable(garden), missing)
        return
      case 'plantedBeside':
        this.plantSome(garden, c.plants ?? this.plantable(garden), missing, c.terrain)
        return
      case 'speciesIn': {
        const have = new Set(this.plantsIn(garden).map((p) => p.defId))
        const fresh = this.plantable(garden).filter((id) => !have.has(id))
        this.plantSome(garden, fresh, 1)
        return
      }
      case 'speciesMature': {
        // Different species, fastest growers first.
        const have = new Set(this.plantsIn(garden).map((p) => p.defId))
        if (have.size < c.count + 1) {
          const fresh = this.plantable(garden)
            .filter((id) => !have.has(id))
            .sort((a, b) => this.growTime(a) - this.growTime(b))
          this.plantSome(garden, fresh, 1)
        }
        return
      }
      case 'grown':
      case 'flowering':
        if (this.plantsIn(garden).length < 3) this.plantSome(garden, this.plantable(garden), 1)
        if (c.kind === 'flowering') this.plantSome(garden, this.nectarPlants(garden), 1)
        return
      case 'matured':
        if (!this.state.entities.some((e) => e.defId === c.plant && !e.fixed))
          this.plantSome(garden, [c.plant], 1)
        return
      case 'cleared':
      case 'clearedIn':
        this.clear(garden, Math.min(missing, 4))
        return
      case 'collected':
        return
      case 'gathered':
        this.acquire(c.item, c.count - current + itemCount(state, c.item), garden)
        return
      case 'built':
        this.build(garden, [c.structure], c.count)
        return
      case 'builtIn':
        this.build(garden, c.ids, c.count)
        return
      case 'visited':
      case 'visitedIn': {
        const shelter = this.content.recipes['natural-shelter']
        if (shelter && !this.thingsIn(garden, ['natural-shelter']).length)
          this.build(garden, ['natural-shelter'], 1)
        for (const w of Object.values(content.wildlife))
          if (w.attraction.kind === 'shelter') this.attract(w, garden)
        return
      }
      case 'seen':
        if (c.wildlife) this.attract(content.wildlife[c.wildlife]!, garden)
        else this.attractAny(garden)
        return
      case 'seenAny':
        for (const id of c.wildlife) this.attract(content.wildlife[id]!, garden)
        return
      case 'branched':
        this.branch(garden)
        return
      case 'approachChosen': {
        const project = content.projects[c.project]
        const choice = project && choosableApproaches(state, project)[0]
        if (project && choice) chooseApproach(state, content, project.id, choice.id)
        return
      }
      case 'stagesDone':
        this.workProject(c.project)
        return
      case 'openWater':
      case 'seasonsSeen':
      case 'milestone':
        return
    }
  }

  private workProject(projectId: string): void {
    const { state, content } = this
    const project = availableProjects(state, content).find((p) => p.id === projectId)
    if (!project) return
    const choice = choosableApproaches(state, project)[0]
    if (choice) chooseApproach(state, content, project.id, choice.id)
    const stage = currentStage(state, project)
    if (!stage) return
    const status = stageStatus(state, content, stage)
    if (status.kind === 'ready') {
      completeStage(state, content, project.id)
      return
    }
    for (const c of stage.conditions) if (!conditionMet(state, content, c)) this.work(c)
    for (const [item, n] of Object.entries(stage.cost)) this.acquire(item, n, this.garden)
  }

  // --- Wildlife -------------------------------------------------------------

  private attractAny(garden: GardenDef): void {
    this.plantSome(garden, this.nectarPlants(garden), 2)
  }

  private attract(def: WildlifeDef, garden: GardenDef, depth = 0): void {
    if (depth > 2) return
    const a = def.attraction
    for (const id of def.alongside?.wildlife ?? []) {
      const other = this.content.wildlife[id]
      if (other && other.id !== def.id) this.attract(other, garden, depth + 1)
    }
    if (a.kind === 'nectar') {
      const kinds = this.nectarPlants(garden)
      const flowering = this.plantsIn(garden).filter((p) => kinds.includes(p.defId))
      const species = new Set(flowering.map((p) => p.defId)).size
      if (a.minSpecies && species < a.minSpecies) {
        const fresh = kinds.filter((id) => !flowering.some((p) => p.defId === id))
        this.plantSome(garden, fresh, 1)
      }
      if (flowering.length < Math.max(4, a.minNectar)) this.plantSome(garden, kinds, 1)
    } else if (a.kind === 'perch') {
      const plants = this.plantsIn(garden).filter((p) => a.plants.includes(p.defId))
      if (a.plants.length && plants.length < a.minCount + 1) this.plantSome(garden, a.plants, 1)
      if (a.things?.length && this.thingsIn(garden, a.things).length < a.minCount)
        this.build(garden, a.things, a.minCount)
    } else if (a.kind === 'feeder') {
      const feeders = this.thingsIn(garden, [a.structure]) as StructureEntity[]
      if (feeders.length === 0) this.build(garden, [a.structure], 1)
      this.fill(feeders)
    } else {
      const shelters = this.thingsIn(garden, [a.structure]) as StructureEntity[]
      if (shelters.length === 0) {
        this.build(garden, [a.structure], 1)
        return
      }
      for (const s of shelters) this.improve(s, a.minTier, a.branches)
    }
  }

  private fill(feeders: StructureEntity[]): void {
    for (const f of feeders) {
      if (isFilled(f)) continue
      const item = this.content.structures[f.defId]?.feeder?.item
      if (!item) continue
      if (itemCount(this.state, item) > 0) fillFeeder(this.state, this.content, f.id)
      else this.acquire(item, 1, this.garden)
    }
  }

  /** Improves a shelter towards a tier, taking a branch when one is wanted. */
  private improve(s: StructureEntity, minTier: number, branches?: string[]): void {
    const levels = this.content.structures[s.defId]?.levels ?? []
    const tier = levels[s.level]?.tier ?? 0
    const branch = levels[s.level]?.branch
    if (tier >= minTier && (!branches || (branch && branches.includes(branch)))) return
    const options = upgradeOptions(this.state, this.content, s)
    const wanted =
      options.find((o) => !o.def.branch || !branches || branches.includes(o.def.branch)) ??
      options[0]
    if (!wanted) return
    if (wanted.status.kind === 'ready')
      upgradeStructure(this.state, this.content, s.id, wanted.level)
    else if (wanted.status.kind === 'needsItems')
      for (const [item, n] of Object.entries(wanted.status.cost)) this.acquire(item, n, this.garden)
  }

  private branch(garden: GardenDef): void {
    const shelters = this.state.entities.filter(
      (e): e is StructureEntity =>
        e.kind === 'structure' && this.content.structures[e.defId]!.levels.some((l) => l.branch),
    )
    if (shelters.length === 0) {
      this.build(garden, ['natural-shelter'], 1)
      return
    }
    for (const s of shelters) {
      const levels = this.content.structures[s.defId]!.levels
      const anyBranch = levels.filter((l) => l.branch).map((l) => l.branch!)
      this.improve(s, Math.max(...levels.map((l) => l.tier)), anyBranch)
    }
  }

  // --- Planting -------------------------------------------------------------

  private plantsIn(garden: GardenDef): PlantEntity[] {
    return this.state.entities.filter(
      (e): e is PlantEntity => e.kind === 'plant' && !e.fixed && isInGarden(garden, e.x, e.y),
    )
  }

  private countPlants(garden: GardenDef, kinds?: string[]): number {
    return this.plantsIn(garden).filter((p) => !kinds || kinds.includes(p.defId)).length
  }

  private thingsIn(garden: GardenDef, ids: string[]): Entity[] {
    return this.state.entities.filter((e) => ids.includes(e.defId) && isInGarden(garden, e.x, e.y))
  }

  /** Species the player could plant: those with a seed item. */
  private plantable(_garden: GardenDef): string[] {
    return Object.values(this.content.plants)
      .filter((p) => p.seedItem)
      .map((p) => p.id)
  }

  private nectarPlants(garden: GardenDef): string[] {
    return this.plantable(garden).filter((id) => (this.content.plants[id]?.nectar ?? 0) > 0)
  }

  /** Plants up to `n` of the given species in their best spots, seeking seeds as needed. */
  private plantSome(garden: GardenDef, kinds: string[], n: number, beside?: string[]): void {
    let planted = 0
    // Prefer species whose seeds are at hand, best suited first.
    const order = [...kinds].sort(
      (a, b) => this.seedsOf(b) - this.seedsOf(a) || kinds.indexOf(a) - kinds.indexOf(b),
    )
    for (const id of order) {
      const def = this.content.plants[id]
      if (!def?.seedItem) continue
      while (planted < n && itemCount(this.state, def.seedItem) > 0) {
        const tile = this.bestTile(garden, { kind: 'plant', defId: id }, beside)
        if (!tile || !plant(this.state, this.content, id, tile.x, tile.y).ok) break
        planted++
      }
      if (planted >= n) return
    }
    if (planted < n) {
      const wanted = order.find((id) => this.content.plants[id]?.seedItem)
      const seed = wanted && this.content.plants[wanted]!.seedItem!
      if (seed) this.acquire(seed, 1, garden)
    }
  }

  private growTime(plantId: string): number {
    return (this.content.plants[plantId]?.stages ?? []).reduce(
      (n, st) => n + (st.durationSec ?? 0),
      0,
    )
  }

  private seedsOf(plantId: string): number {
    const seed = this.content.plants[plantId]?.seedItem
    return seed ? itemCount(this.state, seed) : 0
  }

  /** The most suitable free tile in a garden for something. */
  private bestTile(garden: GardenDef, p: Placeable, beside?: string[]) {
    const { state, content } = this
    let best: { x: number; y: number; score: number } | undefined
    forEachTile(state, (x, y) => {
      if (!isInGarden(garden, x, y) || !isTileOpen(state, content, x, y)) return
      if (!checkPlacement(state, content, p, x, y).ok) return
      if (beside) {
        const ok = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => beside.includes(terrainAt(state, x + dx!, y + dy!) ?? ''))
        if (!ok) return
      }
      const score =
        p.kind === 'plant'
          ? plantSuitability(state, content, p.defId, x, y).score
          : p.kind === 'structure'
            ? structureSuitability(state, content, p.defId, x, y).score
            : 0.5
      if (!best || score > best.score) best = { x, y, score }
    })
    return best
  }

  // --- Building and materials ------------------------------------------------

  private build(garden: GardenDef, ids: string[], count: number): void {
    if (this.thingsIn(garden, ids).length >= count) return
    const recipes = Object.values(this.content.recipes).filter(
      (r) => r.output.kind !== 'item' && ids.includes(r.output.id),
    )
    const recipe =
      recipes.find((r) => hasUnlock(this.state, r.unlock) && hasItems(this.state, r.inputs)) ??
      recipes.find((r) => hasUnlock(this.state, r.unlock))
    if (!recipe || recipe.output.kind === 'item') return
    if (!hasItems(this.state, recipe.inputs)) {
      for (const [item, n] of Object.entries(recipe.inputs)) this.acquire(item, n, garden)
      return
    }
    const tile = this.bestTile(garden, { kind: recipe.output.kind, defId: recipe.output.id })
    if (tile) buildRecipe(this.state, this.content, recipe.id, tile.x, tile.y)
  }

  /** Works towards having `n` of an item, from whatever source is open. */
  private acquire(item: string, n: number, garden: GardenDef, depth = 0): void {
    const { state, content } = this
    if (itemCount(state, item) >= n || depth > 3 || this.seeking.has(item)) return
    this.seeking.add(item)
    // Harvest anything ready.
    for (const e of state.entities) {
      if (e.kind !== 'plant') continue
      const def = content.plants[e.defId]
      if (def?.harvest?.item === item && harvestStatus(content, e).kind === 'ready')
        harvest(state, content, e.id)
    }
    // Make it.
    for (const r of Object.values(content.recipes)) {
      if (r.output.kind !== 'item' || r.output.id !== item || !hasUnlock(state, r.unlock)) continue
      if (hasItems(state, r.inputs)) craftItem(state, content, r.id)
      else
        for (const [input, k] of Object.entries(r.inputs)) this.acquire(input, k, garden, depth + 1)
    }
    // Grow it: plant something that produces or yields it, if none is growing.
    const growers = Object.values(content.plants).filter(
      (p) => p.produces.some((r) => r.item === item) || p.harvest?.item === item,
    )
    const growing = state.entities.some((e) => growers.some((p) => p.id === e.defId))
    if (!growing && growers.length)
      this.plantSome(
        garden,
        growers.map((p) => p.id),
        1,
      )
    // Structures that produce it.
    const makers = Object.values(content.structures).filter((s) =>
      s.levels.some((l) => l.produces.some((r) => r.item === item)),
    )
    for (const s of makers) {
      const built = state.entities.filter(
        (e): e is StructureEntity => e.kind === 'structure' && e.defId === s.id,
      )
      if (built.length === 0) this.build(garden, [s.id], 1)
      else if (s.feeder?.whileFilled) this.fill(built)
    }
    // Clear overgrowth where clearing turns it up.
    for (const g of content.world.gardens) {
      const yields = g.clearing ?? content.world.clearing
      if (yields.some((y) => y.item === item) && isTileOpenGarden(state, content, g))
        this.clear(g, 2)
    }
  }

  private clear(garden: GardenDef, n: number): void {
    let left = n
    forEachTile(this.state, (x, y, t) => {
      if (left <= 0 || t !== 'overgrown' || !isInGarden(garden, x, y)) return
      if (entityAt(this.state, x, y)) return
      if (clearOvergrowth(this.state, this.content, x, y).ok) left--
    })
  }
}

function isTileOpenGarden(state: GameState, content: Content, g: GardenDef): boolean {
  return isTileOpen(state, content, g.bounds.x + 1, g.bounds.y + 1)
}
