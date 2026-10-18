# Zen Garden City-Builder — Game Design Document (Concept Stages 1–12)

Concept design document · Mobile-first peaceful garden builder · Consolidated through Stage 12

## 1. Executive summary

Zen Garden City-Builder is a peaceful, isometric garden-building game in which the player restores a neglected Japanese-inspired garden and gradually develops it into a thriving wildlife sanctuary.

There are no human inhabitants. Plants, fungi, insects, amphibians, fish, reptiles, birds, and small mammals form the living community. The player creates the conditions for life by cultivating plants, shaping ponds, constructing shelters, gathering natural materials, and restoring new areas of land.

The garden is both the player’s creation and a living ecosystem. Trees mature, moss spreads, flowers bloom, wildlife visits and settles, populations grow when conditions support them, and habitats evolve through meaningful upgrades. New areas reveal new ecological relationships, rare species, materials, and opportunities for creative expression.

The intended experience combines five pillars:

**Cultivate** — Grow distinctive plants, propagate them, and watch the landscape develop in real time.

**Create habitats** — Design living water, sheltered corners, natural refuges, and specialized wildlife structures.

**Discover wildlife** — Attract creatures through ecological suitability, observe their behavior, and record discoveries.

**Restore and expand** — Complete flexible restoration projects to reveal new environments, resources, and progression paths.

**Compose a personal sanctuary** — Arrange plants, paths, bridges, stones, lanterns, and habitats into a garden that reflects the player’s taste.

The game should feel rewarding in five-to-ten-minute visits, while also supporting longer creative sessions. It encourages regular return through visible growth, new visitors, and emerging opportunities—not streaks, deadlines, decay, or punishment for absence.

### Document scope and status

This document consolidates the design decisions established through Stages 1–12. The original questionnaire’s later plant, animal, and resource catalogue choices were still awaiting answers. Accordingly, the specific species lists, item quantities, and chapter details below are proposed starting content, not previously confirmed selections.

The aim is to provide a coherent, detailed concept that can be reviewed and refined without treating every illustrative idea as final.

### How this document relates to the first content batch

[`forgotten_garden_first_batch.md`](forgotten_garden_first_batch.md) turns this concept into a concrete first batch of twelve connected gardens on a 3 × 4 world map. Where the two differ, the first-batch document is the more recent plan:

- Chapters are gardens. Chapter 1 is the Forgotten Garden and Chapter 2 the Bamboo Grove, as here; Chapter 3 is **Living Waters** (called "The Living Wetland" below) and Chapter 4 the Quiet Stone Garden. Gardens 5–12 follow the first-batch document.
- The **Noble Garden** (Garden 12) is the first batch's landmark destination: a milestone, not an ending. It plays the role of the Grand Sanctuary milestone described below, while further batches of twelve can extend the sanctuary.
- No predation is ever shown (see 7.5).

Built so far: all twelve chapters of the first batch, with seasons, rare visitors and the return gate. Progress is tracked in [`build-order.md`](build-order.md).

## 2. World, setting, and artistic direction

### 2.1 The setting

The game takes place in a tranquil, Japanese-inspired natural sanctuary that has been neglected for a long time. Old stone paths are partially covered in moss, plants have grown wild, the pond is overgrown, and forgotten corners provide hints of a once-cared-for garden.

The player gradually restores the grounds, opening gates and paths to distinct areas. Every new area contributes to a larger sanctuary, but each retains its own character.

The setting draws from traditional Japanese garden design—stone arrangements, asymmetrical composition, moss, water, bamboo, bridges, lanterns, and quiet transitions between spaces—without requiring every plant or creature to be Japanese.

The intended world is handcrafted, calm, and natural. There are no human residents, towns, or conventional urban districts. Wildlife is the population, habitats are the homes, and ecological diversity is the equivalent of civic prosperity.

### 2.2 Visual style

Confirmed direction: soft watercolor storybook illustration, isometric garden view, recognizable naturalistic wildlife, subtle animation, gentle lighting, and carefully composed Japanese-inspired scenery.

The art should balance three qualities:

- Painterly: soft textures, delicate edges, layered washes of color, and an illustrated sense of depth.
- Legible: plants, creatures, interactable resources, and building footprints remain distinguishable at a glance.
- Alive: subtle motion in leaves, water, grasses, insects, and wildlife gives the garden presence without visual noise.

### 2.3 Color and atmosphere

The core palette should emphasize moss green, fern green, muted bamboo, stone gray, warm earth, soft cream, pond blue, and restrained seasonal accents.

- Morning: fresh, cool light with visible dew and soft shadows.
- Midday: clear plant colors and readable garden layouts.
- Evening: warmer lantern light, longer shadows, and more visible nocturnal activity.
- Rain: darkened stone, water ripples, wet foliage, and subdued colors.
- Mist: softened distant scenery, especially around ponds and wooded edges.

Weather should be occasional and atmospheric. It should not threaten plants, destroy structures, or force the player to act before time runs out.

### 2.4 Audio direction

The soundscape blends natural ambience with subtle Japanese-inspired instrumental music.

| Environment     | Sound identity                                        |
| --------------- | ----------------------------------------------------- |
| Garden paths    | Footsteps, breeze, rustling leaves                    |
| Pond            | Gentle water, frogs, dragonflies, occasional splashes |
| Bamboo grove    | Wind moving through bamboo and distant birds          |
| Flowering beds  | Bees, butterflies’ subtle wing sounds, light breeze   |
| Shaded woodland | Birds, small animals, leaves, soft ambient tones      |
| Evening garden  | Insects, occasional owl or frog calls, quiet music    |

Music should support the atmosphere rather than dominate it. The player should be able to enjoy quiet stretches of natural sound.

## 3. Design principles

These principles guide every system and content decision.

**Relaxation before optimization** — Ecological planning is rewarding, but the game must not demand perfect efficiency. Imperfect arrangements should remain recoverable.

**Nature creates value** — Plants, habitats, wildlife, and ecological relationships produce resources, discoveries, and progression opportunities. There is no generic cash economy at the center of the experience.

**Observation is gameplay** — Watching a tree mature, noticing a new visitor, or recognizing a habitat clue should be satisfying in itself.

