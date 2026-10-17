# Chapter Build Guide — Gardens 3 to 12

How the rest of the first batch is built: the shared scaffolding first, then one garden at a time, in route order. Each chapter follows [`forgotten_garden_first_batch.md`](forgotten_garden_first_batch.md) (section 4) and keeps the rules in [`game-design-document.md`](game-design-document.md): no punishment, no predation, several valid ways to finish, and content in data.

Tick items as they land. Species, quantities and recipes here are **proposals**: fine as starting content, kept in data so they are easy to change. Owner feedback waiting for later is in [`snag-list.md`](snag-list.md).

---

## 1. World layout

Gardens sit on a 3 × 4 world map. Each has its own map file and a world origin chosen so that gardens joined by a gate touch wall to wall. Gardens joined only by sight (no gate) may sit a little apart.

```text
         x: -2 … 13         14 … 29          30 … 45
y -43    04 Quiet Stone     05 Fernwood      06 Wildflower Meadow
y -27    03 Living Waters   08 Blossom Court 07 Whispering Stream
y -11    02 Bamboo Grove    09 Ancient Canopy 10 Reed Marsh
y   0    01 Forgotten (0…15) 12 Noble (16…29) 11 Four Seasons
```

| #   | Garden              | Slot (col, row) | Origin  | Size    | Gate in from the previous garden                                                  |
| --- | ------------------- | --------------- | ------- | ------- | --------------------------------------------------------------------------------- |
| 1   | Forgotten Garden    | 0, 0            | 0, 0    | 16 × 16 | —                                                                                 |
| 2   | Bamboo Grove        | 0, −1           | −2, −11 | 16 × 11 | Garden 1 north wall                                                               |
| 3   | Living Waters       | 0, −2           | −2, −27 | 16 × 16 | Garden 2 north wall                                                               |
| 4   | Quiet Stone Garden  | 0, −3           | −2, −43 | 16 × 16 | Garden 3 north wall                                                               |
| 5   | Fernwood Hollow     | 1, −3           | 14, −43 | 16 × 16 | Garden 4 east wall                                                                |
| 6   | Wildflower Meadow   | 2, −3           | 30, −43 | 16 × 16 | Garden 5 east wall                                                                |
| 7   | Whispering Stream   | 2, −2           | 30, −27 | 16 × 16 | Garden 6 south wall                                                               |
| 8   | Blossom Court       | 1, −2           | 14, −27 | 16 × 16 | Garden 7 west wall                                                                |
| 9   | Ancient Canopy      | 1, −1           | 14, −11 | 16 × 11 | Garden 8 south wall                                                               |
| 10  | Reed Marsh          | 2, −1           | 30, −11 | 16 × 11 | Garden 9 east wall                                                                |
| 11  | Four Seasons Garden | 2, 0            | 30, 0   | 16 × 16 | Garden 10 south wall                                                              |
| 12  | Noble Garden        | 1, 0            | 16, 0   | 14 × 16 | Garden 11 west wall                                                               |
| ↺   | Return gate         | —               | —       | —       | Garden 12 west wall ↔ Garden 1 east wall, opens when the Noble Garden is restored |

Each garden opens when the previous chapter is complete: garden N + 1's `unlock` is chapter N's `completionUnlock`.

## 2. The chapter template

Every chapter brings a garden with its own character and **one or two new ideas**, so that a new garden is more than extra space:

- **Map:** a signature feature, overgrowth to clear, the gate passage from the previous garden and the gate onward.
- **Plants:** two to four new species with their own propagules (seeds, divisions, cuttings or spores). The chapter's opening gift contains a few of each.
- **Wildlife:** two to four new species. At least one depends on the new idea; at least one arrives alongside species already present.
- **Materials:** one or two local materials (from clearing, plants or structures) with a clear use in a recipe.
- **A structure or decoration** that uses those materials.
- **Milestones:** about six, in the same rhythm as Chapter 2: look around → choose an approach → plant → gather → build → discover → restore.
- **A restoration project** with two or three approaches, all completable eventually.
- **Journal:** facts and hints for every new entry, checked by the no-predation wording test.
- **Art:** placeholder art drawn from a `look` in the data (see 3.1), so new species need no new drawing code.

## 3. Shared scaffolding (build first)

### 3.1 Data-driven placeholder art

- [x] Plants, wildlife, structures and decorations can carry a `look` (a form such as `tuft`, `flower`, `shrub`, `tree`, `reed`, `floating`, `cushion`, `butterfly`, `bird`, `beetle`, `amphibian`, `box` …, plus colours). The renderer draws any species from its look, so the hand-drawn art for earlier species stays and new ones need only data.

