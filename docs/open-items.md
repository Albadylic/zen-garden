# Open Items — Owner Actions, Decisions and Placeholders

Everything that depends on the project owner, and every placeholder the build starts with that must be replaced later. Update this file as items are resolved: tick the box, record the answer, and note the commit or date.

**Status key:** ☐ open · ☑ resolved

**Needed by** refers to the phase numbers in [`build-order.md`](build-order.md).

---

## 1. Owner actions (blocking or time-sensitive)

| Status | Action                                                                                                            | Needed by                | Notes                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| ☐      | Enable GitHub Pages: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then re-run the deploy | Now                      | Deploys fail until this is done. Site will be at `https://albadylic.github.io/zen-garden/` |
| ☐      | Delete the stale `docs/design-documents` branch on GitHub (**Branches** page)                                     | Any time                 | Already merged; the session proxy blocked deletion                                         |
| ☐      | Test the Pages build on a real phone after each phase                                                             | From 01                  | Emulated viewports miss touch feel and performance                                         |
| ☐      | Decide who produces the art (see section 3)                                                                       | Before 12, ideally by 04 | Longest lead time of anything on this list                                                 |
| ☐      | Decide who produces the audio (see section 4)                                                                     | Before 12                |                                                                                            |
| ☐      | Access to a Mac with Xcode (or approve macOS CI runners)                                                          | iPhone port              | Required to build the iOS app                                                              |
| ☐      | Apple Developer Program membership (US$99/year)                                                                   | iPhone port              | Needed for TestFlight and App Store                                                        |
| ☐      | Optional: review of the Japanese-inspired elements by someone familiar with Japanese garden design                | Before release           | Lanterns, gates, stone arrangements, naming                                                |

---

## 2. Design decisions

### Confirmed by the owner

| Decision          | Detail                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No predation      | Animals never kill, eat or remove one another, and nothing disappears because of another creature. Some species arrive only when others are already present (the wren comes to a garden busy with insects), but no text or animation shows hunting or eating                                        |
| Chapter order     | Chapter 2 (Bamboo Grove) is built before pond ecology (Chapter 3)                                                                                                                                                                                                                                   |
| Grove reveal      | The grove is hidden until its gate opens, not shown faded                                                                                                                                                                                                                                           |
| World layout      | The sanctuary follows the first-batch world map (`forgotten_garden_first_batch.md`): twelve gardens in a 3 × 4 grid. The Bamboo Grove lies north of the Forgotten Garden through a gate in its north wall; the Noble Garden (12) lies east of it, joined later by a special return gate             |
| Separate gardens  | Each garden has its own map file, placed in the world by `world.json`, which also lists all twelve gardens and the gates between them. A garden added to the content later appears in existing saves without a migration                                                                            |
| Garden 1 feature  | The Japanese maple the player plants is the Forgotten Garden's signature feature. The old black pines and azaleas stay                                                                                                                                                                              |
| Chapter 2 content | Keep the built version: bamboo, Japanese forest grass, hosta; Japanese white-eye, wood mouse, mason bee, red admiral; shelter branches: insect hotel, log lodge, nesting bundle. Ideas from the first-batch doc (dwarf bamboo, climbing vines, spiders, plant fibre) can join this or later gardens |
| Shelter tiers     | A second upgrade tier is added in Chapter 1; branching becomes the next tier in Chapter 2                                                                                                                                                                                                           |
| Maple             | Stays slow; pays off in Chapter 2 with maple leaves and maple sap. Sap fills a sap feeder that draws a sap-feeding butterfly; leaves go into the nesting branch and a lantern                                                                                                                       |
| Journal notices   | No journal pop-ups. New entries and facts show as a badge on the Journal tab, read when the player chooses                                                                                                                                                                                          |

Each has a default I will build with so work is not blocked. Values live in data or config so they can change without code changes.

### Phase 01 — Garden foundation

