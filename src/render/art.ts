// Placeholder art, drawn in code. Every sprite is requested by a texture key
// (for example "plant:fern:2"), so final watercolour art can replace these
// drawings through the same keys without touching the rest of the renderer.
//
// Each drawing is made around its base point: (0, 0) is where the object
// touches the ground at the centre of its tile.

import { Graphics, type Renderer, type Texture } from 'pixi.js'
import { TILE_H, TILE_W } from './iso'

export interface ArtTexture {
  texture: Texture
  anchorX: number
  anchorY: number
}

const HW = TILE_W / 2
const HH = TILE_H / 2

function diamond(g: Graphics, scale = 1, dy = 0): Graphics {
  return g.poly([0, -HH * scale + dy, HW * scale, dy, 0, HH * scale + dy, -HW * scale, dy])
}

/** Deterministic pseudo-random values for decoration placement inside a drawing. */
function scatter(seed: number, n: number): number[] {
  const out: number[] = []
  let s = seed * 9301 + 49297
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280
    out.push(s / 233280)
  }
  return out
}

const TERRAIN_COLOURS: Record<string, [number, number]> = {
  grass: [0xa9b97a, 0xa2b373],
  moss: [0x7f9a4f, 0x78934a],
  path: [0xb9b2a2, 0xb2ab9b],
  water: [0x7fa7b5, 0x7aa1af],
  margin: [0x8f9a6a, 0x899466],
  overgrown: [0x7d8c54, 0x76854f],
  boundary: [0x5b6b45, 0x56653f],
}

function drawTerrain(g: Graphics, terrain: string, variant: number): void {
  const [a, b] = TERRAIN_COLOURS[terrain] ?? [0xff00ff, 0xff00ff]
  const base = variant % 2 === 0 ? a : b
  if (terrain === 'boundary') {
    // A hedge block rising above the ground.
    const h = 34
    g.poly([-HW, 0, 0, HH, 0, HH - h, -HW, -h]).fill(0x4a5a38)
    g.poly([HW, 0, 0, HH, 0, HH - h, HW, -h]).fill(0x3f4e30)
    diamond(g, 1, -h).fill(base)
    const r = scatter(variant + 7, 8)
    for (let i = 0; i < 4; i++)
      g.circle((r[i]! - 0.5) * HW, -h + (r[i + 4]! - 0.5) * HH, 6).fill(0x667a4c)
    return
  }
  diamond(g).fill(base)
  const r = scatter(variant + terrain.length * 13, 12)
  if (terrain === 'water') {
    g.moveTo(-28, -4)
      .quadraticCurveTo(-14, -10, 0, -4)
      .stroke({ color: 0xa9c8d2, width: 2, alpha: 0.7 })
    g.moveTo(6, 8).quadraticCurveTo(18, 2, 30, 8).stroke({ color: 0xa9c8d2, width: 2, alpha: 0.6 })
  } else if (terrain === 'path') {
    for (let i = 0; i < 4; i++) {
      g.ellipse((r[i]! - 0.5) * HW, (r[i + 4]! - 0.5) * HH, 14, 7).fill({
        color: 0xd2ccbd,
        alpha: 0.8,
      })
    }
  } else if (terrain === 'moss') {
    for (let i = 0; i < 6; i++)
      g.circle((r[i]! - 0.5) * HW, (r[i + 6]! - 0.5) * HH, 3).fill(0x9ab664)
  } else if (terrain === 'margin') {
    for (let i = 0; i < 4; i++)
      g.circle((r[i]! - 0.5) * HW, (r[i + 4]! - 0.5) * HH, 4).fill(0x6e7a52)
  } else if (terrain === 'overgrown') {
    for (let i = 0; i < 9; i++) {
      const x = (r[i]! - 0.5) * HW * 1.1
      const y = (r[(i + 3) % 12]! - 0.5) * HH * 1.1
      g.moveTo(x, y)
        .lineTo(x - 5, y - 18)
        .stroke({ color: 0x5b6b3a, width: 3 })
      g.moveTo(x, y)
        .lineTo(x + 6, y - 14)
        .stroke({ color: 0x66783f, width: 3 })
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const x = (r[i]! - 0.5) * HW
      const y = (r[i + 3]! - 0.5) * HH
      g.moveTo(x, y)
        .lineTo(x - 2, y - 6)
        .stroke({ color: 0x8fa262, width: 2 })
    }
  }
}

