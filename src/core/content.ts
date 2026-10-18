// Content definitions: the data-driven description of plants, items, wildlife,
// structures, recipes, milestones and the starting map. Loaded and validated
// from JSON by src/content; the simulation only ever sees these types.

export type Terrain =
  | 'grass'
  | 'moss'
  | 'path'
  | 'water'
  | 'deep-water'
  | 'stream'
  | 'margin'
  | 'gravel'
  | 'overgrown'
  | 'boundary'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/**
 * How placeholder art draws something new: a form (the kind of shape, such as
 * "shrub" or "dragonfly") and colours. Final art replaces it by texture key.
 */
export interface Look {
  form: string
  colour: string
  accent?: string
  size?: number
}

export type ItemCategory = 'seed' | 'material' | 'food'

/** A preferred range for an environmental value between 0 and 1. */
export interface Range {
  min: number
  max: number
}

export interface Fact {
  text: string
  /** Number of encounters needed before this fact is revealed. */
  after: number
}

/** A clue shown for an undiscovered journal entry once a milestone is reached. */
export interface Hint {
  text: string
  /** Milestone after which the hint appears; absent means from the start. */
  after?: string
}

export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  description: string
  colour: string
  facts: Fact[]
  /** Clues shown in the journal before it is discovered, getting more specific over time. */
  hints?: Hint[]
}

export interface ProductionDef {
  item: string
  /** Seconds between drops at full suitability. */
  everySec: number
  amount: number
  /** First growth stage (index) at which production starts. */
  minStage: number
  /** Seasons in which it produces once the seasons have begun; every season if absent. */
  seasons?: Season[]
}

export interface GrowthStageDef {
  name: string
  /** Seconds to complete this stage at full suitability. Omitted on the final stage. */
  durationSec?: number
}

/** How plants are grouped in the Plants panel. */
export type PlantGroup = 'flowers' | 'groundcover' | 'shrubs-trees' | 'water'

/** How things to build are grouped in the Build panel. */
export type BuildGroup = 'habitats' | 'paths' | 'features'

export interface PlantDef {
  id: string
  name: string
  description: string
  /** Its group in the Plants panel; only plants the player can sow need one. */
  group?: PlantGroup
  /** Inventory item consumed to plant this species. Absent for plants the player cannot plant. */
  seedItem?: string
  terrain: Terrain[]
  stages: GrowthStageDef[]
  prefers: { shade: Range; moisture: Range }
  produces: ProductionDef[]
  /** Nectar offered to pollinators from `flowerStage` onwards. */
  nectar: number
  flowerStage: number
  /** Cover offered to wildlife on and next to this tile, scaled by stage. */
  cover: number
  /** Shade cast on nearby tiles once mature. */
  shade?: { radius: number; strength: number; minStage: number }
  /**
   * Spreads while mature: "terrain" turns neighbouring grass into moss;
   * "plant" starts a new young plant beside it, up to `maxNearby` of the
   * same species within reach.
   */
  spread?: {
    chancePerHour: number
    minStage: number
    mode: 'terrain' | 'plant'
    maxNearby?: number
  }
  /** Can be harvested by hand once mature, then needs time to recover. */
  harvest?: { item: string; amount: number; cooldownSec: number; minStage: number }
  /** Only grows within `distance` tiles of one of these (for example fungi beside dead wood). */
  near?: { ids: string[]; distance: number }
  /** Seasons in which it flowers (and offers nectar) once seasons have begun; every season if absent. */
  flowerSeasons?: Season[]
  /** Seasons in which it is at its best (blossom, fruit, evergreen leaves), for planning a garden for every season. */
  bestSeasons?: Season[]
  look?: Look
  facts: Fact[]
  /** Clues shown in the journal before it is discovered, getting more specific over time. */
  hints?: Hint[]
}

export interface StructureLevelDef {
  name: string
  /** How far along the structure is: 0 for the first level. */
  tier: number
  /** Index of the level this one upgrades from (defaults to the previous one). */
  from?: number
  /** Set on levels that are one of several alternative directions. */
  branch?: string
  /** Shown when choosing between branches. */
  description?: string
  /** Unlock key needed for this upgrade (defaults to "upgrade:<structure>"). */
  unlock?: string
  /** Texture variant for the level's look (defaults to the level index). */
  art?: string
  /** Species this level especially suits, with how much more it draws them. */
  favours?: Record<string, number>
  /**
   * Residents that tuck in here for long rests (as beetles do to see out the
   * winter), multiplying how long they rest and stay.
   */
  settles?: Record<string, number>
  /** Multiplies wildlife arrival rates for species that use this structure. */
  attraction: number
  /** Number of resident creatures it can hold at once. */
  capacity: number
  /** Items needed to upgrade to this level (absent on level 0). */
  upgradeCost?: Record<string, number>
  /** Visits needed before the upgrade to this level becomes available. */
  upgradeAfterVisits?: number
  produces: ProductionDef[]
}