| Status | Decision                                                           | Placeholder default                                                                                                        |
| ------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| ☐      | Starting garden size in tiles                                      | 16 × 16                                                                                                                    |
| ☐      | Starting layout: pond, paths, shaded corner, trees, boundary       | Hand-authored layout in a JSON map file, following GDD Chapter 1 "Starting state"                                          |
| ☐      | Tile dimensions / art scale                                        | 128 × 64 px tiles, 2:1 isometric                                                                                           |
| ☐      | Camera rotation                                                    | None (single fixed view)                                                                                                   |
| ☐      | Zoom limits                                                        | 0.5× – 2×; on phones the minimum drops so the whole garden still fits, and the camera opens with tiles at least 56 px wide |
| ☐      | Terrain types in the starting garden                               | Grass, moss, stone path, water, pond edge, overgrown                                                                       |
| ☐      | Can terrain be edited (e.g. clearing overgrowth, extending paths)? | Paths and stepping stones placeable; other terrain fixed in the slice                                                      |

### Phase 02 — Planting and growth

| Status | Decision                                    | Placeholder default                                                                                       |
| ------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ☐      | Final starter plant list                    | GDD 6.2: garden moss, ferns, Japanese maple sapling, wildflower mix, ornamental grasses, pond-edge plants |
| ☐      | Real-time growth durations per species      | Wildflowers ≈ minutes; grasses/ferns ≈ hours; maple ≈ days                                                |
| ☐      | Growth stages per species                   | GDD 6.1 model; not every species uses all four                                                            |
| ☐      | Suitability factors (what each tile tracks) | Shade, moisture, proximity to water, nearby cover                                                         |
| ☐      | Effect of poor suitability                  | Slower growth / lower output; never death                                                                 |
| ☐      | Moss spreading rules                        | Slow spread onto adjacent damp, shaded tiles                                                              |
| ☐      | Optional tending (watering, pruning) effect | Small establishment boost; never required                                                                 |

### Phase 03 — Resources and inventory

| Status | Decision                     | Placeholder in use                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☐      | Starter item list            | 10 items: wildflower seeds, moss spores, fern spores, grass seeds, maple samaras, rush cuttings, twigs, bark, stones, leaf litter. Berries left out until a fruiting plant exists                                                                                                                                                                                          |
| ☐      | Opening inventory quantities | 4 wildflower seeds, 2 each of moss spores, fern spores, grass seeds and rush cuttings, 1 maple samara, 2 twigs, 1 bark, 1 leaf litter, 4 stones                                                                                                                                                                                                                            |
| ☐      | Production rates and sources | Old pines: twigs every 2 min, leaf litter every 4 min, bark every 5 min. Wildflowers → seeds; moss, ferns, grasses, rushes → their own propagules; maple → twigs, leaf litter, samaras                                                                                                                                                                                     |
| ☐      | First garden layout          | Three old black pines (two in the north-west corner, one by the pond), four old azaleas (fixed shrubs that cast light shade and give cover, and drop leaf litter every 6 min), and a mossy strip of shade along the north wall (A5 snag). Map tests require at least 20 excellent spots per starter plant and 25 for the shelter, spread over three quarters of the garden |
| ☐      | Items lying per source       | At most 2 of each item per source before it pauses. Seed production also pauses while the player holds 12 of that seed (A2 snag)                                                                                                                                                                                                                                           |
| ☐      | Clearing overgrowth yield    | Twigs 1–2 always; leaf litter 50%; stones 30%; bark 15%                                                                                                                                                                                                                                                                                                                    |
| ☐      | Stack / storage limits       | None in the slice                                                                                                                                                                                                                                                                                                                                                          |
| ☐      | Collection model             | Items appear in the garden; tap one or Gather all; anything left 45 s while playing is gathered automatically. Items from time away wait to be gathered                                                                                                                                                                                                                    |
| ☐      | First recipes                | Natural shelter: twigs ×6 + bark ×2 + leaf litter ×2. Stone decorations: stones ×1–3                                                                                                                                                                                                                                                                                       |

