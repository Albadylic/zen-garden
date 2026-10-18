// Zod schemas for the JSON content files. Each schema is checked against the
// core content types so the two cannot drift apart.

import { z } from 'zod'
import type {
  ChapterDef,
  Condition,
  DecorationDef,
  Fact,
  ItemDef,
  PlantDef,
  ProjectDef,
  ProductionDef,
  Range,
  RecipeDef,
  StructureDef,
  Terrain,
  WildlifeDef,
} from '../core/content'

const id = z.string().regex(/^[a-z0-9-]+$/, 'ids are lowercase words joined by hyphens')
const unit = z.number().min(0).max(1)
const count = z.number().int().min(0)
const itemCounts = z.record(id, z.number().int().positive())

export const terrainSchema = z.enum([
  'grass',
  'moss',
  'path',
  'water',
  'deep-water',
  'stream',
  'margin',
  'gravel',
  'overgrown',
  'boundary',
]) satisfies z.ZodType<Terrain>

const seasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter'])

const lookSchema = z.object({
  form: z.string().min(1),
  colour: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  size: z.number().positive().optional(),
})

const rangeSchema = z
  .object({ min: unit, max: unit })
  .refine((r) => r.min <= r.max, 'min must not exceed max') satisfies z.ZodType<Range>

const factSchema = z.object({
  text: z.string().min(1),
  after: z.number().int().min(1),
}) satisfies z.ZodType<Fact>

const hintSchema = z.object({ text: z.string().min(1), after: id.optional() })

const productionSchema = z.object({
  item: id,
  everySec: z.number().positive(),
  amount: z.number().int().positive(),
  minStage: count,
  seasons: z
    .array(z.enum(['spring', 'summer', 'autumn', 'winter']))
    .min(1)
    .optional(),
}) satisfies z.ZodType<ProductionDef>

export const itemSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(['seed', 'material', 'food']),
  description: z.string().min(1),
  colour: z.string().regex(/^#[0-9a-f]{6}$/i),
  facts: z.array(factSchema),
  hints: z.array(hintSchema).optional(),
}) satisfies z.ZodType<ItemDef>

export const plantSchema = z
  .object({
    id,
    name: z.string().min(1),
    description: z.string().min(1),
    seedItem: id.optional(),
    terrain: z.array(terrainSchema).min(1),
    stages: z
      .array(z.object({ name: z.string().min(1), durationSec: z.number().positive().optional() }))
      .min(1),
    prefers: z.object({ shade: rangeSchema, moisture: rangeSchema }),
    produces: z.array(productionSchema),
    nectar: z.number().min(0),
    flowerStage: count,
    cover: unit,
    shade: z.object({ radius: z.number().positive(), strength: unit, minStage: count }).optional(),
    spread: z
      .object({
        chancePerHour: z.number().positive(),
        minStage: count,
        mode: z.enum(['terrain', 'plant']),
        maxNearby: z.number().int().positive().optional(),
      })
      .optional(),
    harvest: z
      .object({
        item: id,
        amount: z.number().int().positive(),
        cooldownSec: z.number().positive(),
        minStage: count,
      })
      .optional(),
    near: z.object({ ids: z.array(id).min(1), distance: z.number().positive() }).optional(),
    flowerSeasons: z.array(seasonSchema).min(1).optional(),
    bestSeasons: z.array(seasonSchema).min(1).optional(),
    look: lookSchema.optional(),
    facts: z.array(factSchema),
    hints: z.array(hintSchema).optional(),
  })
  .refine(
    (p) => p.stages.slice(0, -1).every((s) => s.durationSec !== undefined),
    'every stage except the last needs a durationSec',
  ) satisfies z.ZodType<PlantDef>