**Meaningful choices without dead ends** — Habitat branches and restoration approaches affect progression, appearance, and ecological opportunities. Alternative paths remain achievable later.

**The garden waits patiently** — Offline development is capped and predictable. There are no daily decay penalties, required feeding schedules, or streaks.

**Complexity unfolds gradually** — The player begins with simple flowers, natural materials, and butterflies. Aquatic ecosystems, food webs, advanced habitat upgrades, and rare discoveries emerge over time.

## 4. The core gameplay loops

The game is built around interconnected loops rather than isolated minigames.

### 4.1 The short-session loop

**Return to the garden** — Review growth, visitors, resources, and discoveries.

**Gather and observe** — Collect available resources and inspect wildlife.

**Make a small improvement** — Plant, build, tend, rearrange, or upgrade.

**Discover an opportunity** — Follow a hint, progress a habitat, or work toward restoration.

**Leave the garden to grow** — The world continues developing within predictable limits.

The player does not need to complete every step during every visit. A session may consist entirely of arranging a path or observing wildlife.

### 4.2 The ecological loop

- Plant species suited to a location.
- Plants grow, flower, spread, or produce natural materials.
- Plants provide food, cover, nesting material, or shelter.
- Eligible wildlife arrives and begins exploring.
- Suitable conditions support longer stays, routines, and reproduction.
- Populations and habitat conditions create new opportunities.
- New species, materials, and discoveries unlock additional garden possibilities.

### 4.3 The habitat loop

- Discover or unlock a habitat structure.
- Gather its required natural materials.
- Place it where it is aesthetically and ecologically suitable.
- Improve its surroundings with appropriate plants, water, cover, or food sources.
- Observe its initial visitors.
- Upgrade it along a specialization branch.
- Unlock additional benefits, visual forms, resources, and species opportunities.

### 4.4 The restoration loop

- Reach an ecological or sanctuary milestone.
- Reveal a new area.
- Review its terrain, natural features, and restoration clues.
- Choose a restoration approach.
- Gather materials and fulfill ecological conditions.
- Complete restoration stages and establish the initial habitat.
- Discover area-specific plants, creatures, resources, and building options.
- Integrate the area into the larger sanctuary.

### 4.5 The discovery loop

- Notice a new creature, unusual plant, resource, or environmental clue.
- Record it in the illustrated naturalist’s journal.
- Learn any currently known habitat preferences.
- Use the clue to improve the garden or explore an unfamiliar area.
- Encounter further discoveries as the sanctuary develops.
- Complete journal milestones for optional rewards and new opportunities.

## 5. Garden layout and construction

### 5.1 Spatial structure

The garden is viewed isometrically and uses a grid-based building system. The grid supports clear placement and organization, while visual details make the world feel organic rather than rigid.

The player should be able to:

- Place and rearrange plants, habitats, structures, and decorations.
- Use path snapping and alignment guides.
- Build paths that connect areas naturally.
- Place stones, bridges, lanterns, and small structures to compose attractive scenes.
- Expand or improve the pond through simple upgrades.
- Work around terrain features such as water edges, slopes, rocks, and shaded corners.

The grid governs placement, but it should not force every garden into straight rows. Natural clusters, asymmetrical layouts, curved visual paths, and irregular planting groups are important to the Japanese-inspired aesthetic.

### 5.2 Placement rules

Two layers determine whether an object can be placed successfully.

Creative placement: determines whether an object fits the available footprint and respects basic terrain restrictions.

Ecological suitability: determines how well a plant or habitat supports life in its surroundings.

A shelter may be placeable in several locations, for example, but a damp, shaded corner with nearby vegetation may make it more attractive to certain creatures.

This separation allows the player to build a beautiful garden without every placement becoming a puzzle.

### 5.3 Buildings and structures

Proposed structural categories:

| Category               | Examples                                                       | Main purpose                          |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Paths and connections  | Stepping stones, stone paths, small bridges, gates             | Organize movement and connect areas   |
| Wildlife shelters      | Birdhouses, insect hotels, frog shelters, small mammal refuges | Provide specialized habitats          |
| Natural features       | Rock piles, logs, crevices, reed beds                          | Provide shelter and ecological niches |
| Water structures       | Pond edges, shallow shelves, small waterfalls, water plants    | Support aquatic life                  |
| Garden features        | Stone lanterns, pavilions, benches, ornamental stones          | Enhance composition and atmosphere    |
| Restoration structures | Gates, old bridges, cleared paths, repaired features           | Mark area progression                 |

Decorative features should generally be low-pressure and freely rearrangeable. Functional habitats may have meaningful upgrade paths.

### 5.4 Habitat upgrades

Habitats evolve through multiple stages, with branching specializations and visual transformations.

Illustrative progression:

- Natural shelter: a log or stone crevice.
- Improved refuge: more cover, stable shelter, or nesting material.
- Specialized habitat: a structure adapted to a particular ecological niche.
- Advanced habitat: a more elaborate form with additional benefits and appearance.
- Master habitat: a highly developed structure that supports specialized wildlife or contributes to advanced restoration.

A crafted shelter might eventually evolve into a larger wildlife lodge or multi-chamber habitat. These are illustrative upgrade themes rather than final building names.

Each upgrade should change more than a number. It may alter the structure’s silhouette, materials, surrounding vegetation, visiting species, resource output, or population capacity.

## 6. Plants and cultivation

Plants are the foundation of the garden’s visual growth, resource production, and ecological development.

### 6.1 Plant lifecycle

Each species has its own growth pattern. The following stages are a proposed general model:

1. **Planted** — The seed, spore, cutting, or young plant is established in a suitable location.
2. **Establishing** — The plant develops and begins to influence its immediate surroundings.
3. **Mature** — The plant reaches its characteristic appearance and may flower, spread, or produce resources.
4. **Established** — Longer-lived plants can develop into mature garden features, producing additional resources and more substantial shelter.

Not every plant needs four stages. Moss spreads gradually, flowers may mature quickly, and trees may develop through several visible forms over a longer period.

### 6.2 Early plant collection

These are proposed introductory species chosen to support the starting garden and the first wildlife loop.

**Garden moss** — Role: ground cover and shaded habitat.

Spreads slowly across suitable damp surfaces. Softens stones and creates a mature, established appearance.