const FLOWER_COLOURS = [0xe58fa8, 0xf2d06b, 0xf7f3ea, 0xa58fd8, 0xe58fa8, 0xf2d06b]

function drawPlant(g: Graphics, id: string, stage: number): void {
  const r = scatter(stage + id.length, 16)
  switch (id) {
    case 'wildflower-mix': {
      g.ellipse(0, 0, 22, 9).fill(0x8a7050)
      if (stage === 0) {
        for (let i = 0; i < 5; i++)
          g.circle((r[i]! - 0.5) * 30, (r[i + 5]! - 0.5) * 10, 2).fill(0xe2b04a)
        return
      }
      const stems = 4 + stage * 3
      const height = 8 + stage * 8
      for (let i = 0; i < stems; i++) {
        const x = (r[i % 16]! - 0.5) * 38
        const h = height * (0.6 + r[(i + 3) % 16]! * 0.4)
        g.moveTo(x, 0)
          .lineTo(x + (r[(i + 7) % 16]! - 0.5) * 8, -h)
          .stroke({ color: 0x5f8a3e, width: 2 })
        if (stage === 2) g.circle(x, -h, 3).fill(0x8bb05a)
        if (stage >= 3) g.circle(x, -h, 4.5).fill(FLOWER_COLOURS[i % FLOWER_COLOURS.length]!)
      }
      return
    }
    case 'garden-moss': {
      const size = [10, 22, 34][stage] ?? 34
      g.ellipse(0, 0, size, size / 2).fill(0x6f8f3e)
      for (let i = 0; i < 3 + stage * 3; i++) {
        g.circle((r[i]! - 0.5) * size * 1.4, (r[i + 8]! - 0.5) * size * 0.6, 3 + stage).fill(
          0x8db055,
        )
      }
      return
    }
    case 'fern': {
      if (stage === 0) {
        g.circle(-4, -8, 5).stroke({ color: 0x6f9a48, width: 3 })
        g.circle(5, -6, 4).stroke({ color: 0x6f9a48, width: 3 })
        return
      }
      const length = stage === 1 ? 20 : 34
      for (let i = 0; i < 7; i++) {
        const angle = Math.PI * (0.1 + (0.8 * i) / 6)
        const x = -Math.cos(angle) * length
        const y = -Math.sin(angle) * length * 0.9
        g.moveTo(0, 0)
          .quadraticCurveTo(x * 0.5, y * 1.1, x, y)
          .stroke({ color: i % 2 ? 0x4f7a37 : 0x5f8c42, width: 6 })
      }
      return
    }
    case 'ornamental-grass': {
      const blades = 5 + stage * 5
      const height = 12 + stage * 14
      for (let i = 0; i < blades; i++) {
        const x = (r[i % 16]! - 0.5) * 20
        const lean = (r[(i + 5) % 16]! - 0.5) * 30
        g.moveTo(x, 0)
          .quadraticCurveTo(x + lean * 0.3, -height * 0.6, x + lean, -height)
          .stroke({ color: 0x9aa65a, width: 2 })
        if (stage >= 2) g.circle(x + lean, -height, 2.5).fill(0xd8c48a)
      }
      return
    }
    case 'japanese-maple': {
      const trunk = [10, 26, 50, 70][stage] ?? 70
      const canopy = [8, 18, 34, 48][stage] ?? 48
      g.ellipse(0, 0, 10 + stage * 4, 5 + stage * 2).fill({ color: 0x3e3a2a, alpha: 0.25 })
      g.rect(-2 - stage, -trunk, 4 + stage * 2, trunk).fill(0x5a3e2b)
      const colours = [0xb5452f, 0xc8583a, 0xa63a2a]
      for (let i = 0; i < 5; i++) {
        g.circle(
          (r[i]! - 0.5) * canopy,
          -trunk - (r[i + 5]! - 0.3) * canopy * 0.7,
          canopy * 0.45,
        ).fill(colours[i % 3]!)
      }
      return
    }
    case 'soft-rush': {
      const stems = 4 + stage * 5
      const height = 14 + stage * 14
      for (let i = 0; i < stems; i++) {
        const x = (r[i % 16]! - 0.5) * 22
        const h = height * (0.7 + r[(i + 2) % 16]! * 0.3)
        g.moveTo(x, 0)
          .lineTo(x + (r[(i + 9) % 16]! - 0.5) * 6, -h)
          .stroke({ color: 0x4f6e3a, width: 2.5 })
        if (stage >= 2 && i % 3 === 0) g.ellipse(x, -h * 0.75, 2.5, 4).fill(0x8a6a3a)
      }
      return
    }
    case 'bamboo': {
      // Clumps of jointed culms; taller and more numerous as the clump grows.
      g.ellipse(0, 0, 20 + stage * 6, 8 + stage * 3).fill({ color: 0x2e3a24, alpha: 0.25 })
      const culms = [3, 7, 12][stage] ?? 12
      const height = [26, 80, 140][stage] ?? 140
      for (let i = 0; i < culms; i++) {
        const x = (r[i % 16]! - 0.5) * (20 + stage * 22)
        const h = height * (0.65 + r[(i + 5) % 16]! * 0.35)
        g.rect(x - 2.5, -h, 5, h).fill(i % 2 ? 0x8fae5a : 0x7d9c4c)
        for (let k = 1; k < 5; k++) g.rect(x - 3.5, -h * (k / 5), 7, 2).fill(0x6f8a45)
        if (stage > 0) {
          g.ellipse(x + 9, -h + 6, 11, 3.5).fill(0x9cbc66)
          g.ellipse(x - 8, -h * 0.7, 10, 3).fill(0x8fae5a)
        }
      }
      return
    }
    case 'forest-grass': {
      // Arching blades that all lean the same way.
      const blades = 6 + stage * 6
      const height = 10 + stage * 10
      for (let i = 0; i < blades; i++) {
        const x = (r[i % 16]! - 0.5) * (14 + stage * 10)
        const h = height * (0.7 + r[(i + 4) % 16]! * 0.3)
        g.moveTo(x, 0)
          .quadraticCurveTo(x + h * 0.2, -h, x + h * 0.9, -h * 0.55)
          .stroke({ color: i % 2 ? 0xb5c44f : 0x9fb043, width: 2.5 })
      }
      return
    }
    case 'hosta': {
      const size = [8, 14, 20][stage] ?? 20
      const leaves = 4 + stage * 2
      for (let i = 0; i < leaves; i++) {
        const angle = (i / leaves) * Math.PI * 2
        const x = Math.cos(angle) * size * 0.8
        const y = Math.sin(angle) * size * 0.35 - size * 0.4
        g.ellipse(x, y, size * 0.55, size * 0.3).fill(i % 2 ? 0x6f9a7a : 0x5f8a6c)
        g.moveTo(x - size * 0.4, y)
          .lineTo(x + size * 0.4, y)
          .stroke({ color: 0x8fb89a, width: 1 })
      }
      if (stage >= 2) {
        for (const x of [-6, 5]) {
          g.moveTo(x, -size)
            .lineTo(x + 2, -size - 26)
            .stroke({ color: 0x5f8a6c, width: 2 })
          for (let k = 0; k < 4; k++) g.ellipse(x + 2, -size - 12 - k * 5, 3, 2.2).fill(0xb7a3d8)
        }
      }
      return
    }
    case 'old-pine': {
      g.ellipse(0, 0, 36, 16).fill({ color: 0x2e3a24, alpha: 0.3 })
      g.poly([-8, 0, 8, 0, 4, -90, -4, -90]).fill(0x4e3a2a)
      const tiers: [number, number, number][] = [
        [-30, -60, 30],
        [28, -78, 26],
        [-14, -104, 30],
        [16, -128, 22],
        [0, -146, 18],
      ]
      for (const [x, y, w] of tiers) {
        g.ellipse(x, y, w, w * 0.45).fill(0x2f4a2c)
        g.ellipse(x, y - 4, w * 0.8, w * 0.32).fill(0x3d5c36)
      }
      return
    }
    case 'old-azalea': {
      // A clipped, rounded mound of small dark leaves.
      g.ellipse(0, 0, 34, 15).fill({ color: 0x2e3a24, alpha: 0.3 })
      g.ellipse(0, -16, 30, 20).fill(0x3a5530)
      g.ellipse(-8, -24, 20, 14).fill(0x456a38)
      g.ellipse(10, -20, 16, 11).fill(0x4d723d)
      for (let i = 0; i < 9; i++)
        g.circle((r[i]! - 0.5) * 44, -10 - r[i + 6]! * 24, 2).fill(0x6a8f4c)
      return
    }
    default:
      g.circle(0, -10, 10).fill(0xff00ff)
  }
}

