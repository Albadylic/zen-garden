# Phase 2 Plan — Chapter 1 Snags, then The Bamboo Grove

Phase 2 has two parts, built in this order:

- **Part A: the Chapter 1 snag list.** Fixes and improvements from the first playtest, so the vertical slice is enjoyable before the game widens.
- **Part B: Chapter 2, The Bamboo Grove.** The first expansion. It covers the remainder of build-order phases 05, 07 and 09 (branching upgrades, contextual hints, restorable areas).

Pond and food-web ecology (build-order phase 08, Chapter 3) follows after this phase. Building Chapter 2 first departs from [`build-order.md`](build-order.md); the owner approved this to follow the chapter order in the design document.

Tick items as they land. Placeholders and decisions go in [`open-items.md`](open-items.md).

## Design rules confirmed for this phase

- **No predation is ever shown.** Animals never kill, eat or remove one another, and no creature disappears because of another. Food relationships only decide which species are _attracted_, for example "frogs arrive where insects are plentiful". Every departure is an ordinary, peaceful visit ending.
- **The bamboo grove is hidden until it opens.** It is not shown faded or greyed out beforehand.
- **Chapter 2 content is approved as proposed:** bamboo, Japanese forest grass and hosta; a songbird and a wood mouse; three upgrade branches (insect hotel, log lodge, nesting bundle).

---

## Part A — Chapter 1 snag list

### A1. Wildlife must never look like predation

Owner's report: the wren seemed to eat other animals. No creature is ever removed by another in the code. What it looks like:

- **Cause:** beetles go hidden inside their shelter while a wren perches on the same shelter, so the beetle appears to vanish next to the bird.
- **Cause:** the wren's journal text mentions searching for insects.

Fixes:

- [x] Show that a hidden creature is resting inside its shelter (a small resting marker on the shelter, plus residents listed in its panel), so nothing appears to vanish.
- [x] Birds perch beside the shelter, never on top of a resident's spot, and never at the moment a resident goes inside.
- [x] Rewrite journal and description text so no species is described hunting or eating another animal. Check every fact against the no-predation rule.
- [x] Add a content test that fails if facts mention hunting, eating or catching other animals.
- [x] Record the no-predation rule in `CLAUDE.md` and `open-items.md` so future species follow it.

### A2. Seeds pile up with nowhere to use them

Owner's report: about 60 seeds by the end of the chapter, without many places to plant them.

- [x] Slow seed production: longer intervals for wildflower seeds and other propagules, and a lower cap per plant.
- [x] Stop producing a seed type once the player holds plenty of it (a soft inventory cap, for example 12), so seeds never pile up.
- [x] Give seeds a use: a **seed bundle** recipe used as an ingredient in shelter upgrades (seed heads draw insects), and later as a bird-feeding feature in Chapter 2.
- [x] Rebalance the playthrough test so its end-of-chapter inventory stays within sensible bounds.

### A3. A second upgrade tier for the first shelter

- [x] Add a third level to the natural shelter in Chapter 1, for example **Mossy log lodge** (higher capacity and attraction, its own look).
  - It is reached after the shelter has had several residents.
  - It costs materials that include the new seed bundle.
- [x] Chapter 2's branching choice (insect hotel, log lodge, nesting bundle) then becomes the fourth level.
- [x] Tune wren arrival so the second tier is when birds become regular visitors.

### A4. A calmer interface: icons instead of wordy pop-ups

Owner's report: the interface gets too busy.

- [x] Replace "Gathered …" and "Cleared overgrowth and found …" toasts with small **item icons** that rise from where the item was gathered (or harvested) and fade out within about a second. Several items show as a short cluster with a count, for example "+2". They rise rather than drift to the Inventory tab, which keeps them in the garden and readable at any zoom. "Made …" and "Harvested …" text is gone too.
- [x] Keep text only for milestones (and the occasional "can't do that" note), shown as one compact line at a time, never stacked.
- [x] No journal pop-ups at all. New entries and newly learned facts put a notification badge on the Journal tab, inviting the player to visit when they choose. Inside, new entries and facts are highlighted until read. This keeps the journal optional and intentional.
- [x] The return recap mentions journal additions in a single line ("Your journal has 3 new notes") rather than listing them.
- [x] Respect reduced motion: icons fade in place without travelling.

### A5. More shade in the first garden

Owner's report: few excellent spots make placement hard.

- [x] Redesign the Chapter 1 map with more shaded and varied areas:
  - a third old pine beside the pond
  - a shaded, mossy strip along the north wall (map tiles can now add shade of their own)
  - four old azaleas, dense fixed shrubs that cast light shade and give cover
