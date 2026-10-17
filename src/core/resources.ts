// Natural production, items lying in the garden, gathering and clearing.

import type { Content, ProductionDef } from './content'
import { nextId } from './game'
import { entityById, setTerrain, terrainAt } from './grid'
import { addItems } from './inventory'
import type { ActionResult } from './layout'
import { growthRate } from './plants'
import { random, randomInt } from './rng'
import type { StepContext } from './simulation'
import type { Drop, Entity, GameState } from './state'

/** Most items of one kind a single source leaves lying around before it pauses. */
export const DROP_CAP = 2
/** While the garden is on screen, items left lying this long are gathered automatically. */
export const AUTO_GATHER_MS = 45_000

function rulesFor(content: Content, e: Entity): ProductionDef[] {
  if (e.kind === 'plant') return content.plants[e.defId]?.produces ?? []
  if (e.kind === 'structure') return content.structures[e.defId]?.levels[e.level]?.produces ?? []
  return []
}

function stageOf(e: Entity): number {
  return e.kind === 'plant' ? e.stage : 0
}

/** System: plants and structures produce items over time, up to a cap per source. */
export function produce(state: GameState, content: Content, dtMs: number, ctx: StepContext): void {
  for (const e of state.entities) {
    if (e.kind === 'decoration') continue
    const rules = rulesFor(content, e)
    if (rules.length === 0) continue
    const rate = e.kind === 'plant' ? growthRate(state, content, e) : 1
    rules.forEach((rule, i) => {
      if (stageOf(e) < rule.minStage) return
      const period = rule.everySec * 1000
      const elapsed = (e.produceMs[i] ?? 0) + dtMs * rate
      if (elapsed < period) {
        e.produceMs[i] = elapsed
        return
      }
      const lying = state.drops.filter((d) => d.sourceId === e.id && d.itemId === rule.item).length
      if (lying >= DROP_CAP) {
        // Rest until something is gathered, then start the next one from scratch.
        e.produceMs[i] = 0
        return
      }
      e.produceMs[i] = elapsed - period
      const drop: Drop = {
        id: nextId(state),
        itemId: rule.item,
        amount: rule.amount,
        x: e.x,
        y: e.y,
        sourceId: e.id,
        ageMs: 0,
      }
      state.drops.push(drop)
      ctx.events.push({
        type: 'dropProduced',
        dropId: drop.id,
        itemId: drop.itemId,
        amount: drop.amount,
      })
    })
  }
}

function gather(state: GameState, drops: Drop[]): Record<string, number> {
  const items: Record<string, number> = {}
  for (const d of drops) items[d.itemId] = (items[d.itemId] ?? 0) + d.amount
  addItems(state, items)
  const ids = new Set(drops.map((d) => d.id))
  state.drops = state.drops.filter((d) => !ids.has(d.id))
  state.stats.collected += drops.reduce((n, d) => n + d.amount, 0)
  return items
}

/** System: items left lying are gathered automatically while the player is here. */
export function ageDrops(
  state: GameState,
  _content: Content,
  dtMs: number,
  ctx: StepContext,
): void {
  // Time away does not count: the player returns to items waiting to be gathered.
  if (ctx.offline) return
  for (const d of state.drops) d.ageMs += dtMs
  const ripe = state.drops.filter((d) => d.ageMs >= AUTO_GATHER_MS)
  if (ripe.length === 0) return
  ctx.events.push({ type: 'collected', items: gather(state, ripe), auto: true })
}

export function collectDrop(state: GameState, dropId: number): ActionResult {
  const drop = state.drops.find((d) => d.id === dropId)
  if (!drop) return { ok: false, reason: 'Already gathered' }
  return { ok: true, events: [{ type: 'collected', items: gather(state, [drop]), auto: false }] }
}

export function collectAll(state: GameState): ActionResult {
  if (state.drops.length === 0) return { ok: false, reason: 'Nothing to gather' }
  return {
    ok: true,
    events: [{ type: 'collected', items: gather(state, [...state.drops]), auto: false }],
  }
}

/** Clears an overgrown tile back to grass, turning up a few materials. */
export function clearOvergrowth(
  state: GameState,
  content: Content,
  x: number,
  y: number,
): ActionResult {
  if (terrainAt(state, x, y) !== 'overgrown') return { ok: false, reason: 'Nothing to clear here' }
  setTerrain(state, x, y, 'grass')
  const items: Record<string, number> = {}
  for (const find of content.map.clearing) {
    if (random(state) >= find.chance) continue
    const n = randomInt(state, find.min, find.max)
    if (n > 0) items[find.item] = (items[find.item] ?? 0) + n
  }
  addItems(state, items)
  state.stats.cleared++
  state.stats.collected += Object.values(items).reduce((a, b) => a + b, 0)
  return { ok: true, events: [{ type: 'cleared', x, y, items }] }
}

export function dropsFrom(state: GameState, entityId: number): Drop[] {
  return state.drops.filter((d) => d.sourceId === entityId)
}

/** Whether a source currently has production rules that are active. */
export function producesNow(content: Content, state: GameState, entityId: number): ProductionDef[] {
  const e = entityById(state, entityId)
  if (!e) return []
  return rulesFor(content, e).filter((r) => stageOf(e) >= r.minStage)
}
