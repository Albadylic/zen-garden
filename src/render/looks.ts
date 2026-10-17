// Placeholder art drawn from a `look` in the content data: a form (the kind of
// shape) and colours. New species need only data, not drawing code. Earlier
// species keep their hand-drawn art in art.ts.
//
// Each drawing is made around its base point: (0, 0) is where the object
// touches the ground at the centre of its tile.

import type { Graphics } from 'pixi.js'
import type { Look } from '../core/content'

export function hex(colour: string | undefined, fallback = 0xff00ff): number {
  return colour ? Number.parseInt(colour.slice(1), 16) : fallback
}

/** Deterministic pseudo-random values, so each look draws the same way every time. */
function scatter(seed: number, n: number): number[] {
  const out: number[] = []
  let s = seed * 9301 + 49297
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280
    out.push(s / 233280)
  }
  return out
}

function seedOf(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return h
}

const shadow = (g: Graphics, w: number, h: number) =>
  g.ellipse(0, 0, w, h).fill({ color: 0x2e3a24, alpha: 0.28 })

/**
 * A plant at a point in its growth (0 just planted, 1 fully grown), with or
 * without flowers or fruit showing.
 */
export function drawPlantLook(
  g: Graphics,
  id: string,
  look: Look,
  growth: number,
  showAccent: boolean,
): void {
  const colour = hex(look.colour)
  const accent = hex(look.accent, colour)
  const s = (look.size ?? 1) * (0.35 + 0.65 * growth)
  const r = scatter(seedOf(id), 24)
  switch (look.form) {
    case 'tuft': {
      shadow(g, 20 * s, 8 * s)
      for (let i = 0; i < 12; i++) {
        const x = (r[i]! - 0.5) * 30 * s
        const h = (20 + r[i + 12]! * 26) * s
        g.moveTo(x, 0)
          .quadraticCurveTo(
            x + (r[i + 6]! - 0.5) * 18 * s,
            -h * 0.6,
            x + (r[i + 3]! - 0.5) * 22 * s,
            -h,
          )
          .stroke({ color: i % 3 ? colour : accent, width: 2.5 })
      }
      if (showAccent && look.accent)
        for (let i = 0; i < 5; i++)
          g.ellipse((r[i + 7]! - 0.5) * 26 * s, -(26 + r[i]! * 18) * s, 3, 6).fill(accent)
      return
    }
    case 'flower': {
      shadow(g, 22 * s, 9 * s)
      g.ellipse(0, -3 * s, 20 * s, 8 * s).fill(colour)
      const stems = 5 + Math.round(growth * 6)
      for (let i = 0; i < stems; i++) {
        const x = (r[i]! - 0.5) * 36 * s
        const h = (10 + r[i + 8]! * 22) * s
        g.moveTo(x, -2)
          .lineTo(x + (r[i + 4]! - 0.5) * 8, -h)
          .stroke({ color: colour, width: 2 })
        if (showAccent) g.circle(x + (r[i + 4]! - 0.5) * 8, -h, 4.5).fill(accent)
        else if (growth > 0.5) g.circle(x + (r[i + 4]! - 0.5) * 8, -h, 2.5).fill(colour)
      }
      return
    }
    case 'shrub': {
      shadow(g, 30 * s, 13 * s)
      g.ellipse(0, -16 * s, 28 * s, 19 * s).fill(colour)
      g.ellipse(-8 * s, -24 * s, 18 * s, 12 * s).fill({ color: 0xffffff, alpha: 0.08 })
      if (showAccent)
        for (let i = 0; i < 14; i++)
          g.circle((r[i]! - 0.5) * 46 * s, -(6 + r[i + 10]! * 26) * s, 3 * Math.max(1, s)).fill(
            accent,
          )
      return
    }
    case 'tree': {
      shadow(g, 34 * s, 15 * s)
      g.poly([-5 * s, 0, 5 * s, 0, 3 * s, -60 * s, -3 * s, -60 * s]).fill(0x5d4330)
      g.circle(0, -72 * s, 30 * s).fill(colour)
      g.circle(-18 * s, -60 * s, 20 * s).fill(colour)
      g.circle(18 * s, -62 * s, 20 * s).fill(colour)
      g.circle(-6 * s, -84 * s, 16 * s).fill({ color: 0xffffff, alpha: 0.08 })
      if (showAccent)
        for (let i = 0; i < 18; i++)
          g.circle((r[i]! - 0.5) * 64 * s, -(48 + r[i + 5]! * 46) * s, 3.2 * Math.max(1, s)).fill(
            accent,
          )
      return
    }
    case 'conifer': {
      shadow(g, 26 * s, 11 * s)
      g.rect(-3 * s, -14 * s, 6 * s, 14 * s).fill(0x5d4330)
      for (let i = 0; i < 3; i++) {
        const y = -(12 + i * 16) * s
        const w = (24 - i * 6) * s
        g.poly([-w, y, w, y, 0, y - 26 * s]).fill(i % 2 ? colour : accent)
      }
      return
    }
    case 'reed': {
      for (let i = 0; i < 9; i++) {
        const x = (r[i]! - 0.5) * 26 * s
        const h = (34 + r[i + 9]! * 30) * s
        g.moveTo(x, 0)
          .lineTo(x + (r[i + 3]! - 0.5) * 6, -h)
          .stroke({ color: colour, width: 2.5 })
        if (showAccent) g.roundRect(x - 2.5, -h - 4, 5, 12 * s, 2).fill(accent)
      }
      return
    }
    case 'floating': {
      for (let i = 0; i < 4; i++) {
        const x = (r[i]! - 0.5) * 34 * s
        const y = (r[i + 4]! - 0.5) * 14 * s
        g.ellipse(x, y, 12 * s, 6 * s).fill(colour)
        g.moveTo(x, y)
          .lineTo(x + 9 * s, y - 2 * s)
          .stroke({ color: 0x7aa1af, width: 1.5 })
      }
      if (showAccent) {
        g.circle(0, -4 * s, 6 * s).fill(accent)
        g.circle(0, -6 * s, 3 * s).fill(0xf2d06b)
      }
      return
    }
    case 'submerged': {
      for (let i = 0; i < 6; i++) {
        const x = (r[i]! - 0.5) * 34 * s
        g.moveTo(x, 6 * s)
          .quadraticCurveTo(x + 8, -6 * s, x - 2, -16 * s)
          .stroke({ color: colour, width: 3, alpha: 0.75 })
      }
      return
    }
    case 'cushion': {
      g.ellipse(0, -4 * s, 24 * s, 11 * s).fill(colour)
      for (let i = 0; i < 10; i++)
        g.circle((r[i]! - 0.5) * 38 * s, -(r[i + 10]! * 10 + 1) * s, 2.5).fill(
          showAccent ? accent : 0xffffff,
        )
      return
    }
    case 'fern': {
      shadow(g, 22 * s, 9 * s)
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.38
        const len = (28 + r[i]! * 10) * s
        g.moveTo(0, 0)
          .quadraticCurveTo(
            Math.cos(a) * len * 0.5,
            Math.sin(a) * len * 0.9,
            Math.cos(a) * len,
            Math.sin(a) * len * 0.75,
          )
          .stroke({ color: i % 2 ? colour : accent, width: 4, cap: 'round' })
      }
      return
    }
    case 'fungus': {
      for (let i = 0; i < 4; i++) {
        const x = (r[i]! - 0.5) * 26 * s
        const y = -(r[i + 4]! * 6) * s
        g.rect(x - 2, y - 8 * s, 4, 8 * s).fill(0xe8dcc0)
        g.ellipse(x, y - 9 * s, 9 * s, 5 * s).fill(colour)
        if (look.accent) g.circle(x - 2, y - 11 * s, 1.6).fill(accent)
      }
      return
    }
    case 'lichen': {
      for (let i = 0; i < 6; i++)
        g.ellipse((r[i]! - 0.5) * 34 * s, (r[i + 6]! - 0.5) * 12 * s, 7 * s, 4 * s).fill(
          i % 2 ? colour : accent,
        )
      return
    }
    case 'vine': {
      for (let i = 0; i < 5; i++) {
        const x = (r[i]! - 0.5) * 30 * s
        g.moveTo(x, 0)
          .bezierCurveTo(x + 14, -10 * s, x - 14, -22 * s, x + 4, -34 * s)
          .stroke({ color: colour, width: 2 })
        g.ellipse(x + 4, -34 * s, 5, 3).fill(colour)
        g.ellipse(x - 3, -18 * s, 5, 3).fill(colour)
      }
      if (showAccent)
        for (let i = 0; i < 6; i++)
          g.circle((r[i + 10]! - 0.5) * 32 * s, -(10 + r[i]! * 24) * s, 3).fill(accent)
      return
    }
    default:
      g.circle(0, -10, 10).fill(0xff00ff)
  }
}