- [x] Spread moss terrain so the shade-loving plants and the shelter have several good-to-excellent spots in different parts of the garden. Excellent spots in a fresh garden: moss 11 → 29, fern 11 → 25, shelter 10 → 35, spread over every quarter of the garden.
- [x] Add a map test: at least 20 excellent tiles for each starter plant, 25 for the shelter, in at least three quarters of the garden.
- [x] Re-run the Chapter 1 playthrough test and adjust its tile choices (no changes were needed). Existing saves gain the new features on free tiles (save version 3).

### A6. The maple as a long-term goal

The maple taking hours to mature is good. Let it pay off in Chapter 2 rather than speeding it up:

- [ ] Keep the maple's growth roughly as is (about five hours, so it is mature the day after planting).
- [ ] Remind the player about it gently:
  - the inspect panel shows "fully grown in about N hours"
  - the return recap mentions the maple's progress
  - a Chapter 1 suggestion encourages planting it early (done)
- [x] When mature, the maple yields **maple leaves**, a seasonal-looking material.
- [x] It also yields **maple sap**, gathered from the tree rather than processed by people. Its use: a **sap feeder**, a small dish on a post that draws a sap-feeding butterfly (for example a red admiral). Some real butterflies feed on tree sap rather than nectar, so the sap gives the maple an ecological role, not just a crafting one.
- [ ] Chapter 2 uses maple leaves in a reward:
  - an optional milestone, "A tree comes of age"
  - leaves as an ingredient in the nesting bundle branch and in a decorative maple-leaf lantern
- [ ] A mature maple attracts the Chapter 2 songbird a little more strongly, linking the two chapters.

---

## Part B — Chapter 2: The Bamboo Grove

### B1. A larger garden with a hidden grove

- [x] One continuous map: the Chapter 1 garden plus the grove beyond the gate, hidden (not drawn and not selectable) until the gate opens.
- [x] Camera, placement and wildlife extend into the grove once it is revealed.
- [x] First real save migration (version 1 → 2), so existing Chapter 1 gardens upgrade without loss. Covered by a migration test.

### B2. Restoration projects

- [x] Staged restoration projects in data. Each stage combines materials, ecological conditions (for example "two shade plants established") and discoveries.
- [x] When the grove opens, the player chooses an approach:
  - **shaded planting corner**
  - **sheltered wildlife refuge**
  - **path and stone feature**
- [x] The choice changes which discoveries come first. All three approaches stay completable later.
- [x] A Restore panel shows project progress and the possible approaches.

### B3. New content (data)

- [x] **Plants:**
  - **Bamboo:** spreads slowly and can be harvested for canes.
  - **Japanese forest grass:** shade ground cover.
  - **Hosta:** shade, cover.
- [x] **Items:** bamboo shoots and canes, forest grass and hosta divisions, maple leaves and maple sap.
- [ ] **Wildlife:**
  - **Songbird (done: Japanese white-eye):** rests in mature bamboo, and is drawn more strongly by a mature maple.
  - **Wood mouse:** lives in the log lodge branch.
  - **A new behaviour from an existing species:** beetles overwintering in a refuge.
- [x] **Structures and decorations:** bamboo fence or screen, bamboo water spout (ahead of Chapter 3), maple-leaf lantern, sap feeder (maple sap).
- [x] **Sap-feeding butterfly:** visits a filled sap feeder; its own journal entry and facts.

### B4. Branching habitat upgrades

- [x] After the Mossy log lodge (A3), the shelter branches:
  - **insect hotel:** pollinators and beetles
  - **log lodge:** small mammals
  - **nesting bundle:** birds
- [x] Each branch has its own look, residents, production and capacity.
- [x] The branch not taken stays available by building another shelter. Nothing is locked out.

### B5. Contextual hints

- [x] Undiscovered journal entries show hints that get more specific with progress, for example "favours tall, dense growth" → "nests in mature bamboo".
- [x] Suggestions cover the grove, its project and the maple payoff.

### B6. Chapter 2 milestones

- [x] Inspect the grove → choose an approach → plant bamboo and understory plants → gather canes → branch-upgrade a shelter → discover a new creature or behaviour → complete the grove's first restoration stage.
- [x] Optional milestone: "A tree comes of age" (the maple matures).
- [x] Playthrough test proving Chapter 2 can be completed, with its pacing measured.

### B7. Carry-overs

- [x] Only redraw when something changes, to save phone battery.
- [x] A reduce-motion setting (GDD 20).
- [x] Safari (WebKit) in the browser tests, ahead of the iPhone port (smoke, layout and persistence specs on an iPhone 13 profile, run in CI).

### Quality

- [x] Unit tests for every new system, and browser tests for choosing a restoration approach and completing a branch upgrade.
- [x] `docs/open-items.md` updated with every new placeholder and decision.

## Out of scope for this phase

- Pond depth, aquatic plants and food webs (Chapter 3)
- Population growth
- Rare encounters
- Weather and seasons
- Audio
- Final watercolour art
- Capacitor iPhone port
