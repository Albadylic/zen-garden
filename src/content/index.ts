import type { Content } from '../core/content'
import chapters from './data/chapters.json'
import decorations from './data/decorations.json'
import items from './data/items.json'
import plants from './data/plants.json'
import projects from './data/projects.json'
import recipes from './data/recipes.json'
import structures from './data/structures.json'
import wildlife from './data/wildlife.json'
import world from './data/world.json'
import bambooGrove from './data/gardens/bamboo-grove.json'
import forgottenGarden from './data/gardens/forgotten-garden.json'
import livingWaters from './data/gardens/living-waters.json'
import quietStoneGarden from './data/gardens/quiet-stone-garden.json'
import fernwoodHollow from './data/gardens/fernwood-hollow.json'
import wildflowerMeadow from './data/gardens/wildflower-meadow.json'
import whisperingStream from './data/gardens/whispering-stream.json'
import blossomCourt from './data/gardens/blossom-court.json'
import ancientCanopy from './data/gardens/ancient-canopy.json'
import reedMarsh from './data/gardens/reed-marsh.json'
import fourSeasonsGarden from './data/gardens/four-seasons-garden.json'
import nobleGarden from './data/gardens/noble-garden.json'
import { loadContent } from './loader'

export const rawContent = {
  items,
  plants,
  structures,
  decorations,
  recipes,
  wildlife,
  chapters,
  projects,
  world,
  gardens: [
    forgottenGarden,
    bambooGrove,
    livingWaters,
    quietStoneGarden,
    fernwoodHollow,
    wildflowerMeadow,
    whisperingStream,
    blossomCourt,
    ancientCanopy,
    reedMarsh,
    fourSeasonsGarden,
    nobleGarden,
  ],
}

let cached: Content | undefined

/** The game's built-in content, validated once on first use. */
export function getContent(): Content {
  cached ??= loadContent(rawContent)
  return cached
}

export { ContentError, loadContent } from './loader'