export interface StructureDef {
  id: string
  name: string
  description: string
  terrain: Terrain[]
  prefers: { shade: Range; moisture: Range; cover: Range }
  levels: StructureLevelDef[]
  /**
   * A feeder is filled with an item and attracts visitors while it lasts.
   * With `whileFilled`, the structure also only produces while it is filled
   * (a compost bed turning leaf litter into leaf mould).
   */
  feeder?: { item: string; durationSec: number; whileFilled?: boolean }
  look?: Look
  facts: Fact[]
  /** Clues shown in the journal before it is discovered, getting more specific over time. */
  hints?: Hint[]
}

export interface DecorationDef {
  id: string
  name: string
  description: string
  terrain: Terrain[]
  /** Flat decorations (paths) sit under creatures and other sprites. */
  flat: boolean
  /** Cover offered to ground-dwelling wildlife. */
  cover: number
  /**
   * A stone or log that ground creatures living nearby bask and shelter at.
   * Residents with one close to their shelter stay a little longer.
   */
  refuge?: boolean
  /** Natural materials it gives up over time, such as stones loosened from an old boulder. */
  produces?: ProductionDef[]
  look?: Look
  facts: Fact[]
}

export interface RecipeDef {
  id: string
  name: string
  inputs: Record<string, number>
  /** What it makes: something to place in the garden, or items for the inventory. */
  output:
    { kind: 'structure' | 'decoration'; id: string } | { kind: 'item'; id: string; amount: number }
  /** Unlock key required before the recipe can be used; absent means always available. */
  unlock?: string
  /** Its group in the Build panel; recipes that make items are listed under Make instead. */
  group?: BuildGroup
}

export type Activity = 'arriving' | 'moving' | 'feeding' | 'resting' | 'perching' | 'leaving'

export interface WildlifeDef {
  id: string
  name: string
  description: string
  /** How the creature moves around the garden. */
  movement: 'flying' | 'ground'
  speed: number
  /** What draws it to the garden. */
  attraction:
    | {
        kind: 'nectar'
        minNectar: number
        /** Different flowering species needed in the sanctuary, for visitors that love variety. */
        minSpecies?: number
        perMinute: number
      }
    | {
        kind: 'shelter'
        structure: string
        /** Lowest tier of the structure that suits it. */
        minTier: number
        /** Only these branches suit it, when given. */
        branches?: string[]
        minSuitability: number
        perMinute: number
      }
    | {
        /** Rests in mature plants (or on decorations and structures) of these kinds, with an optional extra draw. */
        kind: 'perch'
        plants: string[]
        /** Decorations or structures it also rests on, such as stepping stones in a stream. */
        things?: string[]
        minCount: number
        bonus?: { plant: string; multiplier: number }
        perMinute: number
      }
    | { kind: 'feeder'; structure: string; perMinute: number }
  /**
   * Only arrives while at least `count` creatures of these species are already
   * in the sanctuary, for example a bird that comes where insects are
   * plentiful. This decides arrivals only; no creature ever affects another.
   */
  alongside?: { wildlife: string[]; count: number }
  /** Seasons in which it visits once seasons have begun; every season if absent. */
  seasons?: Season[]
  maxPresent: number
  /** Range of seconds a visit lasts. */
  staySec: [number, number]
  colour: string
  look?: Look
  facts: Fact[]
  /** Clues shown in the journal before it is discovered, getting more specific over time. */
  hints?: Hint[]
}

export type Condition =
  | { kind: 'planted'; plant?: string; count: number }
  | { kind: 'grown'; stage: number; count: number }
  | { kind: 'flowering'; count: number }
  | { kind: 'collected'; count: number }
  | { kind: 'cleared'; count: number }
  | { kind: 'seen'; wildlife?: string; count: number }
  | { kind: 'built'; structure: string; count: number }
  | { kind: 'visited'; structure: string; count: number }
  | { kind: 'speciesMature'; count: number }
  | { kind: 'milestone'; id: string }
  | { kind: 'visitedGarden'; garden: string }
  /** Plants currently growing in an area, optionally of given kinds and at least a given stage. */
  | { kind: 'plantedIn'; garden: string; plants?: string[]; minStage?: number; count: number }
  /** Structures or decorations currently standing in an area. */
  | { kind: 'builtIn'; garden: string; ids: string[]; count: number }
  /** Wildlife visits to shelters standing in an area. */
  | { kind: 'visitedIn'; garden: string; count: number }
  | { kind: 'clearedIn'; garden: string; count: number }
  | { kind: 'gathered'; item: string; count: number }
  | { kind: 'branched'; count: number }
  | { kind: 'seenAny'; wildlife: string[]; count: number }
  | { kind: 'matured'; plant: string; count: number }
  | { kind: 'approachChosen'; project: string }
  | { kind: 'stagesDone'; project: string; count: number }
  /** Plants growing in a garden right beside tiles of these terrains (water, stream). */
  | { kind: 'plantedBeside'; garden: string; terrain: Terrain[]; plants?: string[]; count: number }
  /** Different species growing in a garden. */
  | { kind: 'speciesIn'; garden: string; count: number }
  /** Water tiles in a garden left open, with nothing planted or built on them. */
  | { kind: 'openWater'; garden: string; count: number }
  /** Seasons seen since the seasons began. */
  | { kind: 'seasonsSeen'; count: number }
  /** Seasons in which something growing in a garden is at its best (see `bestSeasons`). */
  | { kind: 'seasonsCovered'; garden: string; count: number }