### Phase 04 — Wildlife

| Status | Decision                              | Placeholder in use                                                                                                                                                                         |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ☐      | Starter wildlife list                 | Small white butterfly, swallowtail butterfly, bumblebee (nectar visitors); ground beetle and wren (shelter visitors). Pond fish deferred with pond ecology                                 |
| ☐      | Attraction conditions per species     | Small white: any flowering patch. Bumblebee: 2+ patches. Swallowtail: 4+ patches (uncommon). Ground beetle: a shelter rated fair or better. Wren: an improved shelter rated good or better |
| ☐      | How many creatures on screen at once  | Per species: 1–4; small whites limited to one per flowering patch (max 3). About 12 at most                                                                                                |
| ☐      | Visit length                          | Butterflies and bees 40–150 s; beetles 5–15 min; wren 1.5–4 min                                                                                                                            |
| ☐      | Animation detail                      | Placeholder: wing flaps, hovering flight, settling to feed or perch; beetles hide inside their shelter                                                                                     |
| ☐      | Can the player tap/inspect creatures? | Yes: name, description, current behaviour, and facts revealed by number of sightings                                                                                                       |

### Phase 05 — Habitats

| Status | Decision                                 | Placeholder in use                                                                                                     |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ☐      | First shelter design and footprint       | Natural shelter (twig, bark and leaf pile), 1 × 1, on grass or moss                                                    |
| ☐      | Upgrade stages and branches in the slice | Two levels: Natural shelter → Sheltered log pile (twigs ×4, bark ×3, stones ×2, after its first resident). No branches |
| ☐      | Habitat suitability scoring              | Shared suitability model: prefers shade 0.35+, moisture 0.35–0.85, nearby plant cover 0.25+                            |
| ☐      | Benefits of upgrades                     | Capacity 2 → 4, attraction ×1 → ×1.8, produces leaf litter every 10 min, attracts wrens, new look                      |

### Phase 06 — Progression and tutorial

| Status | Decision                           | Placeholder in use                                                                                                                                                                                           |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ☐      | Chapter 1 milestone list and order | 8 milestones: first planting → signs of growth → clear 3 overgrown tiles → gather 8 items (unlocks shelter recipe) → first butterfly → build a shelter → first resident (unlocks upgrade) → 3 species mature |
| ☐      | First habitat milestone condition  | A natural shelter receives its first resident                                                                                                                                                                |
| ☐      | Bamboo grove unlock condition      | Completing all Chapter 1 milestones (no material cost). The gate opens and bamboo appears beyond the wall; the grove itself is not playable yet                                                              |
| ☐      | Tutorial style                     | One optional suggestion on screen (more in Goals), never forced; milestones complete in order but progress made out of order still counts                                                                    |
| ☐      | Chapter length                     | About 12 minutes when played efficiently (tested); expect 25–40 minutes for a relaxed first play. Tune with real players                                                                                     |

### Phase 07 — Journal

| Status | Decision                                 | Placeholder in use                                                                                                                                     |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ☐      | Journal entry text for each species/item | Short descriptions and 1–3 facts per entry, written as placeholders and flagged for review (see section 5)                                             |
| ☐      | How facts are revealed                   | Entries are discovered on first encounter (planting, sighting, building, gathering, or inspecting). Each fact unlocks after a set number of encounters |
| ☐      | What counts as an encounter              | Plants: planting and each new growth stage. Wildlife: each arrival. Shelters: building, upgrading and each new resident. Items: each gathering         |
| ☐      | Journal visual style                     | Simple notebook-styled panel with Plants / Wildlife / Habitats / Materials tabs until final art                                                        |

### Chapter 2 — The Bamboo Grove

