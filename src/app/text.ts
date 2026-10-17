// Player-facing wording shared by the controller's toasts and the React UI.

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