### 3.2 World and gardens

- [x] Gate connections can name their own unlock key (for the return gate, which joins two gardens that are already open).
- [x] Wildlife arrives from the walls of the garden it is heading for, not from anywhere in the sanctuary.
- [x] Wall tiles per garden are cached, so twelve gardens do not slow the simulation.
- [x] A **Gardens** list (from the garden title in the HUD) to jump the camera to any open garden; the title shows the garden in view.

### 3.3 New terrain

- [x] `deep-water` (deeper pond water; only floating and submerged plants), `gravel` (dry, warm ground for the stone garden) and `stream` (flowing water; stepping stones can cross it).

### 3.4 Engine features used by later chapters

- [x] **Plants that need a neighbour:** `near` (for example fungi that only grow beside dead wood).
- [x] **Perches on things other than plants:** perch attraction can name decorations and structures (a wagtail on stepping stones).
- [x] **Variety-loving visitors:** nectar attraction with `minSpecies`, the number of different flowering species needed.
- [x] **Structures that work while filled:** a compost bed produces leaf mould while it holds leaf litter (`producesWhileFilled`).
- [x] **Seasons:** a gentle in-game year (one season per hour of play). Plants can flower or fruit in chosen seasons, wildlife can visit in chosen seasons, and the garden's colours shift. Absence never causes loss.
- [x] **Rare visitors:** a low arrival rate plus conditions, with journal clues; never on a timer and never missable for good.
- [x] **New conditions:** `plantedBeside` (plants next to water or stream), `speciesIn` (different species growing in a garden), `openWater` (water tiles left clear) and `seasonsSeen`.

### 3.5 Proof that every chapter can be finished

- [x] An **autoplayer** for tests: it reads the current milestone's conditions and acts like a patient player (plants the right species in the best spots, clears, gathers, builds, upgrades, fills feeders, chooses approaches and completes stages, and lets time pass).
- [x] A test plays the whole batch, Chapter 1 to 12, and checks each chapter finishes within a sensible time.

---

## 4. Chapters

### Chapter 3 — Living Waters

The first water district: a larger pond with shallow margins, deep water and a rocky inlet. **New idea: aquatic planting by depth.**

- [x] Map with margin, shallow water and deep water, a rocky inlet and overgrown banks.
- [x] Plants: water lily (shallow or deep water), common reed (margin), hornwort (submerged, deep water). The autoplayer finishes the chapter in about an hour of play.
- [x] Wildlife: common darter dragonfly (rests on reeds and rushes), pond skater (on lily pads), Japanese tree frog (a frog shelter, alongside pond insects).
- [x] Materials: reed stems (from reeds), clay (from clearing the banks).
- [x] Structure: frog shelter (stones, clay, reed stems), placed on damp ground by the water.
- [x] Milestones and the "Restore the pond" project (lily pond · reed margin · frog haven).

### Chapter 4 — Quiet Stone Garden

A contemplative stone garden of moss, gravel and ground cover. **New idea: dry, warm microhabitats and composition.**

- [x] Map with gravel beds, a stone arrangement, mossy corners.
- [x] Plants: map lichen (only on gravel beside stones), creeping thyme (dry and sunny), dwarf mountain pine (small shrub), blue fescue (dry). The autoplayer finishes the chapter in about half an hour.
- [x] Wildlife: carpenter ant (a rock pile), jumping spider (sunlit stones), Japanese grass lizard (warm stones, alongside insects).
- [x] Materials: gravel, river stones.
- [x] Structure: rock pile (stones, gravel), which suits dry, sunny ground. Decorations: a raked gravel bed and a standing stone.
- [x] Milestones and the "Rebuild the stone garden" project (dry garden · moss garden · stone composition).

### Chapter 5 — Fernwood Hollow

A damp hollow around a fallen log. **New idea: decay as habitat, and compost.**

- [ ] Map with a fixed fallen log, deep shade and leaf litter.
- [ ] Plants: royal fern, wood sorrel, shelf fungus and oyster mushroom (only beside dead wood).
- [ ] Wildlife: woodlouse and millipede (a leaf-litter bed), Japanese toad (alongside decomposers).
- [ ] Materials: leaf mould (from the compost bed), fungus.
- [ ] Structure: leaf-litter bed (a compost heap that turns leaf litter into leaf mould while filled). Leaf mould is used to restore later gardens.
- [ ] Milestones and the "Restore the woodland floor" project (fern hollow · log habitat · compost corner).

### Chapter 6 — Wildflower Meadow

An open, sunlit meadow. **New idea: flower variety draws a variety of pollinators.**