/** A creature from its look, in one of two animation frames. */
export function drawCreatureLook(g: Graphics, look: Look, frame: number): void {
  const c = hex(look.colour)
  const a = hex(look.accent, 0x3a3428)
  const k = look.size ?? 1
  const open = frame === 0 ? 1 : 0.4
  switch (look.form) {
    case 'butterfly':
    case 'moth': {
      const w = look.form === 'moth' ? 1.2 : 1
      g.ellipse(-7 * open * k * w, -2, 7 * open * k * w, 9 * k)
        .fill(c)
        .stroke({ color: a, width: 1 })
      g.ellipse(7 * open * k * w, -2, 7 * open * k * w, 9 * k)
        .fill(c)
        .stroke({ color: a, width: 1 })
      g.rect(-1, -8 * k, 2, 12 * k).fill(a)
      return
    }
    case 'bee':
    case 'fly': {
      g.ellipse(-4, -8 * k, 5, (3 + frame * 2) * k).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(4, -8 * k, 5, (3 + frame * 2) * k).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(0, 0, 7 * k, 5 * k).fill(c)
      if (look.form === 'bee') g.rect(-1, -4 * k, 2, 8 * k).fill(a)
      else g.circle(-5 * k, -1, 2.5 * k).fill(a)
      return
    }
    case 'dragonfly': {
      g.rect(-1.5, -3, 3, 22 * k).fill(c)
      g.circle(0, -4, 3 * k).fill(a)
      for (const side of [-1, 1]) {
        g.ellipse(side * 10 * k, -1 + frame, 10 * k, 2.6 * k).fill({ color: 0xffffff, alpha: 0.65 })
        g.ellipse(side * 9 * k, 4 - frame, 9 * k, 2.4 * k).fill({ color: 0xffffff, alpha: 0.6 })
      }
      return
    }
    case 'beetle':
    case 'insect': {
      g.ellipse(0, 0, 6 * k, 8 * k).fill(c)
      g.moveTo(0, -8 * k)
        .lineTo(0, 8 * k)
        .stroke({ color: a, width: 1 })
      g.circle(0, -9 * k, 3 * k).fill(a)
      for (const side of [-1, 1])
        for (let i = 0; i < 3; i++)
          g.moveTo(side * 5 * k, (i - 1) * 4 * k)
            .lineTo(side * (9 + frame) * k, (i - 1) * 5 * k)
            .stroke({ color: a, width: 1 })
      return
    }
    case 'spider': {
      g.circle(0, 0, 5 * k).fill(c)
      g.circle(0, -6 * k, 3 * k).fill(a)
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++)
          g.moveTo(side * 3 * k, (i - 1.5) * 2 * k)
            .lineTo(side * (11 + frame) * k, (i - 1.5) * 5 * k)
            .stroke({ color: a, width: 1 })
      return
    }
    case 'snail': {
      g.ellipse(0, 2, 10 * k, 3 * k).fill(a)
      g.circle(2 * k, -4 * k, 6 * k).fill(c)
      g.circle(2 * k, -4 * k, 3 * k).stroke({ color: a, width: 1 })
      return
    }
    case 'bird':
    case 'waterbird': {
      const wing = frame === 0 ? -6 : 2
      g.ellipse(0, 0, 9 * k, 6 * k).fill(c)
      g.circle(7 * k, -5 * k, 4.5 * k).fill(c)
      g.poly([11 * k, -5 * k, 15 * k, -4 * k, 11 * k, -3 * k]).fill(0xe8b54a)
      g.ellipse(-2 * k, wing * k * 0.5, 7 * k, 3.5 * k).fill(a)
      if (look.form === 'waterbird')
        g.rect(-6 * k, 5 * k, 14 * k, 2).fill({ color: 0xa9c8d2, alpha: 0.8 })
      return
    }
    case 'bat': {
      const w = frame === 0 ? 1 : 0.6
      g.poly([0, -2, -14 * w * k, -6, -10 * w * k, 2, -4, 2]).fill(c)
      g.poly([0, -2, 14 * w * k, -6, 10 * w * k, 2, 4, 2]).fill(c)
      g.circle(0, -2, 3.5 * k).fill(a)
      return
    }
    case 'amphibian': {
      g.ellipse(0, 0, 8 * k, 6 * k).fill(c)
      g.circle(-3 * k, -5 * k, 2.2 * k).fill(c)
      g.circle(3 * k, -5 * k, 2.2 * k).fill(c)
      g.circle(-3 * k, -5.5 * k, 1).fill(a)
      g.circle(3 * k, -5.5 * k, 1).fill(a)
      g.ellipse(-7 * k, 4 + frame, 4 * k, 2 * k).fill(c)
      g.ellipse(7 * k, 4 + frame, 4 * k, 2 * k).fill(c)
      return
    }
    case 'lizard': {
      g.ellipse(0, 0, 4 * k, 9 * k).fill(c)
      g.circle(0, -9 * k, 3 * k).fill(c)
      g.moveTo(0, 8 * k)
        .quadraticCurveTo((frame ? 6 : -6) * k, 14 * k, 0, 20 * k)
        .stroke({ color: c, width: 3 })
      g.rect(-1, -4 * k, 2, 10 * k).fill(a)
      return
    }
    case 'mammal': {
      g.ellipse(0, 0, 9 * k, 6 * k).fill(c)
      g.circle(8 * k, -3 * k, 4.5 * k).fill(c)
      g.circle(9 * k, -7 * k, 2 * k).fill(a)
      g.moveTo(-9 * k, 0)
        .quadraticCurveTo(-16 * k, -4 * k + frame * 2, -18 * k, 2 * k)
        .stroke({ color: a, width: 2 })
      return
    }
    default:
      g.circle(0, 0, 6).fill(c)
  }
}