function drawStructure(g: Graphics, id: string, variant: string): void {
  if (id === 'sap-feeder') {
    g.ellipse(0, 0, 14, 6).fill({ color: 0x30302a, alpha: 0.3 })
    g.rect(-2.5, -40, 5, 40).fill(0xc9b46a)
    g.rect(-3.5, -30, 7, 2).fill(0xa8944f)
    g.ellipse(0, -42, 15, 6).fill(0xb8a35e)
    g.ellipse(0, -43, 12, 4).fill(variant === 'full' ? 0xe3a84a : 0x8f7f4a)
    if (variant === 'full') g.ellipse(-3, -44, 4, 1.2).fill({ color: 0xffffff, alpha: 0.5 })
    return
  }
  if (id !== 'natural-shelter') {
    g.rect(-16, -30, 32, 30).fill(0xff00ff)
    return
  }
  if (variant === 'mossy-lodge') {
    g.ellipse(0, 0, 44, 18).fill({ color: 0x3a3020, alpha: 0.3 })
    for (const [x, y] of [
      [-34, 2],
      [32, 0],
      [-8, 12],
      [14, 10],
    ] as const)
      g.ellipse(x, y, 11, 7).fill(0x9a9a92)
    for (const [x, y, w, rot] of [
      [-18, -8, 44, 0.2],
      [16, -10, 42, -0.25],
      [0, -22, 46, 0.05],
      [-6, -34, 36, -0.3],
    ] as const) {
      const dx = Math.cos(rot) * w
      const dy = Math.sin(rot) * w * 0.5
      g.moveTo(x - dx / 2, y - dy / 2)
        .lineTo(x + dx / 2, y + dy / 2)
        .stroke({ color: 0x6b4c33, width: 11, cap: 'round' })
    }
    g.poly([-38, -32, 0, -54, 38, -32, 0, -22]).fill(0x5d4330)
    g.ellipse(-6, -42, 22, 8).fill(0x7f9a4f)
    g.ellipse(14, -36, 12, 5).fill(0x8db055)
    g.ellipse(4, -10, 9, 4).fill(0xd8b25a)
    return
  }
  if (variant === 'insect-hotel') {
    g.ellipse(0, 0, 30, 12).fill({ color: 0x3a3020, alpha: 0.3 })
    g.rect(-4, -18, 8, 18).fill(0x6b4c33)
    g.rect(-24, -60, 48, 42).fill(0x7a5a3c)
    g.poly([-30, -60, 0, -76, 30, -60]).fill(0x5d4330)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const x = -18 + col * 9
        const y = -52 + row * 12
        g.circle(x, y, 3.6).fill(0xc9b46a)
        g.circle(x, y, 1.8).fill(0x3a3020)
      }
    }
    return
  }
  if (variant === 'log-lodge') {
    g.ellipse(0, 0, 46, 18).fill({ color: 0x3a3020, alpha: 0.3 })
    for (const [x, y, w] of [
      [-20, -8, 46],
      [18, -10, 44],
      [0, -24, 50],
      [-6, -38, 40],
    ] as const) {
      g.moveTo(x - w / 2, y)
        .lineTo(x + w / 2, y + 4)
        .stroke({ color: 0x5d4330, width: 13, cap: 'round' })
      g.circle(x + w / 2, y + 4, 6).fill(0xa4743d)
    }
    g.poly([-40, -40, 0, -64, 40, -40, 0, -30]).fill(0x4e3a2a)
    g.ellipse(-4, -48, 16, 6).fill(0x7f9a4f)
    g.ellipse(0, -6, 7, 6).fill(0x2a2018)
    return
  }
  if (variant === 'nesting-bundle') {
    g.ellipse(0, 0, 26, 10).fill({ color: 0x3a3020, alpha: 0.3 })
    g.rect(-3, -50, 6, 50).fill(0x6b4c33)
    for (let i = -3; i <= 3; i++)
      g.rect(-18, -66 + i * 3.4, 36, 3).fill(i % 2 ? 0xc9b46a : 0xb8a35e)
    g.moveTo(-20, -72).lineTo(20, -52).stroke({ color: 0x5d4330, width: 2 })
    g.ellipse(0, -62, 7, 6).fill(0x2a2018)
    for (const [x, y] of [
      [-14, -74],
      [12, -76],
      [16, -60],
    ] as const)
      g.ellipse(x, y, 5, 3).fill(0xc8583a)
    return
  }
  const level = Number(variant)
  g.ellipse(0, 0, 34 + level * 8, 14 + level * 3).fill({ color: 0x3a3020, alpha: 0.3 })
  if (level >= 1) {
    for (const [x, y] of [
      [-30, 2],
      [28, 0],
      [-6, 10],
    ] as const) {
      g.ellipse(x, y, 10, 6).fill(0x9a9a92)
    }
  }
  const logs: [number, number, number][] = [
    [-18, -8, 0.2],
    [16, -10, -0.25],
    [0, -18, 0.05],
    [-8, -28, -0.4],
    [10, -30, 0.45],
  ]
  for (const [x, y, rot] of logs) {
    const len = 30 + level * 6
    const dx = Math.cos(rot) * len
    const dy = Math.sin(rot) * len * 0.5
    g.moveTo(x - dx / 2, y - dy / 2)
      .lineTo(x + dx / 2, y + dy / 2)
      .stroke({ color: 0x6b4c33, width: 9, cap: 'round' })
  }
  g.ellipse(-4, -22, 16, 7).fill(0xa4743d)
  if (level >= 1) {
    g.poly([-36, -30, 0, -52, 36, -30, 0, -20]).fill(0x5d4330)
    g.ellipse(0, -40, 12, 5).fill(0x7f9a4f)
  }
}