**Ferns** — Role: shade, cover, and humidity-loving vegetation.

Fill sheltered corners, provide visual layers, and later help create appropriate amphibian and small-animal habitats.

**Japanese maple sapling** — Role: long-term growth and garden identity.

Develops gradually into a distinctive ornamental tree, adding shade, seasonal color, and a stronger sense of maturity.

**Wildflower mix** — Role: early flowering, pollinators, and seed production.

Establishes quickly, creates an early visible reward, and attracts the first butterflies and other small pollinators.

**Ornamental grasses** — Role: structure, cover, and natural building material.

Create vertical accents and shelter, with mature growth potentially yielding fibers or stems.

**Pond-edge plants** — Role: water margins and future aquatic habitats.

Introduce the player to planting around water. They help soften pond edges and provide cover for small aquatic creatures.

### 6.3 Later plant families

As new areas open, the plant collection expands into specialized ecological groups.

| Plant family       | Examples                                     | Main gameplay contribution                                           |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------- |
| Flowering plants   | Irises, asters, bellflowers                  | Pollinators, seeds, nectar                                           |
| Fruiting plants    | Berry-bearing shrubs, fruiting ground plants | Food for appropriate wildlife and propagation                        |
| Nut-bearing plants | Oak and other nut-producing trees            | Seeds, forager food, long-term canopy                                |
| Wetland plants     | Reeds, rushes, sedges                        | Wetland shelter and building materials                               |
| Aquatic plants     | Water lilies, submerged vegetation           | Pond cover, aquatic habitat, shade                                   |
| Woodland plants    | Shade-loving herbs, ferns, mosses            | Humid cover and forest-floor diversity                               |
| Bamboo             | Bamboo clumps                                | Distinct area identity and specialized construction materials        |
| Fungi              | Mushrooms and decomposer species             | Discovery, decomposition themes, specialized ecological interactions |

The exact species list should be curated for visual readability and clear gameplay roles. Fungi and advanced plant interactions are proposed for later progression, not the opening tutorial.

### 6.4 Plant care and propagation

The player’s most important gardening decision is usually where to plant, not how often to click a care button.

Optional actions can include:

- Watering a newly established plant where appropriate.
- Pruning or collecting cuttings from selected mature plants.
- Gathering seeds, spores, fruit, or nuts.
- Replanting and propagating species into new areas.
- Adjusting a plant’s location if it is poorly suited to the environment.

Tending can improve establishment, resource production, or appearance, but it should not become a daily requirement.

Plants should not die merely because the player has been away.

## 7. Wildlife and ecological behavior

Wildlife is the garden’s equivalent of a resident population, but creatures should remain autonomous.

### 7.1 Early wildlife collection

**Butterflies** — First signature wildlife discovery.

Arrive around suitable flowers and flowering plants. They provide an immediate, visible sign that the garden is becoming healthier.

**Wild bees and other pollinators** — Early ecosystem supporters.

Visit appropriate flowers and help make flowering beds feel alive. They also introduce the idea that plants support more than one kind of wildlife.

**Small garden birds** — Early or first-expansion visitor.

Explore sheltered trees and vegetation, and may use suitable nesting structures introduced later.

**Small pond fish** — Early aquatic life.

Make the starting pond feel inhabited. Their presence introduces water as a living feature rather than purely decoration.

**Dragonflies and aquatic insects** — Bridge to deeper pond ecology.

Appear as water plants and pond-edge conditions develop. Some insects can later become food sources for amphibians.

### 7.2 Later wildlife families

| Family          | Illustrative species                      | Habitat relationship                                                  |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Amphibians      | Frogs, toads, newts                       | Water access, damp shelter, appropriate cover and food                |
| Small mammals   | Mice, voles, hedgehogs                    | Ground cover, natural refuges, food and shelter                       |
| Reptiles        | Small lizards, turtles where suitable     | Warm basking spots, shelter, and species-appropriate environments     |
| Birds           | Songbirds, water birds, owls              | Vegetation, nesting sites, food sources, and quiet areas              |
| Invertebrates   | Beetles, moths, spiders, snails           | Plant cover, moisture, food, and microhabitats                        |
| Aquatic animals | Additional fish and aquatic invertebrates | Suitable pond conditions, depth, vegetation, and water quality themes |

These are candidate species families, not a finalized list. Species should be selected for compatibility with the game’s art style, educational framing, and ecological logic.

### 7.3 Wildlife routines

A creature’s behavior can include:

- Arriving to investigate a suitable habitat.
- Feeding or foraging when appropriate food is available.
- Resting in a preferred shelter.
- Moving between water, cover, and feeding locations.
- Returning to a familiar location.
- Establishing a territory or home range.
- Breeding when the species’ habitat and population conditions support it.

The player does not need to micromanage these actions. Wildlife should behave independently, with occasional visible moments that make observation rewarding.

### 7.4 Population growth and carrying capacity

Wildlife populations can grow gradually when the environment supports them. Larger populations may increase the demand for shelter, influence resource output, or make other species more likely to appear.

Population growth must have natural limits. If the habitat becomes crowded, growth slows rather than triggering dramatic population collapse or demanding urgent player intervention.

### 7.5 Feeding and food webs

The game gradually introduces food relationships:

- Flowers support pollinators and other flower-visiting insects.
- Fruits, nuts, seeds, and suitable organic material support appropriate foragers.
- A garden already busy with insects draws species such as frogs and certain birds. Whether those species arrive depends on which animals are already present.
- Cover, water, and specialized habitat features make the wider ecosystem more viable.

Food availability should mainly be managed by creating suitable conditions—not repeatedly feeding every animal.

For example, a frog hint might suggest adding aquatic cover and creating conditions where pond insects thrive. The player improves the ecosystem rather than placing food on a timer.

**No predation is ever shown.** Animals never kill, eat or remove one another, and no creature disappears because of another. Relationships between animals only decide which species are attracted, for example "wrens come to gardens already busy with insects". Every departure is an ordinary visit ending, and no journal text describes one animal hunting or eating another.

## 8. The water ecosystem

Water is a major long-term system. The starting garden has a small pond, while later progression introduces more specialized water environments.

### 8.1 Pond layers

The pond is conceptually divided into ecological zones.