export const structureSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  terrain: z.array(terrainSchema).min(1),
  prefers: z.object({ shade: rangeSchema, moisture: rangeSchema, cover: rangeSchema }),
  feeder: z
    .object({ item: id, durationSec: z.number().positive(), whileFilled: z.boolean().optional() })
    .optional(),
  look: lookSchema.optional(),
  levels: z
    .array(
      z.object({
        name: z.string().min(1),
        tier: count,
        from: count.optional(),
        branch: id.optional(),
        description: z.string().min(1).optional(),
        unlock: z.string().min(1).optional(),
        art: id.optional(),
        favours: z.record(id, z.number().positive()).optional(),
        settles: z.record(id, z.number().min(1)).optional(),
        attraction: z.number().positive(),
        capacity: z.number().int().positive(),
        upgradeCost: itemCounts.optional(),
        upgradeAfterVisits: count.optional(),
        produces: z.array(productionSchema),
      }),
    )
    .min(1),
  facts: z.array(factSchema),
  hints: z.array(hintSchema).optional(),
}) satisfies z.ZodType<StructureDef>

export const decorationSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  terrain: z.array(terrainSchema).min(1),
  flat: z.boolean(),
  cover: unit,
  refuge: z.boolean().optional(),
  produces: z.array(productionSchema).optional(),
  look: lookSchema.optional(),
  facts: z.array(factSchema),
}) satisfies z.ZodType<DecorationDef>

export const recipeSchema = z.object({
  id,
  name: z.string().min(1),
  inputs: itemCounts,
  output: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('structure'), id }),
    z.object({ kind: z.literal('decoration'), id }),
    z.object({ kind: z.literal('item'), id, amount: z.number().int().positive() }),
  ]),
  unlock: z.string().optional(),
}) satisfies z.ZodType<RecipeDef>

export const wildlifeSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  movement: z.enum(['flying', 'ground']),
  speed: z.number().positive(),
  attraction: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('nectar'),
      minNectar: z.number().positive(),
      minSpecies: z.number().int().positive().optional(),
      perMinute: z.number().positive(),
    }),
    z.object({
      kind: z.literal('shelter'),
      structure: id,
      minTier: count,
      branches: z.array(id).optional(),
      minSuitability: unit,
      perMinute: z.number().positive(),
    }),
    z.object({
      kind: z.literal('perch'),
      plants: z.array(id),
      things: z.array(id).optional(),
      minCount: z.number().int().positive(),
      bonus: z.object({ plant: id, multiplier: z.number().positive() }).optional(),
      perMinute: z.number().positive(),
    }),
    z.object({ kind: z.literal('feeder'), structure: id, perMinute: z.number().positive() }),
  ]),
  alongside: z
    .object({ wildlife: z.array(id).min(1), count: z.number().int().positive() })
    .optional(),
  seasons: z.array(seasonSchema).min(1).optional(),
  maxPresent: z.number().int().positive(),
  staySec: z.tuple([z.number().positive(), z.number().positive()]),
  colour: z.string().regex(/^#[0-9a-f]{6}$/i),
  look: lookSchema.optional(),
  facts: z.array(factSchema),
  hints: z.array(hintSchema).optional(),
}) satisfies z.ZodType<WildlifeDef>

const conditionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('planted'),
    plant: id.optional(),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal('grown'), stage: count, count: z.number().int().positive() }),
  z.object({ kind: z.literal('flowering'), count: z.number().int().positive() }),
  z.object({ kind: z.literal('collected'), count: z.number().int().positive() }),
  z.object({ kind: z.literal('cleared'), count: z.number().int().positive() }),
  z.object({
    kind: z.literal('seen'),
    wildlife: id.optional(),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal('built'), structure: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('visited'), structure: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('speciesMature'), count: z.number().int().positive() }),
  z.object({ kind: z.literal('milestone'), id }),
  z.object({ kind: z.literal('visitedGarden'), garden: id }),
  z.object({
    kind: z.literal('plantedIn'),
    garden: id,
    plants: z.array(id).optional(),
    minStage: count.optional(),
    count: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal('builtIn'),
    garden: id,
    ids: z.array(id).min(1),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal('visitedIn'), garden: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('clearedIn'), garden: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('gathered'), item: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('branched'), count: z.number().int().positive() }),
  z.object({
    kind: z.literal('seenAny'),
    wildlife: z.array(id).min(1),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal('matured'), plant: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('approachChosen'), project: id }),
  z.object({ kind: z.literal('stagesDone'), project: id, count: z.number().int().positive() }),
  z.object({
    kind: z.literal('plantedBeside'),
    garden: id,
    terrain: z.array(terrainSchema).min(1),
    plants: z.array(id).optional(),
    count: z.number().int().positive(),
  }),
  z.object({ kind: z.literal('speciesIn'), garden: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('openWater'), garden: id, count: z.number().int().positive() }),
  z.object({ kind: z.literal('seasonsSeen'), count: z.number().int().positive() }),
  z.object({
    kind: z.literal('seasonsCovered'),
    garden: id,
    count: z.number().int().positive().max(4),
  }),
]) satisfies z.ZodType<Condition>

