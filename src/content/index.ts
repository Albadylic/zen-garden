import type { Content } from '../core/content'
import chapters from './data/chapters.json'
import decorations from './data/decorations.json'
import items from './data/items.json'
import map from './data/map.json'
import plants from './data/plants.json'
import recipes from './data/recipes.json'
import structures from './data/structures.json'
import wildlife from './data/wildlife.json'
import { loadContent } from './loader'

export const rawContent = {
  items,
  plants,
  structures,
  decorations,
  recipes,
  wildlife,
  chapters,
  map,
}

let cached: Content | undefined

/** The game's built-in content, validated once on first use. */
export function getContent(): Content {
  cached ??= loadContent(rawContent)
  return cached
}

export { ContentError, loadContent } from './loader'