function drawDecoration(g: Graphics, id: string, variant: string): void {
  switch (id) {
    case 'stepping-stone':
      g.ellipse(0, 0, 26, 13).fill(0x8f8a80)
      g.ellipse(-2, -2, 22, 10).fill(0xb3ada2)
      return
    case 'stone-path':
      diamond(g, 0.82).fill(0x9a958a)
      diamond(g, 0.4, -6).fill(0xb8b2a6)
      diamond(g, 0.32, 10).fill(0xb3ada1)
      return
    case 'stone-arrangement':
      g.ellipse(0, 0, 34, 14).fill({ color: 0x30302a, alpha: 0.25 })
      g.ellipse(-12, -12, 18, 14).fill(0x8c877c)
      g.ellipse(14, -6, 12, 9).fill(0x9f998d)
      g.ellipse(2, -2, 8, 6).fill(0xaaa497)
      return
    case 'stone-lantern':
      g.ellipse(0, 0, 18, 8).fill({ color: 0x30302a, alpha: 0.3 })
      g.rect(-6, -40, 12, 40).fill(0x9a958a)
      g.rect(-14, -52, 28, 12).fill(0xa8a296)
      g.rect(-11, -66, 22, 14).fill(0x8c877c)
      g.rect(-6, -63, 12, 8).fill(0xe8d9a0)
      g.poly([-20, -66, 0, -82, 20, -66]).fill(0x9a958a)
      g.circle(-6, -30, 4).fill(0x7f9a4f)
      return
    case 'stone-basin':
      g.ellipse(0, 0, 26, 12).fill({ color: 0x30302a, alpha: 0.3 })
      g.ellipse(0, -8, 22, 12).fill(0x8c877c)
      g.ellipse(0, -12, 16, 7).fill(0x6f8fa0)
      g.ellipse(-3, -13, 6, 2).fill({ color: 0xffffff, alpha: 0.4 })
      g.ellipse(-24, -2, 7, 5).fill(0x9a958a)
      return
    case 'bamboo-fence':
      g.ellipse(0, 0, 30, 10).fill({ color: 0x30302a, alpha: 0.2 })
      for (let i = -3; i <= 3; i++) {
        const x = i * 8
        g.rect(x - 2, -26 + Math.abs(i), 4, 26 - Math.abs(i) + i * 1.5).fill(
          i % 2 ? 0xc9b46a : 0xb8a35e,
        )
      }
      g.moveTo(-28, -16).lineTo(28, -4).stroke({ color: 0x6b4c33, width: 3 })
      g.moveTo(-28, -8).lineTo(28, 4).stroke({ color: 0x6b4c33, width: 3 })
      return
    case 'bamboo-water-spout':
      g.ellipse(0, 0, 28, 12).fill({ color: 0x30302a, alpha: 0.3 })
      g.ellipse(8, -6, 18, 9).fill(0x8c877c)
      g.ellipse(8, -8, 13, 5).fill(0x6f8fa0)
      g.rect(-18, -40, 5, 40).fill(0xb8a35e)
      g.moveTo(-16, -34).lineTo(8, -22).stroke({ color: 0xc9b46a, width: 5, cap: 'round' })
      g.moveTo(8, -20).lineTo(8, -10).stroke({ color: 0xa9c8d2, width: 2, alpha: 0.8 })
      return
    case 'maple-leaf-lantern':
      g.ellipse(0, 0, 16, 7).fill({ color: 0x30302a, alpha: 0.3 })
      g.rect(-5, -30, 10, 30).fill(0x9a958a)
      g.rect(-11, -44, 22, 14).fill(0x8c877c)
      g.rect(-5, -41, 10, 8).fill(0xf0c070)
      g.poly([-15, -44, 0, -56, 15, -44]).fill(0x9a958a)
      for (const [x, y] of [
        [-12, -46],
        [10, -48],
        [0, -54],
        [-6, -20],
      ] as const) {
        g.ellipse(x, y, 5, 3).fill(0xc8583a)
      }
      return
    case 'old-boulder':
      g.ellipse(0, 0, 40, 18).fill({ color: 0x30302a, alpha: 0.3 })
      g.ellipse(0, -18, 36, 26).fill(0x85807a)
      g.ellipse(-6, -24, 26, 16).fill(0x98928a)
      g.circle(10, -28, 4).fill(0xb7c08a)
      g.circle(-14, -14, 3).fill(0xb7c08a)
      return
    case 'grove-gate': {
      const open = variant === 'open'
      if (open) {
        for (const x of [-18, -4, 12, 24]) {
          g.rect(x, -110, 5, 100).fill(0x8fae5a)
          g.rect(x, -70, 5, 2).fill(0x6f8a45)
        }
      }
      g.rect(-34, -86, 8, 86).fill(0x6b4c33)
      g.rect(26, -86, 8, 86).fill(0x6b4c33)
      g.rect(-44, -96, 88, 10).fill(0x5a3e2b)
      g.rect(-38, -80, 76, 6).fill(0x6b4c33)
      if (!open) {
        g.rect(-26, -70, 26, 70).fill(0x7a5a3c)
        g.rect(0, -70, 26, 70).fill(0x725436)
      }
      return
    }
    default:
      g.rect(-12, -24, 24, 24).fill(0xff00ff)
  }
}