| Zone            | Example features                         | Possible inhabitants                        |
| --------------- | ---------------------------------------- | ------------------------------------------- |
| Shallow margins | Damp soil, stones, reeds                 | Insects, amphibians, small invertebrates    |
| Water edge      | Lily pads, emergent plants               | Frogs, dragonflies, visiting birds          |
| Open water      | Clear water, aquatic plants              | Fish and swimming animals                   |
| Deeper water    | Deeper pond upgrades and submerged cover | Species requiring greater depth or shelter  |
| Sheltered edge  | Logs, rocks, overhanging vegetation      | Hidden small animals and resting amphibians |

These zones should influence which species are eligible to arrive, but the system should communicate suitability through understandable descriptions and visual cues.

### 8.2 Pond upgrades

A simple progression might be:

- Neglected pond: overgrown and visually quiet.
- Cleared pond: readable water surface and accessible margins.
- Planted pond: lily pads, aquatic vegetation, and improved cover.
- Layered pond: varied depth, shallow shelves, and specialized edges.
- Established wetland habitat: more complex aquatic relationships and greater species variety.

The player can improve the pond in stages without needing a full terrain sculpting system.

### 8.3 Aquatic progression

The pond’s first purpose is to make the garden feel alive. Its later purpose is to connect systems: aquatic plants provide cover, insects provide food, shallow edges support amphibians, and advanced water features create additional restoration opportunities.

Streams, marshes, and waterfalls remain possible later extensions, not required features for the first playable version.

## 9. Resources, inventory, and natural production

Resources are tangible natural items, not abstract currencies. They appear in the garden, can be inspected, and are collected into a detailed inventory.

### 9.1 Resource categories

**Seeds and propagation materials** — Acorns, flower seeds, spores, cuttings, fruit seeds.

Used to plant and propagate species. Some can also provide food for suitable wildlife.

**Natural building materials** — Twigs, wood, bark, reeds, stones, clay, feathers.

Used in shelters, habitat upgrades, garden features, and restoration projects.

**Food and organic matter** — Berries, fruits, nuts, nectar, fallen leaves, and other suitable organic material.

Support propagation, attract appropriate wildlife, and contribute to selected habitat or crafting recipes.

These categories organize the inventory but do not prevent individual items from serving multiple purposes.

### 9.2 Proposed early inventory

The following is an illustrative starting inventory for balancing, not a confirmed quantity list.

| Item             | Initial role                        | Other possible uses                 |
| ---------------- | ----------------------------------- | ----------------------------------- |
| Wildflower seeds | Establish the first flower patch    | Propagation and pollinator habitat  |
| Twigs            | Build the first natural shelter     | Later nest or habitat construction  |
| Loose stones     | Arrange a path or pond edge         | Rock crevices and basking locations |
| Leaf litter      | Improve a sheltered natural corner  | Selected damp microhabitats         |
| Bark             | Early natural construction material | Specialized shelters                |
| Berries          | Later food and propagation item     | Attracting appropriate foragers     |

The opening inventory should be small enough to understand without feeling restrictive.

### 9.3 Resource production

Plants and habitats produce particular resources over time.

Examples:

- Mature flowers may yield seeds.
- Fruiting plants may produce berries.
- Trees may yield nuts, fallen leaves, or occasional twigs.
- Grasses and reeds may provide stems.
- Established habitats may generate nesting materials or other species-specific items.

Production should be visible in the garden and should reflect the world. A tree does not need to produce every material, and not every item needs to be useful in every recipe.

### 9.4 Collection and inventory management

Resources are primarily collected automatically into the inventory when available, while players retain the option to inspect or gather specific objects.

Collection should be convenient and batch-friendly. The garden can display physical resource objects for atmosphere and feedback without requiring players to tap hundreds of individual items.

There should be no pressure to collect everything immediately. Resource accumulation is capped during extended absence to keep the economy predictable.

### 9.5 Crafting and combinations

Simple combinations are introduced first.

Illustrative examples:

- Twigs + bark → basic shelter.
- Reeds + twigs → wetland habitat feature.
- Stones + clay → selected garden or habitat structures.
- Seeds + suitable soil or planting location → a new plant.
- Rare natural materials + discoveries → advanced habitat upgrades or restoration features.

Later progression may add branching recipes and rare-item combinations. These should expand creative and ecological options, not become a repetitive crafting grind.

## 10. Habitat structures and specialization

Habitats provide a second major progression track alongside plants and land restoration.

### 10.1 Habitat categories

**Natural refuges** — Logs, rock piles, burrows, root cavities, and sheltered vegetation. These introduce habitat creation with minimal construction requirements.

**Crafted wildlife structures** — Birdhouses, nesting structures, insect hotels, frog shelters, and small-animal refuges.

**Specialized ecological habitats** — Shelters and features tailored to particular niches, such as damp amphibian refuges, dry rock crevices, or shaded insect habitats.

### 10.2 Multi-stage upgrades

An illustrative structure could progress from a simple shelter to a more elaborate habitat with several specialization branches.

For example:

| Stage                 | Design purpose                                                   |
| --------------------- | ---------------------------------------------------------------- |
| Basic shelter         | Provides a first suitable refuge                                 |
| Improved shelter      | Better cover and broader suitability                             |
| Specialized structure | Supports a particular niche or species group                     |
| Advanced habitat      | Improves habitat quality, resources, or population opportunities |
| Master form           | Offers a distinctive appearance and advanced ecological benefits |

A structure may branch into three upgrades at one stage and five options at a later stage, as in the earlier design example. These counts are illustrative, not fixed.

### 10.3 Branching choices

Upgrade paths can emphasize different benefits:

- Biodiversity: support a broader set of suitable species.
- Specialization: improve conditions for a narrower ecological niche.
- Resource production: yield more or different natural items.
- Habitat capacity: accommodate larger suitable populations.
- Visual design: evolve into a distinctive Japanese-inspired or naturalistic structure.

The selected branch should have meaningful consequences. However, other branches should remain unlockable through later progression, alternative structures, or further discoveries.

## 11. Discovery journal and guidance

The journal is the central reference for the garden’s living systems. It should resemble an illustrated naturalist’s notebook rather than a conventional checklist menu.

### 11.1 Journal sections