const milestoneSchema = z.object({
  id,
  title: z.string().min(1),
  description: z.string().min(1),
  hint: z.string().min(1),
  conditions: z.array(conditionSchema).min(1),
  unlocks: z.array(z.string()),
})

export const projectSchema = z.object({
  id,
  title: z.string().min(1),
  description: z.string().min(1),
  garden: id,
  requires: z.string().min(1),
  approaches: z
    .array(
      z.object({
        id,
        title: z.string().min(1),
        description: z.string().min(1),
        unlocks: z.array(z.string()),
        stages: z
          .array(
            z.object({
              id,
              title: z.string().min(1),
              description: z.string().min(1),
              conditions: z.array(conditionSchema).min(1),
              cost: z.record(id, z.number().int().positive()),
              unlocks: z.array(z.string()),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
}) satisfies z.ZodType<ProjectDef>

export const chapterSchema = z.object({
  id,
  title: z.string().min(1),
  requires: z.string().min(1).optional(),
  completion: z.object({ title: z.string().min(1), body: z.array(z.string().min(1)).min(1) }),
  gift: z.record(id, z.number().int().positive()).optional(),
  optional: z.array(milestoneSchema).optional(),
  milestones: z.array(milestoneSchema),
  completionUnlock: z.string().min(1),
}) satisfies z.ZodType<ChapterDef>

const fixedSchema = z.object({
  kind: z.enum(['plant', 'decoration']),
  id,
  stage: count.optional(),
})

const clearingSchema = z
  .object({ item: id, min: count, max: count, chance: unit })
  .refine((c) => c.min <= c.max, 'min must not exceed max')

const tile = z.object({ x: z.number().int(), y: z.number().int() })

/** One garden's map as authored: rows of single-character tiles, read with the world's legend. */
export const gardenMapSchema = z.object({
  id,
  rows: z.array(z.string()).min(1),
})

export type GardenMapFile = z.infer<typeof gardenMapSchema>

/** The sanctuary: every garden on the world map, how they connect, and the shared legend. */
export const worldSchema = z.object({
  id,
  name: z.string().min(1),
  legend: z.record(
    z.string().length(1),
    z.object({
      terrain: terrainSchema,
      fixed: fixedSchema.optional(),
      /** Shade cast from beyond the tile, such as by the tall north wall (0 to 1). */
      shade: z.number().min(0).max(1).optional(),
    }),
  ),
  startingInventory: itemCounts,
  clearing: z.array(clearingSchema),
  gardens: z
    .array(
      z.object({
        id,
        number: z.number().int().positive(),
        name: z.string().min(1),
        /** Column and row on the world map, for adjacency and the overview. */
        slot: z.object({ col: z.number().int(), row: z.number().int() }),
        emblem: z.object({
          motif: z.enum([
            'pine',
            'bamboo',
            'water',
            'stones',
            'fern',
            'flower',
            'stream',
            'blossom',
            'canopy',
            'reeds',
            'seasons',
            'pavilion',
          ]),
          colour: z.string().regex(/^#[0-9a-f]{6}$/i),
        }),
        /** World tile of the map's top-left corner; only gardens that have been built have one. */
        origin: tile.optional(),
        unlock: z.string().min(1).optional(),
        clearing: z.array(clearingSchema).optional(),
      }),
    )
    .min(1),
  connections: z.array(
    z.object({
      gardens: z.tuple([id, id]),
      kind: z.enum(['main', 'return']),
      /** Where the gate stands in the first garden's wall, and the opening in the second's (local tiles). */
      gate: z.object({ at: tile, passage: tile, unlock: z.string().min(1).optional() }).optional(),
    }),
  ),
})

export type WorldFile = z.infer<typeof worldSchema>
