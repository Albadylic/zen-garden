import type { Content } from '../core/content'
import { nextId } from '../core/game'
import type { GameState, PlantEntity, StructureEntity } from '../core/state'

/** Adds a plant directly at a given stage (default: fully grown), bypassing seeds and rules. */
export function addPlant(
  state: GameState,
  content: Content,
  defId: string,
  x: number,
  y: number,
  stage?: number,
): PlantEntity {
  const def = content.plants[defId]!
  const plant: PlantEntity = {
    id: nextId(state),
    kind: 'plant',
    defId,
    x,
    y,
    stage: stage ?? def.stages.length - 1,
    progressMs: 0,
    produceMs: def.produces.map(() => 0),
    wateredMs: 0,
    fixed: false,
  }
  state.entities.push(plant)
  state.layoutVersion++
  return plant
}

export function addShelter(
  state: GameState,
  content: Content,
  x: number,
  y: number,
  level = 0,
): StructureEntity {
  const def = content.structures['natural-shelter']!
  const shelter: StructureEntity = {
    id: nextId(state),
    kind: 'structure',
    defId: def.id,
    x,
    y,
    level,
    visits: 0,
    produceMs: def.levels[level]!.produces.map(() => 0),
    fixed: false,
  }
  state.entities.push(shelter)
  state.layoutVersion++
  return shelter
}
