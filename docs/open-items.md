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

Each has a default I will build with so work is not blocked. Values live in data or config so they can change without code changes.

### Phase 01 — Garden foundation

| Status | Decision                                                           | Placeholder default                                                               |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| ☐      | Starting garden size in tiles                                      | 16 × 16                                                                           |
| ☐      | Starting layout: pond, paths, shaded corner, trees, boundary       | Hand-authored layout in a JSON map file, following GDD Chapter 1 "Starting state" |
| ☐      | Tile dimensions / art scale                                        | 128 × 64 px tiles, 2:1 isometric                                                  |
| ☐      | Camera rotation                                                    | None (single fixed view)                                                          |
| ☐      | Zoom limits                                                        | 0.5× – 2×                                                                         |
| ☐      | Terrain types in the starting garden                               | Grass, moss, stone path, water, pond edge, overgrown                              |
| ☐      | Can terrain be edited (e.g. clearing overgrowth, extending paths)? | Paths and stepping stones placeable; other terrain fixed in the slice             |

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

| Status | Decision                     | Placeholder default                                                                     |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| ☐      | Starter item list            | GDD 9.2: wildflower seeds, twigs, loose stones, leaf litter, bark, berries              |
| ☐      | Opening inventory quantities | 5 wildflower seeds, 6 twigs, 4 stones, 3 leaf litter, 2 bark                            |
| ☐      | Production rates and sources | Mature wildflowers → seeds; maple → twigs, leaf litter; grasses → stems                 |
| ☐      | Stack / storage limits       | None in the slice                                                                       |
| ☐      | Collection model             | Auto-collect into inventory, with visible items in the garden and one-tap batch collect |
| ☐      | First recipes                | Twigs + bark → basic natural shelter                                                    |

### Phase 04 — Wildlife

| Status | Decision                              | Placeholder default                                             |
| ------ | ------------------------------------- | --------------------------------------------------------------- |
| ☐      | Starter wildlife list                 | Butterflies and wild bees first; small birds and pond fish next |
| ☐      | Attraction conditions per species     | Butterflies: mature flowering plants within a few tiles         |
| ☐      | How many creatures on screen at once  | Small cap (≈ 5–10) for calm visuals and performance             |
| ☐      | Animation detail                      | Simple loops: idle, move, feed, rest                            |
| ☐      | Can the player tap/inspect creatures? | Yes: name, current behaviour, known journal facts               |

### Phase 05 — Habitats

| Status | Decision                                 | Placeholder default                                       |
| ------ | ---------------------------------------- | --------------------------------------------------------- |
| ☐      | First shelter design and footprint       | Log/twig natural shelter, 1 × 1                           |
| ☐      | Upgrade stages and branches in the slice | Two stages (basic → improved); branching after the slice  |
| ☐      | Habitat suitability scoring              | Shared suitability model: shade + cover + nearby plants   |
| ☐      | Benefits of upgrades                     | Visual change + higher attraction + small resource output |

### Phase 06 — Progression and tutorial

| Status | Decision                           | Placeholder default                                        |
| ------ | ---------------------------------- | ---------------------------------------------------------- |
| ☐      | Chapter 1 milestone list and order | GDD 14 "Proposed opening sequence"                         |
| ☐      | First habitat milestone condition  | Build a shelter and have it visited once                   |
| ☐      | Bamboo grove unlock condition      | First habitat milestone + a small material cost            |
| ☐      | Tutorial style                     | Gentle optional suggestions (max 3 shown); no forced steps |

### Phase 07 — Journal

| Status | Decision                                 | Placeholder default                                                    |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| ☐      | Journal entry text for each species/item | Short placeholder text written by me, flagged for review               |
| ☐      | How facts are revealed                   | Name + illustration on first sighting; more facts on repeat encounters |
| ☐      | Journal visual style                     | Simple notebook-styled panel until final art                           |

### Phases 08–12 — Later systems