| Section          | Contents                                                     |
| ---------------- | ------------------------------------------------------------ |
| Plants and fungi | Species records, growth observations, propagation notes      |
| Wildlife         | Observations, known behaviors, habitats, and encounters      |
| Habitats         | Structures, upgrade stages, suitable environments            |
| Ecology          | Food relationships, water zones, cover, and population needs |
| Materials        | Resource records, sources, uses, and discovered recipes      |
| Areas            | Restoration progress, landmarks, and regional discoveries    |
| Milestones       | Major garden achievements and optional collection goals      |

### 11.2 Unknown versus known information

The journal distinguishes between what the player has discovered and what remains uncertain.

A newly encountered species might initially have only an illustration and a brief observation. Subsequent encounters can reveal habitat preferences, behavior, food relationships, or preferred shelter.

The journal should not require exhaustive study before the player can continue building.

### 11.3 Three layers of guidance

Current suggestions: a short list of optional actions, such as planting flowers, improving a pond edge, or gathering shelter materials.

Journal guidance: a full reference for known species, structures, resources, and progression clues.

Contextual hints: selecting a locked or unfamiliar species reveals relevant hints, becoming more specific as appropriate.

For example, a frog discovery might progress from a broad hint about damp, sheltered places to a more specific suggestion involving aquatic plants and insects.

### 11.4 Restoration projects

Larger projects organize related tasks into stages, but the player retains freedom to work elsewhere.

Projects can combine:

- Materials gathered from plants and habitats.
- Ecological conditions, such as suitable cover or established water plants.
- Discoveries recorded in the journal.
- Improvements to paths, water features, and natural shelters.

Each area can have branching restoration approaches, with different opportunities revealed by the player’s decisions.

## 12. Land expansion and restoration

Expansion is earned primarily through ecological and sanctuary milestones rather than purchasing empty land with generic currency.

### 12.1 Expansion requirements

A new area may become available after the player:

- Establishes a certain degree of plant diversity.
- Completes an important habitat.
- Discovers a significant species or ecological relationship.
- Restores a water feature or other landmark.
- Reaches a sanctuary milestone.
- Gathers appropriate materials and completes a restoration project.

Not every area should require all of these conditions. Requirements should fit the area’s theme.

### 12.2 Restoration choices

When a new area opens, the player inspects its natural features and chooses a restoration approach.

For example, the first bamboo grove might offer an initial emphasis on:

- A shaded planting corner.
- A sheltered wildlife refuge.
- A path and stone feature leading deeper into the grove.

These approaches can influence the order in which opportunities appear, rather than permanently excluding other features.

### 12.3 Area identity

Each area should add something distinct:

- New plant families.
- New wildlife and habitat niches.
- Different natural materials.
- Unique restoration projects.
- New Japanese-inspired structures and decorative opportunities.
- New ecological relationships.

The garden should grow in both physical scale and systemic depth.

## 13. Offline growth, time, and return visits

The garden continues developing when the player is away, within predictable limits.

### 13.1 Offline changes

Depending on the garden’s state, a return may reveal:

- Plants advancing through growth stages.
- Mature plants producing resources.
- Wildlife following its routines.
- Suitable populations gradually increasing.
- A rare visitor or journal observation.
- New restoration opportunities becoming available.

These events should be plausible consequences of the existing garden, not guaranteed rewards on every return.

### 13.2 Predictable limits

Offline progress is capped to prevent excessive resource accumulation or large population changes during long absences.

Plants should not die from neglect. Wildlife should not disappear simply because the player did not open the game. Seasons and weather should primarily change the appearance and atmosphere rather than impose deadlines.

### 13.3 Return recap

The return screen should summarize meaningful changes, not overwhelm the player with every internal event.

An illustrative recap:

- Growth: your wildflowers matured and a maple sapling advanced.
- Resources: seeds and natural materials are ready to collect.
- Wildlife: a new visitor was observed near the pond.
- Journal: a habitat clue was added.
- Opportunity: your progress may qualify you to begin a new restoration project.

The player should be able to move directly from the recap into the garden, ignore suggestions, or simply observe.

## 14. First chapters and early progression

The opening hours should introduce one new idea at a time. The first chapter focuses on plants and pollinators; the second introduces natural shelters and more varied garden spaces; the third deepens water ecology and food relationships.

The chapter names and exact order below are proposals that consolidate the established concept.

**Chapter 1: The Forgotten Garden**

Theme: renewal, simple planting, first wildlife.

Restore the starting clearing, plant wildflowers, gather materials, and attract butterflies. Complete a first natural shelter and establish the basic daily rhythm of the game.

**Chapter 2: The Bamboo Grove**

Theme: shelter, crafted habitats, new materials.

Restore the first expansion, introduce bamboo and new plant varieties, construct an improved wildlife shelter, and explore the relationship between cover, food, and animal visits.

**Chapter 3: The Living Wetland**

Theme: water, aquatic plants, insects, amphibians.

Develop the pond into a layered ecosystem, establish shallow margins and aquatic vegetation, and begin discovering more complex relationships between plants, insects, and frogs.

**Chapter 4: The Quiet Stone Garden**

Theme: dry niches, rock features, specialized habitats.

Introduce rock crevices, sunlit stones, new ground-cover plants, and species that favor different conditions from the wetland. Teach that biodiversity depends on variety, not making every part of the garden identical.

The fourth chapter is a proposed next step, not a requirement for the initial release. Further areas might include woodland, a larger marsh, or a mature grove with advanced restoration opportunities.

### Chapter 1 — The Forgotten Garden

#### Starting state

- A compact, neglected Japanese-inspired garden.
- A small existing pond.
- A few mature trees and overgrown vegetation.
- Mossy stones, a partially obscured path, and a quiet clearing.
- A shaded corner suitable for a natural shelter.

#### Early feature set

- **Planting:** seeds, planting locations, growth stages.
- **Gathering:** twigs, stones, seeds, and other natural items.
- **First wildlife:** butterflies and other flower visitors.
- **Natural shelter:** first habitat placement and suitability.

#### Proposed opening sequence

- Introduce the neglected garden and let the player inspect its existing features.
- Plant a small patch of wildflowers and watch the first growth progress.
- Collect a few available resources and learn how physical items enter the inventory.
- Observe a butterfly arriving near the flowers.
- Build a basic natural shelter from gathered materials.
- Complete the first habitat milestone and receive a journal entry or new building opportunity.
- Reveal the first restoration opportunity: the bamboo grove.