function drawDrop(g: Graphics, colour: number): void {
  g.ellipse(0, 0, 9, 4).fill({ color: 0x000000, alpha: 0.2 })
  g.circle(0, -12, 9).fill(colour).stroke({ color: 0xfaf7ee, width: 2.5 })
}

function drawCreature(g: Graphics, id: string, colour: number, frame: number): void {
  switch (id) {
    case 'small-white':
    case 'swallowtail': {
      const spread = frame === 0 ? 1 : 0.35
      const big = id === 'swallowtail' ? 1.35 : 1
      g.ellipse(-7 * spread * big, -2, 7 * spread * big, 9 * big)
        .fill(colour)
        .stroke({ color: 0x5a5040, width: 1 })
      g.ellipse(7 * spread * big, -2, 7 * spread * big, 9 * big)
        .fill(colour)
        .stroke({ color: 0x5a5040, width: 1 })
      if (id === 'swallowtail') {
        g.moveTo(-8 * spread, 6)
          .lineTo(-10 * spread, 14)
          .stroke({ color: 0x3a3428, width: 2 })
        g.moveTo(8 * spread, 6)
          .lineTo(10 * spread, 14)
          .stroke({ color: 0x3a3428, width: 2 })
      }
      g.rect(-1, -8, 2, 12).fill(0x3a3428)
      return
    }
    case 'bumblebee':
      g.ellipse(-4, -9, 5, 3 + frame * 2).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(4, -9, 5, 3 + frame * 2).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(0, 0, 9, 7).fill(colour)
      g.rect(-2, -6, 3, 12).fill(0x2a2620)
      g.rect(4, -5, 2, 10).fill(0x2a2620)
      return
    case 'ground-beetle':
      g.ellipse(0, 0, 8, 5).fill(colour)
      g.ellipse(-1, -1, 4, 2).fill({ color: 0x8a86a0, alpha: 0.6 })
      g.moveTo(7, -1)
        .lineTo(12, -4 + frame * 2)
        .stroke({ color: colour, width: 1.5 })
      return
    case 'white-eye':
      g.ellipse(0, 0, 9, 7).fill(colour)
      g.circle(7, -5, 5).fill(colour)
      g.circle(8, -6, 2.6).fill(0xffffff)
      g.circle(8.4, -6, 1.2).fill(0x111111)
      g.poly([-8, -2, -15, -9 - frame * 2, -11, 0]).fill(0x6f8a3a)
      g.poly([11, -6, 15, -5, 11, -4]).fill(0x3a3020)
      g.ellipse(1, 3, 6, 3).fill(0xd8d0a0)
      return
    case 'red-admiral': {
      const spread = frame === 0 ? 1 : 0.35
      for (const side of [-1, 1]) {
        g.ellipse(side * 8 * spread, -2, 8 * spread, 10).fill(0x2a2420)
        g.ellipse(side * 8 * spread, -3, 5 * spread, 2).fill(colour)
        g.circle(side * 11 * spread, -9, 1.5).fill(0xffffff)
      }
      g.rect(-1, -8, 2, 12).fill(0x2a2420)
      return
    }
    case 'mason-bee':
      g.ellipse(-3, -7, 4, 2 + frame * 1.5).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(3, -7, 4, 2 + frame * 1.5).fill({ color: 0xffffff, alpha: 0.7 })
      g.ellipse(0, 0, 7, 5).fill(colour)
      g.circle(6, -1, 3).fill(0x2a2620)
      return
    case 'wood-mouse':
      g.ellipse(0, 0, 9, 5.5).fill(colour)
      g.circle(8, -2, 4).fill(colour)
      g.circle(7, -6, 2.4).fill(0xb08a6a)
      g.circle(10, -2.5, 1).fill(0x111111)
      g.moveTo(-9, 1)
        .quadraticCurveTo(-16, -2 - frame * 2, -20, 2)
        .stroke({ color: 0x8a6a4a, width: 1.5 })
      return
    case 'wren':
      g.ellipse(0, 0, 10, 8).fill(colour)
      g.circle(8, -5, 5).fill(colour)
      g.poly([-9, -2, -16, -12 - frame * 2, -12, -1]).fill(0x7a5a3c)
      g.poly([12, -6, 17, -5, 12, -4]).fill(0x3a3020)
      g.circle(9, -6, 1.2).fill(0x111111)
      return
    default:
      g.circle(0, 0, 6).fill(colour)
  }
}