| Status | Decision                                       | Placeholder default                                    |
| ------ | ---------------------------------------------- | ------------------------------------------------------ |
| ☐      | Pond zones and upgrade stages                  | GDD 8.1 / 8.2                                          |
| ☐      | Population model (growth, capacity limits)     | Logistic growth toward a habitat capacity; no collapse |
| ☐      | Food-web relationships                         | GDD 7.5 examples                                       |
| ☐      | Bamboo grove layout and restoration approaches | GDD 12.2 three approaches                              |
| ☐      | **Offline progress cap**                       | 8 hours of simulated time                              |
| ☐      | Return recap contents                          | GDD 13.3 categories, only shown when something changed |
| ☐      | Rare species list and discovery odds           | Deferred                                               |
| ☐      | Seasons: real calendar or in-game cycle        | Deferred                                               |
| ☐      | Weather frequency                              | Deferred; purely visual                                |
| ☐      | Grand Sanctuary requirements                   | Deferred                                               |
| ☐      | Final game title                               | "Zen Garden City-Builder" (working title)              |

---

## 3. Art placeholders

All art starts as shapes drawn in code (`pixi.js` Graphics) or simple generated images. Rendering code references sprites by id through a manifest, so final art can be dropped in without code changes.

**Target format for final art:** PNG spritesheets with JSON atlases, @1x and @2x (possibly @3x for iPhone), consistent bottom-centre anchor on each sprite's tile footprint, soft watercolour style per GDD 2.2–2.3.

**Art direction reference:** [`docs/art/forgotten-garden-concept.jpg`](art/forgotten-garden-concept.jpg) is the target look for Level 1 ("Day 0 – Forgotten Garden"). It shows overgrown, partly restored and fully restored areas side by side, labelled with the asset-pack filenames. The sprites currently in the pack are much simpler than this, so the final art should be judged against the concept image.

**Level 1 MVP asset pack received (2026-10-17):** 56 PNG sprites and 15 SVG icons in [`public/assets/`](../public/assets/README.md), covering terrain tiles, plants by growth stage, maple, bamboo, pond, butterfly and bee frames, resources, natural shelter stages, placement overlays, effects and core UI icons. Terrain and scenery sprites are drawn in the starting garden through the sprite manifest (`src/content/sprites.json`); the rest are listed there, ready for the systems that use them. They are @1x individual PNGs rather than the target atlas format and are simpler than the concept art, so the rows below stay open.

**Sprite anchors** in `src/content/sprites.json` were generated from each image's visible pixels (bottom-centre of the opaque area for standing sprites, centre for tiles, creatures and effects), because the pack had no anchor data. Adjust them by hand where a sprite sits wrongly. `ground_earth_edge.png` is not used: side by side it leaves a sawtooth gap, so the garden has no visible edge thickness yet.

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

| Status | Item                                                                          | Notes                                                                                                                                                                                                                                                                              |
| ------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ☐      | Licences for all art, audio and fonts allow commercial App Store distribution | Record source and licence per asset. Level 1 MVP asset pack and concept image: AI-generated with Google Gemini (owner, 2026-10-17). Confirm the Gemini terms for the account used allow commercial use, and note that purely AI-generated images may not be protected by copyright |
| ☐      | Privacy policy                                                                | Required for the App Store even with local-only saves                                                                                                                                                                                                                              |
| ☐      | Project licence                                                               | Repository currently has none (all rights reserved by default)                                                                                                                                                                                                                     |

---

## 7. Technical placeholders to revisit

| Status | Item                                              | Starting approach                                             | Revisit when                                       |
| ------ | ------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| ☐      | Save storage                                      | IndexedDB behind a `SaveStore` interface                      | iPhone port: switch to native storage              |
| ☐      | Safari 7-day storage eviction                     | Request `navigator.storage.persist()`; add save export/import | Before public playtesting                          |
| ☐      | Playwright browsers                               | Chromium only (desktop + Pixel 7 viewport)                    | Before iPhone port: add WebKit                     |
| ☐      | Hosting                                           | GitHub Pages                                                  | If Pages limits become a problem: Netlify / Render |
| ☐      | Offline install                                   | None                                                          | After the vertical slice: consider a PWA           |
| ☐      | Performance budget (sprite count, texture memory) | Untuned                                                       | Once real art and many entities exist              |
