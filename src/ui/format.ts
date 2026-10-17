import type { Content } from '../core/content'

export function itemName(content: Content, id: string): string {
  return content.items[id]?.name ?? id
}

/** "Twigs ×6, Bark ×2" */
export function formatItems(content: Content, items: Record<string, number>): string {
  return Object.entries(items)
    .map(([id, n]) => `${itemName(content, id)} ×${n}`)
    .join(', ')
}

export const RATING_LABELS = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
} as const