/** A built structure or decoration from its look; `level` makes improved structures bigger. */
export function drawThingLook(g: Graphics, look: Look, level: number, variant = ''): void {
  const c = hex(look.colour)
  const a = hex(look.accent, 0x5d4330)
  const k = (look.size ?? 1) * (1 + level * 0.12)
  switch (look.form) {
    case 'box': {
      g.ellipse(0, 0, 12 * k, 5 * k).fill({ color: 0x30302a, alpha: 0.3 })
      g.rect(-2.5, -46 * k, 5, 46 * k).fill(a)
      g.rect(-11 * k, -66 * k, 22 * k, 24 * k).fill(c)
      g.poly([-14 * k, -64 * k, 0, -76 * k, 14 * k, -64 * k]).fill(a)
      g.circle(0, -56 * k, 3.5 * k).fill(0x2a2620)
      return
    }
    case 'pile': {
      g.ellipse(0, 0, 32 * k, 13 * k).fill({ color: 0x30302a, alpha: 0.3 })
      const r = scatter(level + 11, 16)
      for (let i = 0; i < 8; i++)
        g.ellipse((r[i]! - 0.5) * 44 * k, -(r[i + 8]! * 22 + 4) * k, 11 * k, 8 * k).fill(
          i % 3 ? c : a,
        )
      return
    }
    case 'mound': {
      g.ellipse(0, 0, 32 * k, 13 * k).fill({ color: 0x30302a, alpha: 0.3 })
      g.ellipse(0, -8 * k, 28 * k, 13 * k).fill(c)
      for (const x of [-22, 22]) g.rect(x * k - 3, -18 * k, 6, 18 * k).fill(a)
      if (variant === 'full') g.ellipse(0, -14 * k, 20 * k, 7 * k).fill(0x6b4c33)
      return
    }
    case 'arch': {
      g.ellipse(0, 0, 28 * k, 11 * k).fill({ color: 0x30302a, alpha: 0.3 })
      g.ellipse(0, -10 * k, 24 * k, 14 * k).fill(c)
      g.ellipse(0, -4 * k, 9 * k, 7 * k).fill(0x2f2a22)
      g.ellipse(-12 * k, -18 * k, 8 * k, 4 * k).fill(a)
      return
    }
    case 'stone': {
      g.ellipse(0, 0, 18 * k, 7 * k).fill({ color: 0x30302a, alpha: 0.3 })
      g.poly([-12 * k, 0, -9 * k, -38 * k, 4 * k, -46 * k, 12 * k, -30 * k, 12 * k, 0]).fill(c)
      g.poly([4 * k, -46 * k, 12 * k, -30 * k, 12 * k, 0, 4 * k, 0]).fill(a)
      return
    }
    case 'bench': {
      g.rect(-26 * k, -14 * k, 52 * k, 6 * k).fill(c)
      for (const x of [-20, 18]) g.rect(x * k, -10 * k, 4 * k, 10 * k).fill(a)
      return
    }
    case 'bridge': {
      g.moveTo(-44 * k, 6 * k)
        .quadraticCurveTo(0, -30 * k, 44 * k, 6 * k)
        .stroke({ color: c, width: 12 * k })
      g.moveTo(-40 * k, -2 * k)
        .quadraticCurveTo(0, -38 * k, 40 * k, -2 * k)
        .stroke({ color: a, width: 3 })
      return
    }
    case 'pavilion': {
      g.ellipse(0, 0, 50 * k, 20 * k).fill({ color: 0x30302a, alpha: 0.3 })
      g.poly([-40 * k, -4 * k, 0, 12 * k, 40 * k, -4 * k, 0, -20 * k]).fill(0xb9b2a2)
      for (const [x, y] of [
        [-30, -6],
        [30, -6],
        [0, 6],
        [0, -16],
      ] as const)
        g.rect((x - 2) * k, (y - 46) * k, 4 * k, 46 * k).fill(a)
      g.poly([-50 * k, -50 * k, 0, -78 * k, 50 * k, -50 * k, 0, -36 * k]).fill(c)
      return
    }
    case 'boardwalk': {
      for (let i = -2; i <= 2; i++)
        g.poly([
          -34 + i * 12,
          -i * 6 - 3,
          -22 + i * 12,
          -i * 6 - 9,
          22 + i * 12,
          -i * 6 + 13,
          10 + i * 12,
          -i * 6 + 19,
        ]).fill(i % 2 ? c : a)
      return
    }
    case 'bank': {
      g.ellipse(0, -6 * k, 30 * k, 14 * k).fill(c)
      const r = scatter(5, 12)
      for (let i = 0; i < 8; i++)
        g.circle((r[i]! - 0.5) * 40 * k, -(r[i + 4]! * 14 + 2) * k, 2.2).fill(a)
      return
    }
    case 'gravel': {
      g.poly([-50, 0, 0, -25, 50, 0, 0, 25]).fill(c)
      for (let i = -3; i <= 3; i++)
        g.moveTo(-40 + Math.abs(i) * 4, i * 5)
          .lineTo(40 - Math.abs(i) * 4, i * 5)
          .stroke({ color: a, width: 1.5, alpha: 0.7 })
      return
    }
    case 'post': {
      g.rect(-3, -50 * k, 6, 50 * k).fill(a)
      g.ellipse(0, -52 * k, 14 * k, 6 * k).fill(c)
      return
    }
    default:
      g.rect(-16, -30, 32, 30).fill(0xff00ff)
  }
}