#### Suggested opening inventory

A handful of wildflower seeds, several twigs, a few loose stones, and a small amount of leaf litter or bark. Final quantities should be tuned to the opening pace.

### Chapter 2 — The Bamboo Grove

This chapter expands both physical space and the player’s understanding of habitats.

#### New features

- Bamboo growth and harvesting.
- More advanced plant placement and shade considerations.
- Improved shelter structures and the first branching habitat upgrade.
- A broader set of wildlife visitors.
- A restoration plan with more than one valid approach.
- Greater emphasis on paths, transitions, and composing connected garden areas.

#### Proposed milestones

- Inspect the newly revealed grove.
- Choose which restoration feature to establish first.
- Introduce bamboo and additional understory plants.
- Gather reeds, twigs, or other suitable construction materials.
- Upgrade the original shelter or build a specialized alternative.
- Discover a new creature or a new behavior from an existing species.
- Complete the grove’s initial restoration stage.

The player should be able to develop a beautiful grove without unlocking every possible creature immediately.

### Chapter 3 — The Living Wetland

This chapter introduces the first substantial increase in ecological complexity.

#### New features

- Pond depth and shallow-margin improvements.
- Aquatic plants and emergent vegetation.
- Dragonflies and additional aquatic insects.
- Frog discovery and amphibian shelter.
- More detailed food relationships.
- Specialized habitat clues and new journal categories.

#### Proposed milestones

- Restore access to a neglected pond margin.
- Add suitable water plants and sheltered shallow edges.
- Observe increased insect activity.
- Receive a contextual hint about amphibians.
- Improve damp cover and suitable shelter.
- Encounter a frog when conditions and the discovery system permit.
- Record new ecological relationships in the journal.

The frog should not necessarily arrive immediately after a single action. The point is to encourage the player to create a suitable ecosystem, then reward observation.

### Chapter 4 — The Quiet Stone Garden

This proposed chapter introduces environmental contrast.

#### New features

- Rock piles, crevices, and sunlit stones.
- Dry- and warm-condition plant groups.
- Specialized small-animal habitats.
- Additional decorative stone arrangements.
- New natural materials and restoration recipes.
- More advanced interactions between neighboring habitats.

#### Purpose

The player learns that a healthy sanctuary does not consist of identical conditions everywhere. Damp shade, flowering clearings, deep water, and sunlit stones each support different life.

### Early progression overview

| Stage                 | Major unlock                                | New understanding                         |
| --------------------- | ------------------------------------------- | ----------------------------------------- |
| First planting        | Wildflowers and seed collection             | Plants grow and produce value             |
| First visitor         | Butterflies                                 | Suitable flowers attract wildlife         |
| First shelter         | Natural refuge                              | Habitat placement matters                 |
| First expansion       | Bamboo grove                                | Restoration unlocks new space             |
| First habitat upgrade | Specialized shelter                         | Buildings can evolve along branches       |
| Pond improvement      | Aquatic plants and shallow edges            | Water has ecological layers               |
| Wetland discovery     | Amphibian clues and possible frog encounter | Food and habitat relationships interact   |
| Stone garden          | Dry niches and crevices                     | Diverse environments support more species |

## 15. Long-term progression and endgame

The long-term game is an interconnected progression tree. Plants, habitats, wildlife, resources, and land restoration should unlock opportunities for one another rather than exist as separate ladders.

### 15.1 Progression branches

- **Starting sanctuary:** Wildflowers · Basic shelter · Small pond
- **Plant diversity:** Propagation, flowering, fruiting, shade
- **Habitats:** Shelters, specializations, upgrades
- **Water ecology:** Depth, aquatic plants, amphibians
- **Wildlife discoveries:** New species, behaviors, food relationships
- **Restoration and expansion:** Materials + discoveries + ecological improvements
- **Grand Sanctuary:** A large, richly interconnected personal garden

This is a conceptual relationship map, not a rigid technology tree. Players should be able to pursue several branches in parallel and find alternative ways to satisfy progression requirements.

### 15.2 Major milestone categories

- Habitat milestones: create, improve, and specialize habitats.
- Biodiversity milestones: discover plants and animals and establish varied ecosystems.
- Restoration milestones: complete significant stages in each area.
- Journal milestones: record observations and learn ecological relationships.
- Creative milestones: complete a visually coherent garden area or establish signature features.
- Sanctuary milestones: integrate several distinct habitats into one flourishing garden.

### 15.3 The Grand Sanctuary

The Grand Sanctuary is the principal long-term achievement. It represents a garden with multiple restored areas, mature vegetation, thriving wildlife, varied habitats, and a rich journal.

It should be an accomplishment, not a hard ending.

After reaching it, players can continue to:

- Discover remaining species and plant varieties.
- Complete optional journal sections.
- Improve habitat branches.
- Develop new decorative arrangements.
- Revisit areas and create alternative layouts.
- Pursue ecological diversity and personal design goals.
- Restore additional areas as future content becomes available.

The endgame remains open-ended, with no requirement to optimize every population or complete every collection.

## 16. Interface and player interaction

The interface should feel like a naturalist’s field notebook combined with a simple garden-planning toolkit.

### 16.1 Main garden interface

```text
┌───────────────────────────────────────────────┐
│ The Forgotten Garden                          │
│ [Plants] [Habitats] [Water] [Restore]         │
│                                               │
│ A quiet discovery                             │
│ Your wildflowers are thriving. A butterfly    │
│ has been seen near the stone path.            │
│                                               │
│ [Inventory] [Journal] [Suggestions]           │
└───────────────────────────────────────────────┘
```

Conceptual interface mock-up for hierarchy and terminology, not a final screen design.

### 16.2 Primary interaction categories

| Interaction                  | Expected behavior                                                             |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Select a plant               | View species information, growth stage, suitability, and available actions    |
| Select wildlife              | Observe its behavior, read known facts, and review relevant journal clues     |
| Select a habitat             | View inhabitants, suitability, upgrade branches, and required materials       |
| Select a resource            | Inspect its quantity, sources, and known uses                                 |
| Enter building mode          | Browse plants, structures, decorations, and placement options                 |
| Select a restoration project | Review progress, possible approaches, and optional next steps                 |
| Open the journal             | Explore discovered species, habitats, resources, and ecological relationships |

