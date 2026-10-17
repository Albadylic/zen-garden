import { describe, expect, it } from 'vitest'
import { entityAt } from '../core/grid'
import { unreadCount } from '../core/journal'
import { plant } from '../core/plants'
import { setup } from '../test/fixtures'
import { GameController } from './GameController'

function controller() {
  const { content, state } = setup()
  return new GameController(content, state)
}

function addDrop(c: GameController, itemId: string, x: number, y: number) {
  const id = c.state.nextId++
  c.state.drops.push({ id, itemId, amount: 1, x, y, sourceId: 0, ageMs: 0 })
  return id
}

describe('gathering feedback', () => {
  it('shows gathered items as icons rather than text', () => {
    const c = controller()
    const id = addDrop(c, 'twigs', 3, 4)
    c.tap({ tile: null, pointerType: 'mouse', dropId: id })
    expect(c.ui.get().toasts).toHaveLength(0)
    expect(c.view().flyouts).toEqual([
      expect.objectContaining({ x: 3, y: 4, itemId: 'twigs', amount: 1, index: 0, t: 0 }),
    ])
  })

  it('sums items from one spot into one icon with a count', () => {
    const c = controller()
    addDrop(c, 'twigs', 3, 4)
    addDrop(c, 'twigs', 3, 4)
    addDrop(c, 'bark', 3, 4)
    c.collectAll()
    const flyouts = c.view().flyouts
    expect(flyouts.map((f) => [f.itemId, f.amount, f.index])).toEqual([
      ['twigs', 2, 0],
      ['bark', 1, 1],
    ])
  })

  it('fades icons out within about a second', () => {
    const c = controller()
    c.tap({ tile: null, pointerType: 'mouse', dropId: addDrop(c, 'twigs', 3, 4) })
    c.frame(600)
    expect(c.view().flyouts[0]!.t).toBeGreaterThan(0.4)
    c.frame(600)
    expect(c.view().flyouts).toHaveLength(0)
  })

  it('keeps a large haul to a handful of icons', () => {
    const c = controller()
    for (let i = 0; i < 20; i++) addDrop(c, i % 2 ? 'twigs' : 'bark', i % 10, 2)
    c.collectAll()
    const flyouts = c.view().flyouts
    expect(flyouts.length).toBeLessThanOrEqual(8)
    expect(flyouts.reduce((n, f) => n + f.amount, 0)).toBe(20)
  })
})

describe('messages', () => {
  it('shows one line at a time', () => {
    const c = controller()
    c.toast('first')
    c.toast('second', 'milestone')
    expect(c.ui.get().toasts.map((t) => t.text)).toEqual(['second'])
  })

  it('never announces journal discoveries, but counts them as unread', () => {
    const c = controller()
    const pine = c.state.entities.find((e) => e.defId === 'old-pine')!
    c.select({ kind: 'entity', id: pine.id })
    expect(c.state.journal['plant:old-pine']).toBeDefined()
    expect(c.ui.get().toasts).toHaveLength(0)
    expect(unreadCount(c.state, c.content)).toBe(1)
    c.markJournalRead(['plant:old-pine'])
    expect(unreadCount(c.state, c.content)).toBe(0)
  })
})

describe('clearing', () => {
  it('carries on into clearing mode after clearing one tangle from its panel', () => {
    const c = controller()
    c.tap({ tile: { x: 6, y: 1 }, pointerType: 'touch' })
    expect(c.ui.get().selection).toEqual({ kind: 'tile', x: 6, y: 1 })
    c.clearTile(6, 1)
    expect(c.ui.get().mode).toEqual({ type: 'clear' })
    expect(c.ui.get().selection).toBeNull()
    // The next tangle clears with a single tap.
    c.tap({ tile: { x: 7, y: 3 }, pointerType: 'touch' })
    expect(c.state.stats.cleared).toBe(2)
  })
})

describe('watering', () => {
  it('says how many plants one watering reached', () => {
    const c = controller()
    for (const [x, y] of [
      [5, 10],
      [6, 10],
      [6, 11],
    ] as const)
      expect(plant(c.state, c.content, 'wildflower-mix', x, y).ok).toBe(true)
    c.select({ kind: 'entity', id: entityAt(c.state, 5, 10)!.id })
    c.waterSelected()
    expect(c.ui.get().toasts.map((t) => t.text)).toEqual(['Watered 3 plants'])
  })
})
