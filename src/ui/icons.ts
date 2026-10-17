// Names of the interface icons in public/assets/icons, and which items have one.

export type IconName =
  | 'plant_cutting'
  | 'build'
  | 'restore'
  | 'inventory'
  | 'journal'
  | 'close'
  | 'back'
  | 'twigs'
  | 'bark'
  | 'stones'
  | 'leaf_litter'
  | 'wildflower_seeds'

/** Items that have their own icon; the rest keep a colour swatch until art arrives. */
export const ITEM_ICONS: Record<string, IconName> = {
  twigs: 'twigs',
  bark: 'bark',
  stones: 'stones',
  'leaf-litter': 'leaf_litter',
  'wildflower-seeds': 'wildflower_seeds',
}
