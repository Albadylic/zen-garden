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
  'margin',
  'overgrown',
  'boundary',
]) satisfies z.ZodType<Terrain>

const rangeSchema = z
  .object({ min: unit, max: unit })
  .refine((r) => r.min <= r.max, 'min must not exceed max') satisfies z.ZodType<Range>

const factSchema = z.object({
  text: z.string().min(1),
  after: z.number().int().min(1),
}) satisfies z.ZodType<Fact>

const productionSchema = z.object({
  item: id,
  everySec: z.number().positive(),
  amount: z.number().int().positive(),
  minStage: count,
}) satisfies z.ZodType<ProductionDef>

export const itemSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(['seed', 'material', 'food']),
  description: z.string().min(1),
  colour: z.string().regex(/^#[0-9a-f]{6}$/i),
  facts: z.array(factSchema),
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
    facts: z.array(factSchema),
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
  feeder: z.object({ item: id, durationSec: z.number().positive() }).optional(),
  levels: z
    .array(
      z.object({
        name: z.string().min(1),
        attraction: z.number().positive(),
        capacity: z.number().int().positive(),
        upgradeCost: itemCounts.optional(),
        upgradeAfterVisits: count.optional(),
        produces: z.array(productionSchema),
      }),
    )
    .min(1),
  facts: z.array(factSchema),
}) satisfies z.ZodType<StructureDef>

export const decorationSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  terrain: z.array(terrainSchema).min(1),
  flat: z.boolean(),
  cover: unit,
  facts: z.array(factSchema),
}) satisfies z.ZodType<DecorationDef>

export const recipeSchema = z.object({
  id,
  name: z.string().min(1),
  inputs: itemCounts,
  output: z.object({ kind: z.enum(['structure', 'decoration']), id }),
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
      perMinute: z.number().positive(),
    }),
    z.object({
      kind: z.literal('shelter'),
      structure: id,
      minLevel: count,
      minSuitability: unit,
      perMinute: z.number().positive(),
    }),
    z.object({
      kind: z.literal('perch'),
      plants: z.array(id).min(1),
      minCount: z.number().int().positive(),
      bonus: z.object({ plant: id, multiplier: z.number().positive() }).optional(),
      perMinute: z.number().positive(),
    }),
    z.object({ kind: z.literal('feeder'), structure: id, perMinute: z.number().positive() }),
  ]),
  maxPresent: z.number().int().positive(),
  staySec: z.tuple([z.number().positive(), z.number().positive()]),
  colour: z.string().regex(/^#[0-9a-f]{6}$/i),
  facts: z.array(factSchema),
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
  z.object({ kind: z.literal('visitedArea'), area: id }),
]) satisfies z.ZodType<Condition>

export const chapterSchema = z.object({
  id,
  title: z.string().min(1),
  requires: z.string().min(1).optional(),
  completion: z.object({ title: z.string().min(1), body: z.array(z.string().min(1)).min(1) }),
  milestones: z.array(
    z.object({
      id,
      title: z.string().min(1),
      description: z.string().min(1),
      hint: z.string().min(1),
      conditions: z.array(conditionSchema).min(1),
      unlocks: z.array(z.string()),
    }),
  ),
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

/** The map as authored: rows of single-character tiles plus a legend. */
export const mapFileSchema = z.object({
  id,
  name: z.string().min(1),
  legend: z.record(
    z.string().length(1),
    z.object({ terrain: terrainSchema, fixed: fixedSchema.optional() }),
  ),
  rows: z.array(z.string()).min(1),
  startingInventory: itemCounts,
  clearing: z.array(clearingSchema),
  areas: z
    .array(
      z.object({
        id,
        name: z.string().min(1),
        bounds: z.object({
          x: count,
          y: count,
          w: z.number().int().positive(),
          h: z.number().int().positive(),
        }),
        unlock: z.string().min(1).optional(),
        clearing: z.array(clearingSchema).optional(),
      }),
    )
    .min(1),
})

export type MapFile = z.infer<typeof mapFileSchema>