### 16.3 Suggestions and task presentation

The main screen should show only a few relevant suggestions at once. The player can open the full journal or restoration overview when they want more detail.

Suggestions should respond to the current garden state. If the player has already built several shelters, the game should not keep recommending the first shelter. If a species is not yet relevant, the player should not be flooded with hints about it.

The task system should never behave like a list of overdue obligations.

### 16.4 Mobile-friendly interaction principles

- Keep important actions easy to reach with one hand.
- Make selection targets large and distinct.
- Avoid dense information panels over the garden.
- Provide clear visual feedback when placing objects or collecting items.
- Let players cancel placement and undo ordinary layout changes.
- Separate decorative placement from ecological information.
- Allow longer species descriptions to be opened on demand rather than permanently occupying the screen.

These principles are intended to preserve a calm experience on both phones and tablets.

## 17. Rewards, milestones, and pacing

The game uses several types of rewards so that progress does not depend exclusively on unlocking the next area.

### 17.1 Reward categories

**Natural rewards** — A flower blooms, a tree matures, a new creature visits, or a habitat becomes visibly established.

**Material rewards** — New seeds, building materials, organic resources, and rare ingredients become available.

**Knowledge rewards** — New journal entries, habitat clues, plant propagation options, and ecological insights.

**Progression rewards** — New land, habitat upgrade branches, specialized structures, and restoration opportunities.

**Creative rewards** — New decorative features, structures, and ways to compose the garden.

### 17.2 Pacing curve

The first chapter should provide frequent small rewards and explain the basic loop quickly. New systems then arrive more gradually.

- Opening: immediate planting, first growth, first wildlife, first shelter.
- Early game: additional plants, materials, first habitat upgrade, first land expansion.
- Middle game: aquatic ecology, branching habitats, population dynamics, more specialized resources.
- Later game: deeper restoration projects, rare encounters, advanced crafting, interdependent ecosystems.
- Endgame: Grand Sanctuary achievement and open-ended development.

### 17.3 No-punishment policy

The game should avoid:

- Plants dying because of a missed day.
- Wildlife leaving permanently because the player was absent.
- Mandatory daily feeding.
- Streaks that punish breaks.
- Expiring restoration projects.
- Seasonal content that must be caught within a narrow window.
- Irrecoverable habitat choices.
- Excessive resource requirements that halt all meaningful activity.

Progress can slow naturally as systems become more advanced, but the player should always have something worthwhile to do at their own pace.

## 18. Weather, seasons, and time

Weather and seasons primarily affect the garden’s mood and visual variety.

### Weather

- Sunshine: clearer colors, soft shadows, and visible plant detail.
- Rain: rippling water, wet stones, and gently moving leaves.
- Mist: atmospheric depth around wooded and aquatic areas.
- Wind: moving grasses, bamboo, branches, and fallen leaves.

### Seasons

The proposed seasonal system changes foliage, flowers, colors, and wildlife appearances. Seasonal changes should enrich the garden rather than gate essential progression.

Examples include maple foliage shifting in autumn, different flowering displays, and variations in the density or appearance of vegetation.

The exact seasonal calendar and which species receive seasonal variants remain open content decisions. The confirmed principle is that players should not lose important rewards by missing a season.

**Confirmed:** the seasons follow the real calendar, from the Four Seasons Garden (Chapter 11) on, in the player's hemisphere (guessed from the device's time zone, changeable in Settings). No goal waits on the calendar: Chapter 11 asks the player to plan a garden with something at its best in every season, and seasonal visitors fill in the journal as the real year turns.

## 19. Content framework and extensibility

The game needs enough variety to support discovery while maintaining a coherent visual and ecological identity.

### 19.1 Content families

| Content family    | Early content                                                 | Later expansion                                                              |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Plants            | Moss, ferns, wildflowers, grasses, maple sapling, pond plants | Bamboo, fruiting shrubs, wetland plants, specialized woodland flora, fungi   |
| Wildlife          | Butterflies, pollinators, small birds, pond fish              | Amphibians, small mammals, reptiles, specialized insects, rare visitors      |
| Habitats          | Natural shelter, rock pile, simple pond edge                  | Birdhouses, insect hotels, frog shelters, specialized habitat branches       |
| Resources         | Seeds, twigs, stones, leaf litter                             | Reeds, bark, berries, nuts, clay, feathers, spores, rare materials           |
| Garden structures | Stepping stones, basic paths, natural shelter                 | Bridges, lanterns, pavilions, advanced shelters, area-specific structures    |
| Restoration       | Clearing, first habitat, initial pond improvements            | Multi-stage area projects, specialized ecology, advanced restoration         |
| Discoveries       | First plant and wildlife observations                         | Rare encounters, unusual varieties, deeper food webs, hidden garden features |

### 19.2 Content design rule

Each new item should have a clear purpose, a distinct appearance, and a reason to exist.

A new plant might offer a different growth pattern or habitat role. A new animal might introduce a food relationship or shelter preference. A new structure might provide a meaningful ecological specialization or a distinctive visual focal point.

The game should avoid adding dozens of nearly identical items that do not change how the garden develops.

### 19.3 Rare discoveries

Rare species should arrive infrequently and feel memorable. The player may receive hints that improve their chances, but encounters remain partly surprising.

Rare discoveries can include:

- Uncommon animal species.
- Unusual plant varieties.
- Special natural formations.
- Hidden features in restored areas.
- Distinctive wildlife behaviors or encounters.

Any special appearance variants should be visually appealing without implying that ordinary creatures are inferior. Missing a rare encounter must not permanently close the discovery.

## 20. Accessibility, comfort, and player wellbeing

The game is designed to be approachable and comfortable for players who want a quiet, low-pressure activity.

Recommended principles:

- Optional music and separate control of ambient sound.
- Readable text and strong contrast for important information.
- Clear icons supplemented with text, rather than icons alone.
- Gentle animations and limited unnecessary flashing or sudden motion.
- Flexible session length with no penalties for closing the game.
- Clear indicators of habitat suitability and progression requirements.
- Optional contextual guidance for unfamiliar mechanics.
- A way to review discoveries without needing to remember previous sessions.
- No mandatory rapid tapping, timed building challenges, or competitive pressure.

