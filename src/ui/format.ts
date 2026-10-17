import type { PlantDef, Range } from '../core/content'

export { formatItems, itemName } from '../app/text'

export const RATING_LABELS = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
} as const

/** "about 3 min", "about 2 h", "a few seconds" */
export function formatDuration(ms: number): string {
  const s = ms / 1000
  if (s < 45) return 'a few seconds'
  const min = Math.round(s / 60)
  if (min < 60) return `about ${Math.max(1, min)} min`
  const h = Math.round(min / 60)
  return `about ${h} h`
}

function describeRange(range: Range, low: string, mid: string, high: string): string {
  if (range.max <= 0.4) return low
  if (range.min >= 0.4) return high
  return mid
}

/** "Likes sun and moderate moisture" from a plant's preferred ranges. */
export function describePreferences(def: PlantDef): string {
  const light = describeRange(def.prefers.shade, 'sun', 'sun or light shade', 'shade')
  const moisture = describeRange(
    def.prefers.moisture,
    'dry ground',
    'moderate moisture',
    'damp ground',
  )
  return `Likes ${light} and ${moisture}`
}