export type Overlay = 'excellent' | 'good' | 'fair' | 'poor' | 'invalid'

const OVERLAY_COLOURS: Record<Overlay, [number, number]> = {
  excellent: [0x3f9a4a, 0.45],
  good: [0x86b84a, 0.38],
  fair: [0xe0b040, 0.35],
  poor: [0xd0604a, 0.32],
  invalid: [0x40392e, 0.22],
}

/** Draws and caches placeholder textures by key. */
export class PlaceholderArt {
  private cache = new Map<string, ArtTexture>()

  private readonly renderer: Renderer
  private readonly colours: { items: Record<string, string>; wildlife: Record<string, string> }

  constructor(
    renderer: Renderer,
    colours: { items: Record<string, string>; wildlife: Record<string, string> },
  ) {
    this.renderer = renderer
    this.colours = colours
  }

  get(key: string): ArtTexture {
    let art = this.cache.get(key)
    if (!art) {
      art = this.draw(key)
      this.cache.set(key, art)
    }
    return art
  }

  private draw(key: string): ArtTexture {
    const [kind = '', id = '', variant = ''] = key.split(':')
    const g = new Graphics()
    switch (kind) {
      case 'terrain':
        drawTerrain(g, id, Number(variant))
        break
      case 'plant':
        drawPlant(g, id, Number(variant))
        break
      case 'structure':
        drawStructure(g, id, variant)
        break
      case 'decoration':
        drawDecoration(g, id, variant)
        break
      case 'drop':
        drawDrop(g, parseColour(this.colours.items[id]))
        break
      case 'creature':
        drawCreature(g, id, parseColour(this.colours.wildlife[id]), Number(variant))
        break
      case 'tile': {
        if (id === 'select') diamond(g, 0.96).stroke({ color: 0xfaf7ee, width: 4 })
        else if (id === 'valid') diamond(g, 0.96).stroke({ color: 0x3f9a4a, width: 4 })
        else if (id === 'invalid') diamond(g, 0.96).stroke({ color: 0xc0503a, width: 4 })
        else if (id === 'hover') diamond(g, 0.96).stroke({ color: 0xfaf7ee, width: 2, alpha: 0.6 })
        else if (id === 'creature') g.ellipse(0, 0, 18, 9).stroke({ color: 0xfaf7ee, width: 3 })
        break
      }
      case 'overlay': {
        const [colour, alpha] = OVERLAY_COLOURS[id as Overlay] ?? [0xff00ff, 0.5]
        diamond(g, 0.98).fill({ color: colour, alpha })
        break
      }
      case 'marker':
        if (id === 'resting') {
          // A small, calm "resting inside" bubble shown above a shelter.
          g.roundRect(-15, -11, 30, 18, 9)
            .fill({ color: 0xfaf7ee, alpha: 0.92 })
            .stroke({ color: 0x8a7a55, width: 1.5 })
          g.poly([-4, 7, 0, 13, 4, 7]).fill({ color: 0xfaf7ee, alpha: 0.92 })
          for (const x of [-7, 0, 7]) g.circle(x, -2, 2.2).fill(0x8a6a45)
        }
        break
      case 'scenery':
        drawScenery(g, id)
        break
      default:
        g.circle(0, 0, 8).fill(0xff00ff)
    }
    const bounds = g.getLocalBounds()
    const texture = this.renderer.generateTexture({ target: g, resolution: 2, antialias: true })
    g.destroy()
    return {
      texture,
      anchorX: bounds.width > 0 ? -bounds.x / bounds.width : 0.5,
      anchorY: bounds.height > 0 ? -bounds.y / bounds.height : 0.5,
    }
  }
}

function drawScenery(g: Graphics, id: string): void {
  if (id === 'bamboo') {
    const r = scatter(3, 12)
    for (let i = 0; i < 6; i++) {
      const x = (r[i]! - 0.5) * 70
      const h = 120 + r[i + 6]! * 60
      g.rect(x, -h, 6, h).fill(i % 2 ? 0x8fae5a : 0x7d9c4c)
      for (let k = 1; k < 5; k++) g.rect(x - 1, -h * (k / 5), 8, 2).fill(0x6f8a45)
      g.ellipse(x + 10, -h + 6, 12, 4).fill(0x9cbc66)
    }
  }
}

function parseColour(hex: string | undefined): number {
  return hex ? parseInt(hex.slice(1), 16) : 0xff00ff
}