| Status | Decision                  | Placeholder in use                                                                                                                                                                |
| ------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☐      | Grove layout              | 9 × 14 open tiles east of the garden: old bamboo clumps, a stone basin, a path, lots of overgrowth                                                                                |
| ☐      | Chapter 2 starting gift   | 2 bamboo shoots, 2 forest grass divisions, 2 hosta divisions, given when the grove opens                                                                                          |
| ☐      | Restoration approaches    | Shaded corner (clear 4, grow 3 shade plants to full size), wildlife refuge (build a shelter, a resident moves in), path and stone (3 stepping stones or paths, a water spout)     |
| ☐      | Chapter 2 milestones      | Look around the grove → choose an approach → plant bamboo and 2 shade plants → gather 10 canes (unlocks branches) → branch a shelter → a new species arrives → finish an approach |
| ☐      | Optional milestone        | "A tree comes of age" when a maple matures: unlocks the sap feeder and maple-leaf lantern                                                                                         |
| ☐      | Chapter 2 length          | About 24 minutes when played efficiently (tested); expect 40+ for a relaxed play                                                                                                  |
| ☐      | Bamboo harvest and spread | 2 canes per harvest, 10 min to recover; spreads about once every 3 hours per clump, never more than 4 close together                                                              |
| ☐      | Sap feeder                | Lasts 1 hour per measure of sap, up to 2 in reserve                                                                                                                               |

### Phases 08–12 — Later systems

| Status | Decision                                       | Placeholder default                                                                                                                                                                                                                                                                                 |
| ------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☐      | Pond zones and upgrade stages                  | GDD 8.1 / 8.2                                                                                                                                                                                                                                                                                       |
| ☐      | Population model (growth, capacity limits)     | Logistic growth toward a habitat capacity; no collapse                                                                                                                                                                                                                                              |
| ☐      | Food-web relationships                         | Species can list companions they arrive `alongside` (data in `wildlife.json`). In use: the wren comes only while at least two insects (butterflies, bees or beetles) are in the sanctuary. More relationships (frogs where pond insects thrive) come with Chapter 3. Arrivals only, never predation |
| ☐      | Bamboo grove layout and restoration approaches | GDD 12.2 three approaches                                                                                                                                                                                                                                                                           |
| ☐      | **Offline progress cap**                       | 8 hours of simulated time (in use). The recap says when the cap was reached                                                                                                                                                                                                                         |
| ☐      | Return recap contents                          | Growth, blooms, moss spread, visitors and new species, shelter residents, items waiting, journal additions, milestones. Shown after 1 minute or more away, only if something changed                                                                                                                |
| ☐      | Rare species list and discovery odds           | Deferred                                                                                                                                                                                                                                                                                            |
| ☐      | Seasons: real calendar or in-game cycle        | Deferred                                                                                                                                                                                                                                                                                            |
| ☐      | Weather frequency                              | Deferred; purely visual                                                                                                                                                                                                                                                                             |
| ☐      | Grand Sanctuary requirements                   | Deferred                                                                                                                                                                                                                                                                                            |
| ☐      | Final game title                               | "Zen Garden City-Builder" (working title)                                                                                                                                                                                                                                                           |

---

## 3. Art placeholders

All art starts as shapes drawn in code (`pixi.js` Graphics) or simple generated images. Rendering code references sprites by id through a manifest, so final art can be dropped in without code changes.

**Target format for final art:** PNG spritesheets with JSON atlases, @1x and @2x (possibly @3x for iPhone), consistent bottom-centre anchor on each sprite's tile footprint, soft watercolour style per GDD 2.2–2.3.