- [ ] Map with broad open ground, a few tall grasses, scattered overgrowth.
- [ ] Plants: clover, oxeye daisy, aster, bellflower.
- [ ] Wildlife: solitary bee and hoverfly (need several different flowers), hummingbird hawk-moth (many kinds in bloom), grasshopper (tall grass).
- [ ] Materials: seed heads, grass stems.
- [ ] Decoration: a bee bank; seed heads make meadow seed mix.
- [ ] Milestones and the "Sow the meadow" project (pollinator meadow · tall-grass corner · seed collection).

### Chapter 7 — Whispering Stream

A narrow stream with stepping stones and shaded banks. **New idea: flowing water and planted banks.**

- [ ] Map with a stream crossing the garden and a small cascade.
- [ ] Plants: Japanese iris, sedge, marsh fern (all bank plants).
- [ ] Wildlife: water strider (calm stream), mayfly (planted banks), grey wagtail (perches on stepping stones in the stream).
- [ ] Materials: smooth stones, reed stems.
- [ ] Stepping stones can be placed in the stream.
- [ ] Milestones and the "Reconnect the stream" project (planted banks · stepping-stone crossing · resting places).

### Chapter 8 — Blossom Court

A flowering court with a blossom tree. **New idea: flowering shrubs and fruit that birds come for.**

- [ ] Map with a court, a curved path and an old cherry.
- [ ] Plants: flowering cherry, camellia, azalea, hydrangea.
- [ ] Wildlife: brown-eared bulbul (fruiting shrubs), Japanese white-eye (already met) on camellias, hawk moth.
- [ ] Materials: blossom petals, berries.
- [ ] Decoration: a stone bench; petals and berries in recipes.
- [ ] Milestones and the "Restore the court" project (blossom walk · layered border · fruit for birds).

### Chapter 9 — Ancient Canopy

A great old tree with cavities. **New idea: canopy layers and nesting places.**

- [ ] Map around a fixed ancient zelkova, with an understory to restore.
- [ ] Plants: Japanese holly, ivy, wood anemone.
- [ ] Wildlife: varied tit (nest box), stag beetle (a log stack), Japanese dormouse (nest box, alongside the tit's tree), Japanese pipistrelle bat (rare, bat box).
- [ ] Materials: acorns, fallen branches.
- [ ] Structure: nest box, with a bat-box branch.
- [ ] Milestones and the "Protect the old tree" project (understory · nesting places · deadwood).

### Chapter 10 — Reed Marsh

A shallow marsh with reed beds and a boardwalk. **New idea: open water pockets among dense reeds.**

- [ ] Map of pools, mud and margins.
- [ ] Plants: cattail, marsh marigold, frogbit (floating).
- [ ] Wildlife: reed warbler (reed beds), moorhen (open water), Japanese tree frog (returns here).
- [ ] Materials: cattail fluff, reed stems.
- [ ] Decoration: a boardwalk that can be laid over water.
- [ ] Milestones and the "Restore the marsh" project (reed beds · open pools · boardwalk).

### Chapter 11 — Four Seasons Garden

A path framed by deciduous trees, evergreens and grasses. **New idea: the seasons.**

- [ ] Seasons switch on here (the cycle runs everywhere once this garden opens).
- [ ] Plants: Japanese apricot (flowers late winter), beautyberry (autumn fruit), winter grass, snowdrop.
- [ ] Wildlife: brimstone butterfly (spring), seven-spot ladybird (overwinters in an insect hotel), Eurasian bullfinch (winter seeds).
- [ ] Materials: winter seeds, nuts.
- [ ] Milestones include seeing the garden in several seasons, and the "A garden for every season" project.

### Chapter 12 — Noble Garden

A refined ornamental pond, a stone bridge and a pavilion. **New ideas: composition and a rare discovery.**

- [ ] Map with an ornamental pond, a bridge site and a pavilion terrace.
- [ ] Plants: lotus, weeping cherry, Japanese maple (mature specimens), moss.
- [ ] Wildlife: golden dragonfly (rare; comes to a well-planted pond with other dragonflies present), koi-free still water insects, swallowtail and bees.
- [ ] Materials: fine timber, ornamental stones.
- [ ] Decorations: stone bridge (over water), pavilion, lanterns.
- [ ] Milestones and the "Restore the Noble Garden" project. Completing it opens the **return gate** to the Forgotten Garden.

---

## 5. Done when

- All twelve gardens are playable in order, each with its own map, content, milestones and project.
- The autoplayer test completes Chapters 1–12 in sequence.
- `npm run check` and `npm run test:e2e` pass; docs and open items are up to date.