export interface MilestoneDef {
  id: string
  title: string
  description: string
  /** Short prompt shown as a suggestion while this milestone is the next one. */
  hint: string
  conditions: Condition[]
  unlocks: string[]
}

export interface ChapterDef {
  id: string
  title: string
  /** Unlock key that starts this chapter; absent for the first chapter. */
  requires?: string
  milestones: MilestoneDef[]
  /** Unlock key granted when the chapter is complete. */
  completionUnlock: string
  /** Shown when the chapter is completed. */
  completion: { title: string; body: string[] }
  /** Items given when the chapter starts, to get the player going. */
  gift?: Record<string, number>
  /** Milestones that can be reached at any time once the chapter starts, in any order. */
  optional?: MilestoneDef[]
}

export interface ProjectStageDef {
  id: string
  title: string
  description: string
  conditions: Condition[]
  /** Materials spent to complete the stage. */
  cost: Record<string, number>
  unlocks: string[]
}

export interface ApproachDef {
  id: string
  title: string
  description: string
  /** Granted when the approach is chosen: the first discoveries it brings. */
  unlocks: string[]
  stages: ProjectStageDef[]
}

/** A staged restoration project with alternative approaches. */
export interface ProjectDef {
  id: string
  title: string
  description: string
  garden: string
  /** Unlock key that makes the project available. */
  requires: string
  approaches: ApproachDef[]
}

export interface FixedObject {
  kind: 'plant' | 'decoration'
  id: string
  x: number
  y: number
  /** Growth stage for fixed plants. */
  stage?: number
}

/** What clearing an overgrown tile can turn up. */
export interface ClearingYield {
  item: string
  min: number
  max: number
  /** Probability (0–1) that this item is found at all. */
  chance: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A built garden: its own map, placed in the world at a fixed origin. */
/** The picture on a garden's emblem, used wherever the interface names a garden. */
export type GardenMotif =
  | 'pine'
  | 'bamboo'
  | 'water'
  | 'stones'
  | 'fern'
  | 'flower'
  | 'stream'
  | 'blossom'
  | 'canopy'
  | 'reeds'
  | 'seasons'
  | 'pavilion'

export interface GardenEmblem {
  motif: GardenMotif
  /** Background colour of the emblem. */
  colour: string
}

export interface GardenDef {
  id: string
  name: string
  emblem: GardenEmblem
  /** Position on the sanctuary's main restoration route (1 is the first garden). */
  number: number
  /** World tiles covered by the garden's map, walls included. */
  bounds: Rect
  /** Terrain per tile of the garden's own map, row by row. */
  terrain: Terrain[]
  /** Base shade per tile of the garden's own map before plants are considered (0–1). */
  baseShade: number[]
  /** Unlock key that opens the garden; absent for the starting garden. */
  unlock?: string
  /** Clearing yields for overgrowth in this garden; defaults to the world's. */
  clearing?: ClearingYield[]
}

/** A garden on the world map, built or still to come. */
export interface WorldGardenDef {
  id: string
  number: number
  name: string
  slot: { col: number; row: number }
  built: boolean
  emblem: GardenEmblem
}

/** A gate between two neighbouring gardens, in world tiles. */
export interface GateDef {
  /** Unlock key that opens the gate, when it is not simply the second garden opening. */
  unlock?: string
  /** Garden whose wall holds the gate. */
  from: string
  /** Garden the gate opens into; the gate is open once that garden is. */
  to: string
  /** The gate tile in the first garden's wall. */
  at: { x: number; y: number }
  /** The opening in the second garden's wall, beside the gate. */
  passage: { x: number; y: number }
}

/** A route between neighbouring gardens on the world map. */
export interface ConnectionDef {
  gardens: [string, string]
  /** The main restoration route, or the special return gate. */
  kind: 'main' | 'return'
}

export interface WorldDef {
  id: string
  name: string
  /** Gardens that have been built, in route order. */
  gardens: GardenDef[]
  /** Every garden on the world map, built or not. */
  layout: WorldGardenDef[]
  connections: ConnectionDef[]
  gates: GateDef[]
  /** Fixed features of every built garden, in world tiles. */
  fixed: FixedObject[]
  startingInventory: Record<string, number>
  clearing: ClearingYield[]
}

export interface Content {
  items: Record<string, ItemDef>
  plants: Record<string, PlantDef>
  structures: Record<string, StructureDef>
  decorations: Record<string, DecorationDef>
  recipes: Record<string, RecipeDef>
  wildlife: Record<string, WildlifeDef>
  chapters: ChapterDef[]
  projects: Record<string, ProjectDef>
  world: WorldDef
}
