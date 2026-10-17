// Seeded random numbers (mulberry32). The generator state lives in GameState
// so a saved garden continues the same sequence after loading.

export interface RngHolder {
  rng: number
}

/** Returns a float in [0, 1) and advances the holder's generator state. */
export function random(holder: RngHolder): number {
  holder.rng = (holder.rng + 0x6d2b79f5) | 0
  let t = holder.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function randomInt(holder: RngHolder, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(random(holder) * (maxInclusive - minInclusive + 1))
}

export function randomRange(holder: RngHolder, min: number, max: number): number {
  return min + random(holder) * (max - min)
}

export function pick<T>(holder: RngHolder, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(random(holder) * items.length)]
}

/** True with the probability that an event of `perMinute` rate happens within `dtMs`. */
export function chance(holder: RngHolder, perMinute: number, dtMs: number): boolean {
  if (perMinute <= 0) return false
  const p = 1 - Math.exp(-perMinute * (dtMs / 60_000))
  return random(holder) < p
}
