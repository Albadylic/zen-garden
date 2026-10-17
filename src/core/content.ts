// Content definitions: the data-driven description of plants, items, wildlife,
// structures, recipes, milestones and the starting map. Loaded and validated
// from JSON by src/content; the simulation only ever sees these types.

export type Terrain = 'grass' | 'moss' | 'path' | 'water' | 'margin' | 'overgrown' | 'boundary'

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

export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  description: string
  colour: string
  facts: Fact[]
}

export interface ProductionDef {
  item: string
  /** Seconds between drops at full suitability. */
  everySec: number
  amount: number
  /** First growth stage (index) at which production starts. */
  minStage: number
}

export interface GrowthStageDef {
  name: string
  /** Seconds to complete this stage at full suitability. Omitted on the final stage. */
  durationSec?: number
}

export interface PlantDef {
  id: string
  name: string
  description: string
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
  /** Turns neighbouring grass into moss while mature. */
  spread?: { chancePerHour: number; minStage: number }
  facts: Fact[]
}

export interface StructureLevelDef {
  name: string
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
  facts: Fact[]
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
  facts: Fact[]
}

export interface RecipeDef {
  id: string
  name: string
  inputs: Record<string, number>
  output: { kind: 'structure' | 'decoration'; id: string }
  /** Unlock key required before the recipe can be used; absent means always available. */
  unlock?: string
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
    | { kind: 'nectar'; minNectar: number; perMinute: number }
    | {
        kind: 'shelter'
        structure: string
        minLevel: number
        minSuitability: number
        perMinute: number
      }
  maxPresent: number
  /** Range of seconds a visit lasts. */
  staySec: [number, number]
  colour: string
  facts: Fact[]
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
  | { kind: 'visitedArea'; area: string }

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

/** A part of the map, hidden and closed until its unlock key is granted. */
export interface AreaDef {
  id: string
  name: string
  bounds: Rect
  /** Unlock key that opens the area; absent for the starting area. */
  unlock?: string
  /** Clearing yields for overgrowth in this area; defaults to the map's. */
  clearing?: ClearingYield[]
}

export interface MapDef {
  id: string
  name: string
  width: number
  height: number
  terrain: Terrain[]
  /** Base shade per tile before plants are considered (0–1). */
  baseShade: number[]
  fixed: FixedObject[]
  startingInventory: Record<string, number>
  clearing: ClearingYield[]
  areas: AreaDef[]
}

export interface Content {
  items: Record<string, ItemDef>
  plants: Record<string, PlantDef>
  structures: Record<string, StructureDef>
  decorations: Record<string, DecorationDef>
  recipes: Record<string, RecipeDef>
  wildlife: Record<string, WildlifeDef>
  chapters: ChapterDef[]
  map: MapDef
}
