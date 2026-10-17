# Zen Garden City-Builder — Recommended Build Order

Build the game in dependency order: establish a small, playable garden first, then layer in ecology, progression, and content. Each phase should leave the game in a playable state.

The content for the first batch of twelve gardens is outlined in [`forgotten_garden_first_batch.md`](forgotten_garden_first_batch.md). Its production priorities (section 13) follow the same order as the phases below.

## Progress

| Phase                              | Status      | Where it stands                                                                                                |
| ---------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| 01. Garden foundation              | Done        | Isometric grid, terrain, placement, camera; the Forgotten Garden                                               |
| 02. Planting and growth            | Done        | Growth stages, suitability, flowering, moss and bamboo spreading                                               |
| 03. Resources and inventory        | Done        | Physical items, batch gathering, recipes, crafted items                                                        |
| 04. Wildlife                       | Done        | Nectar, shelter, perch and feeder attraction; arrivals that depend on other species; rare visitors             |
| 05. Habitats and upgrades          | Done        | Natural shelter with tiers and branches, and a habitat or structure in every garden                            |
| 06. Core progression and tutorial  | Done        | Chapter 1 milestones, suggestions, the gate to the grove                                                       |
| 07. Journal and discovery          | Done        | Journal with facts, hints and a "new" badge; no pop-ups                                                        |
| 08. Pond and food-web ecology      | Done        | Water depth (Living Waters), streams, marshes; food relationships as arrival rules only                        |
| 09. Land restoration and expansion | Done        | All twelve gardens of the first batch, each with its own map, content and restoration project, joined by gates |
| 10. Offline development            | Done        | Bounded catch-up, return recap, slow-grower reminders                                                          |
| 11. Advanced progression           | Mostly done | Seasons, the golden dragonfly, the return gate. Optional side gates and a world-map overview are still to come |
| 12. Atmosphere and polish          | Not started | Placeholder art and no audio so far                                                                            |

Chapter 2 was built before pond ecology, with the owner's approval, to follow the chapter order of the first batch. Gardens 3–12 were built from [`chapter-build-guide.md`](chapter-build-guide.md). Next: the owner's [`snag-list.md`](snag-list.md), then polish (phase 12).

## 01. Garden foundation (first)

- Isometric camera, grid, terrain, and placement rules.
- Basic garden scene, selection, movement, and object placement.
- Initial pond, stones, paths, and garden boundaries.

**Goal:** a space the player can explore and arrange.

## 02. Planting and growth

- Plant seeds and place young plants.
- Implement growth stages, species-specific behavior, and suitability.
- Add flowering, spreading, maturity, and resource production.

**Goal:** the garden changes visibly over time.

## 03. Resources and inventory

- Define item types, quantities, and sources.
- Make plants produce seeds, twigs, berries, and other appropriate items.
- Add physical resource displays, inventory management, and batch collection.
- Add simple construction recipes.

**Goal:** growth produces useful materials for the next action.

## 04. Wildlife arrival and observation

- Add species, habitat preferences, and attraction conditions.
- Introduce autonomous movement, idle behavior, feeding, and resting.
- Add arrival events and simple creature inspection.
- Start with butterflies and pollinators.

**Goal:** the garden feels alive in response to the player’s choices.

## 05. Habitats and upgrades

- Build natural shelters using collected materials.
- Evaluate habitat suitability.
- Add upgrade stages, branching choices, and visual transformations.
- Connect habitat quality to wildlife visits and resources.

**Goal:** players can deliberately improve conditions for wildlife.

## 06. Core progression and tutorial

- Introduce milestones, unlocks, and optional suggestions.
- Build the opening chapter: plant flowers, attract a butterfly, construct a shelter.
- Add the first habitat milestone and bamboo-grove unlock.

**Goal:** a complete beginning-to-first-expansion gameplay loop.

## 07. Journal and discovery guidance

- Add plant, wildlife, habitat, and resource records.
- Track discoveries and unknown information.
- Add contextual hints and a small list of suggested actions.

**Goal:** players can understand what to try next without being forced to follow tasks.

## 08. Pond and food-web ecology

- Add pond edges, shallow zones, deeper water, and aquatic plants.
- Introduce aquatic insects, frogs, and specialized amphibian shelters.
- Connect plants, food sources, cover, and suitable wildlife. Species can arrive alongside others (frogs where pond insects thrive), but no animal is ever shown hunting, eating or removing another.
- Add population growth and gentle habitat capacity limits.

**Goal:** multiple living systems interact meaningfully.

## 09. Land restoration and expansion

- Give each garden its own map, placed on the sanctuary's world map and joined to its neighbours by gates.
- Implement staged restoration projects using materials, discoveries, and ecological milestones.
- Introduce new plants, habitats, resources, and wildlife garden by garden, following the first batch's twelve gardens.
- Add a world-map overview of all twelve gardens, showing which are restored and which gates are open.

**Goal:** progression expands both the map and the depth of play.

## 10. Offline development and return experience

- Advance plant growth and resource production while away.
- Simulate bounded wildlife and population changes.
- Add return summaries and newly available opportunities.
- Ensure long absences never cause punitive losses.

**Goal:** returning feels rewarding without creating obligations.

## 11. Advanced progression and rare discoveries

- Add rare encounters, such as the Noble Garden's golden dragonfly, specialized habitat branches, and advanced crafting.
- Connect journal milestones to new restoration opportunities.
- Build additional garden-specific ecosystems, optional gates between neighbouring gardens, and the special return gate between the Noble Garden and the Forgotten Garden.
- Add seasons, with the Four Seasons Garden as their showcase.

**Goal:** long-term depth without mandatory grinding.

## 12. Atmosphere, polish, and endgame

- Finalize watercolor art, animations, ambient audio, weather, and seasonal visuals.
- Refine mobile-friendly controls and the garden interface.
- Restore the Noble Garden as the first batch's landmark (a milestone, not an ending) and add open-ended goals.
- Keep the content structure ready for further batches of twelve gardens.
- Balance progression, accessibility, and session pacing.

**Goal:** a cohesive, relaxing experience that supports continued play.

## The key development rule

Complete a vertical slice before building the entire game.

The first playable slice should include:

- One garden.
- A handful of plants with real growth.
- Collectible natural resources and an inventory.
- Butterflies that arrive in response to flowers.
- One buildable natural shelter.
- One habitat milestone and a basic unlock.
- A return visit that reveals visible progress.

Once that loop is enjoyable, expand into more species, deeper pond ecology, branching upgrades, and additional land.

This order prioritizes the game’s defining experience—plant, grow, attract wildlife, improve the habitat, and watch the garden flourish—before investing in its larger content catalogue.