| Status | Asset group           | Placeholder                              | Final asset needed                                                                   |
| ------ | --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| ☐      | Terrain tiles         | Flat-coloured isometric diamonds         | Grass, moss, stone path, water, pond edge, overgrown; seamless edge/transition tiles |
| ☐      | Boundary / scenery    | Simple outlines                          | Garden walls/hedges, distant scenery, mature existing trees                          |
| ☐      | Plants                | Coloured shapes per growth stage         | Each species × each growth stage (≈ 3–4 frames), optional sway animation             |
| ☐      | Wildlife              | Small coloured shapes with simple motion | Each species: idle, move, feed, rest loops                                           |
| ☐      | Habitats / structures | Blocky shapes                            | Natural shelter (each upgrade stage), stones, stepping stones, lanterns, bridge      |
| ☐      | Resource items        | Small icons/shapes in the garden         | In-garden item sprites + inventory icons                                             |
| ☐      | UI icons              | Text labels or basic SVGs                | SVG icon set (plants, habitats, water, restore, inventory, journal, suggestions)     |
| ☐      | Journal illustrations | Reuse sprites or blank frames            | Illustrated notebook entries per species                                             |
| ☐      | Effects               | None or simple tints                     | Dew, ripples, falling leaves, lantern glow, rain, mist                               |
| ☐      | App icon / splash     | Default favicon                          | App icon (all iOS sizes), splash screen, social preview image                        |
| ☐      | Font                  | System font stack                        | Licensed display + body fonts (a free Google Font is simplest)                       |

---

## 4. Audio placeholders

Audio is silent until phase 12 unless assets arrive earlier. Audio hooks are wired to simulation events, so sounds can be added without touching game logic.

| Status | Asset group        | Final asset needed                                                            |
| ------ | ------------------ | ----------------------------------------------------------------------------- |
| ☐      | Ambient loops      | Garden paths, pond, bamboo grove, flowering beds, woodland, evening (GDD 2.4) |
| ☐      | Interaction sounds | Plant, place, collect, build, upgrade, journal entry, discovery               |
| ☐      | Music              | Subtle Japanese-inspired instrumental tracks                                  |
| ☐      | Volume settings    | Separate music / ambience / effects controls (GDD 20)                         |

---

## 5. Content text placeholders

| Status | Content                                  | Placeholder                                            |
| ------ | ---------------------------------------- | ------------------------------------------------------ |
| ☐      | Species names and descriptions           | Plain names; short descriptions written by me          |
| ☐      | Journal facts (behaviour, habitat, food) | Brief, ecologically plausible text, flagged for review |
| ☐      | Suggestions and hint text                | Short functional wording                               |
| ☐      | Return recap wording                     | GDD 13.3 examples                                      |
| ☐      | Chapter and area names                   | GDD 14 proposed names                                  |

---

## 6. Licensing and legal

| Status | Item                                                                          | Notes                                                          |
| ------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ☐      | Licences for all art, audio and fonts allow commercial App Store distribution | Record source and licence per asset                            |
| ☐      | Privacy policy                                                                | Required for the App Store even with local-only saves          |
| ☐      | Project licence                                                               | Repository currently has none (all rights reserved by default) |

---

## 7. Technical placeholders to revisit

| Status | Item                                              | Starting approach                                                                                                                        | Revisit when                                        |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ☐      | Save storage                                      | IndexedDB behind a `SaveStore` interface                                                                                                 | iPhone port: switch to native storage               |
| ☐      | Safari 7-day storage eviction                     | In place: `navigator.storage.persist()` requested at start, save export/import in Settings, and a warning when storage is not persistent | Before public playtesting: decide if this is enough |
| ☑      | Playwright browsers                               | Chromium (desktop + Pixel 7) everywhere; WebKit (iPhone 13) in CI for smoke, layout and persistence                                      | Extend WebKit coverage before the iPhone port       |
| ☐      | Hosting                                           | GitHub Pages                                                                                                                             | If Pages limits become a problem: Netlify / Render  |
| ☐      | Offline install                                   | None                                                                                                                                     | After the vertical slice: consider a PWA            |
| ☐      | Performance budget (sprite count, texture memory) | Untuned                                                                                                                                  | Once real art and many entities exist               |
