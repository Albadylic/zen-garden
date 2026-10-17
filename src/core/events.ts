// Events the simulation reports. The UI, return recap, journal badge and
// milestones all read from this stream rather than diffing state.

export type GameEvent =
  | { type: 'planted'; entityId: number; plantId: string }
  | { type: 'plantStage'; entityId: number; plantId: string; stage: number }
  | { type: 'flowering'; entityId: number; plantId: string }
  | { type: 'mossSpread'; x: number; y: number }
  | { type: 'plantSpread'; entityId: number; plantId: string }
  | { type: 'harvested'; entityId: number; items: Record<string, number> }
  | { type: 'filled'; entityId: number; structureId: string }
  | { type: 'crafted'; recipeId: string; items: Record<string, number> }
  | { type: 'dropProduced'; dropId: number; itemId: string; amount: number }
  | {
      type: 'collected'
      items: Record<string, number>
      auto: boolean
      /** Where each item was picked up, for on-screen feedback. */
      from: { x: number; y: number; itemId: string; amount: number }[]
    }
  | { type: 'cleared'; x: number; y: number; items: Record<string, number> }
  | { type: 'built'; entityId: number; structureId: string }
  | { type: 'placed'; entityId: number; decorationId: string }
  | { type: 'upgraded'; entityId: number; structureId: string; level: number }
  | { type: 'wildlifeArrived'; creatureId: number; speciesId: string }
  | { type: 'wildlifeLeft'; creatureId: number; speciesId: string }
  | { type: 'shelterVisited'; entityId: number; structureId: string; speciesId: string }
  | { type: 'discovery'; key: string; name: string }
  | { type: 'factRevealed'; key: string; text: string }
  | { type: 'milestone'; milestoneId: string; title: string }
  | { type: 'unlocked'; key: string }
  | { type: 'chapterComplete'; chapterId: string }
  | { type: 'gift'; chapterId: string; items: Record<string, number> }
  | { type: 'approachChosen'; projectId: string; approachId: string }
  | { type: 'stageComplete'; projectId: string; stageId: string; title: string }
  | { type: 'approachComplete'; projectId: string; approachId: string; title: string }

export type EventSink = GameEvent[]