The atmosphere should remain calm even when the player is managing a more complex ecosystem.

## 21. Initial content scope

The concept is intentionally broad, but the first playable version should focus on a complete, satisfying slice of the garden rather than attempting to include every proposed system immediately.

### 21.1 Recommended initial feature set

**Essential foundation** — Isometric garden, grid-based placement, plant growth, resource inventory, basic natural shelters, wildlife arrival, an illustrated journal, and a small pond.

**Complete opening journey** — The Forgotten Garden, wildflower planting, first butterfly encounter, natural shelter construction, one habitat milestone, and the first restoration opportunity.

**Essential return loop** — Real-time plant growth, bounded offline progress, resource production, convenient collection, wildlife observation, and a concise return recap.

**Next layer** — Bamboo grove restoration, habitat branching, pond upgrades, contextual hints, and a broader collection of plants and wildlife.

**Advanced layer** — Deep aquatic ecosystems, population dynamics, complex crafting, rare discoveries, and the larger interconnected progression tree.

The first playable version should prove that planting, waiting, observing, collecting, and making small improvements form a satisfying loop. The larger systems can then expand that proven foundation.

### 21.2 Proposed first content bundle

| Content type      | Suggested initial scope                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| Garden areas      | One complete starting garden, with the bamboo grove as the first expansion goal |
| Plants            | Approximately 6–10 starter species                                              |
| Wildlife          | Approximately 4–6 introductory species or groups                                |
| Natural materials | Approximately 6–8 distinct item types                                           |
| Habitats          | One natural shelter and a few basic natural features                            |
| Structures        | A small curated set of paths, stones, and Japanese-inspired decorations         |
| Progression       | First habitat milestone and initial restoration project                         |
| Journal           | Basic plant, wildlife, habitat, and resource records                            |

These numbers are planning suggestions, not final content commitments. The initial bundle should be large enough to demonstrate meaningful variety without making the opening difficult to understand.

## 22. Design risks and safeguards

| Potential risk                           | Design safeguard                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Too many systems introduced at once      | Introduce mechanics in stages and connect each new system to familiar ones              |
| Resource collection feels like chores    | Automatic accumulation, batch collection, and capped offline production                 |
| Ecology becomes overly complicated       | Use clear visual cues, contextual hints, and forgiving requirements                     |
| Rare species feel frustrating            | Keep encounters repeatable and let suitable habitats improve discovery chances          |
| Habitat choices feel punishing           | Preserve meaningful branches while providing later access to alternative paths          |
| The garden becomes visually cluttered    | Curated decoration sets, readable object silhouettes, and restrained interface elements |
| Progression feels slow later on          | Offer parallel goals, smaller discoveries, and ongoing creative rewards                 |
| Players feel obliged to return every day | No streaks, decay, deadlines, or required feeding schedules                             |
| Areas feel like reskins                  | Give each area distinct ecology, resources, restoration choices, and signature wildlife |
| The journal becomes a chore              | Keep it optional and reward curiosity rather than demanding completion                  |

## 23. Open design decisions

The following details should be refined during the next design pass. They are not necessary to understand the core game, but they will matter when balancing its full content.

- Final species catalogue: exact plants, animals, fungi, and habitat variants.
- Resource recipes: which materials are combined, what they produce, and which items have multiple uses.
- Habitat upgrade trees: exact branches, stages, benefits, and visual transformations for each structure.
- Population model: how territories, reproduction, carrying capacity, and species interactions affect the garden.
- Chapter requirements: exact milestones and restoration conditions for each new area.
- Rare discoveries: which species and features are rare, how hints work, and how discovery odds improve.
- Seasonal content: which visual changes and species appearances occur through the year.
- Long-term area plan: the number and themes of areas needed to support the Grand Sanctuary and ongoing development.

The guiding rule for all of these decisions is consistency: every added mechanic should reinforce cultivation, ecological discovery, restoration, or creative expression.

## 24. Consolidated design principles: confirmed versus proposed

### Confirmed through Stages 1–12

- Peaceful Japanese-inspired garden builder with a watercolor storybook art direction and isometric view.
- No human inhabitants; wildlife forms the living population.
- Grid-based construction, flexible layout, and natural terrain constraints.
- Real-time plant growth, distinct species behavior, optional tending, and bounded offline development.
- Physical natural resources, detailed inventory, and plant- and habitat-based production.
- Wildlife with natural routines, suitable habitat requirements, optional observation, and gradual population growth.
- A living pond with layered aquatic habitats and increasingly complex ecological relationships.
- Multi-stage habitat upgrades with meaningful branches, visual transformations, and species-specific benefits.
- Ecological milestones and restoration projects as the primary basis for land expansion.
- Optional task suggestions, an illustrated naturalist’s journal, and contextual discovery hints.
- Rare wildlife encounters that remain surprising, with suitable conditions improving discovery opportunities.
- Gentle weather, atmospheric sound, no daily decay, and no mandatory feeding chores.
- Distinct areas, modest curated decoration choices, a Grand Sanctuary milestone, and open-ended development.

### Proposals in this document

- Chapter names and the precise order of the first four areas.
- Starter plant and animal lists, exact inventory items, and approximate content counts.
- Illustrative chapter sequences, restoration choices, and sample crafting recipes.
- Specific interface labels, sample return recaps, and suggested chapter milestones.
- The initial feature bundle and its proposed content scope.

## 25. Final design vision

The finished game should feel like tending a small world that gradually becomes more beautiful, more diverse, and more surprising.

A player might begin with a few flowers and a neglected pond. Later, the same space may contain mature trees, layered aquatic habitats, handcrafted shelters, butterflies over the paths, frogs hidden among the reeds, and a network of restored garden areas joined by bridges and quiet pathways.

Its depth comes from the relationships between systems: plants support wildlife, wildlife reveals ecological opportunities, resources support construction, habitats evolve, and restoration opens new environments. Its relaxation comes from giving players the freedom to engage with these systems at their own pace.

The ultimate goal is not to control nature perfectly. It is to create a sanctuary where nature has room to flourish—and to enjoy watching it happen.
