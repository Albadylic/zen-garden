// The garden never shows one animal hunting, eating or harming another.
// This guards every piece of player-facing text in the content.

import { describe, expect, it } from 'vitest'
import { getContent } from '.'

const PREDATION =
  /\b(hunt|hunts|hunted|hunting|prey|preys|predators?|kills?|killed|killing|eat|eats|eaten|eating|devours?|catch(es|ing)? (insects|mice|bees|beetles|butterflies|birds))\b/i

function texts(): { where: string; text: string }[] {
  const c = getContent()
  const out: { where: string; text: string }[] = []
  const add = (
    where: string,
    def: { description?: string; facts?: { text: string }[]; hints?: { text: string }[] },
  ) => {
    if (def.description) out.push({ where, text: def.description })
    for (const f of def.facts ?? []) out.push({ where, text: f.text })
    for (const h of def.hints ?? []) out.push({ where, text: h.text })
  }
  for (const d of Object.values(c.items)) add(`item ${d.id}`, d)
  for (const d of Object.values(c.plants)) add(`plant ${d.id}`, d)
  for (const d of Object.values(c.wildlife)) add(`wildlife ${d.id}`, d)
  for (const d of Object.values(c.decorations)) add(`decoration ${d.id}`, d)
  for (const d of Object.values(c.structures)) {
    add(`structure ${d.id}`, d)
    for (const l of d.levels)
      if (l.description) out.push({ where: `structure ${d.id} ${l.name}`, text: l.description })
  }
  for (const ch of c.chapters) {
    for (const m of [...ch.milestones, ...(ch.optional ?? [])]) {
      out.push({ where: `milestone ${m.id}`, text: `${m.description} ${m.hint}` })
    }
    for (const p of ch.completion.body) out.push({ where: `chapter ${ch.id}`, text: p })
  }
  return out
}

describe('content wording', () => {
  it('never describes one animal hunting or eating another', () => {
    const offending = texts().filter((t) => PREDATION.test(t.text))
    expect(offending).toEqual([])
  })

  it('catches the wording it is meant to', () => {
    expect(PREDATION.test('The wren hunts for insects.')).toBe(true)
    expect(PREDATION.test('Frogs eat flies.')).toBe(true)
    expect(PREDATION.test('It still catches the rain.')).toBe(false)
  })
})
