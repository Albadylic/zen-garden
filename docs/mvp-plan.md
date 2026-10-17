# MVP Plan — A Single Playable Level

The MVP is the vertical slice from [`build-order.md`](build-order.md): one complete garden, Chapter 1 "The Forgotten Garden", playable from first planting through to the bamboo-grove unlock, with a return visit that shows progress.

Tick items as they land. Placeholders and open decisions used along the way are tracked in [`open-items.md`](open-items.md).

## 1. Garden foundation

- [x] Isometric grid model and grid ↔ screen coordinate maths
- [x] Starting garden map as data: terrain, pond, paths, existing trees, shaded corner, boundary
- [x] Terrain rendering with placeholder tiles and correct depth sorting
- [x] Camera: pan, pinch/scroll zoom, limits, fit-to-screen
- [x] Unified pointer input for mouse and touch: tap, drag, pinch
- [x] Tile selection and highlight
- [x] Placement system: preview, valid/invalid feedback, confirm, cancel, move, remove, undo
- [x] Placeable decorations: stepping stones, stone paths, loose stones

## 2. Simulation core

- [x] Game state model and deterministic tick driven by real elapsed time
- [x] Seeded random number generator
- [ ] Event log ("plant matured", "butterfly arrived", …) feeding the UI, recap and milestones
- [x] Per-tile suitability model (shade, moisture, water proximity, cover), shared by plants, wildlife and habitats
- [x] Content loader with schema validation for JSON data

## 3. Plants and growth

- [x] About 6 starter species defined in data (GDD 6.2 proposed list)
- [x] Planting from seeds in the inventory
- [x] Species-specific real-time growth stages with visual change per stage
- [x] Suitability affects growth speed and output; plants never die
- [x] Flowering and slow moss spread
- [x] Resource production at maturity
- [x] Plant inspection panel: species, stage, suitability, actions

## 4. Resources and inventory

- [x] About 6 item types defined in data, plus the opening inventory
- [x] Production from plants, with visible items in the garden
- [x] Auto-collect and one-tap batch collect
- [x] Inventory panel
- [ ] Crafting: twigs + bark → basic natural shelter

## 5. Wildlife

- [x] Butterflies (and bees) defined in data, with attraction conditions
- [x] Arrival events when mature flowers are nearby
- [x] Autonomous behaviour: wander, feed at flowers, rest, leave
- [x] Simple sprite motion and a cap on how many creatures appear at once
- [x] Creature inspection: name, current behaviour, known facts

## 6. Habitat

- [x] Buildable natural shelter using crafted materials
- [x] Placement-dependent suitability score
- [x] Wildlife visits linked to that score
- [x] One upgrade stage (basic → improved) with a visual change

## 7. Progression and guidance

- [ ] Milestone system: conditions → unlocks
- [ ] Chapter 1 sequence: plant flowers → first growth → collect → first butterfly → build shelter → first habitat milestone
- [ ] Up to 3 optional suggestions at a time, reacting to garden state
- [ ] Bamboo-grove unlock: end-of-level moment revealing the (not yet playable) area

## 8. Journal (minimal)

- [ ] Plants, wildlife, habitats and materials sections
- [ ] Entries recorded on discovery
- [ ] Known vs unknown facts revealed through repeat encounters

## 9. Saving and returning

- [ ] Versioned save format with migrations
- [ ] `SaveStore` interface with an IndexedDB adapter
- [ ] Autosave on change and when the page is hidden or backgrounded
- [ ] Offline catch-up: simulate time away, capped at 8 hours
- [ ] Return recap: growth, resources, visitors, journal additions, opportunities
- [ ] Persistent storage request, plus save export/import as a safety net

## 10. Interface shell

- [ ] Main HUD: area title, build categories (Plants / Habitats / Restore), Inventory, Journal, Suggestions
- [ ] Build menu, inspection panels, toasts for small discoveries
- [ ] Settings: reset garden, export/import save; audio toggles as placeholders
- [ ] Mobile-first layout: one-handed reach, large tap targets, safe areas

## 11. Quality and delivery

- [ ] Vitest coverage of growth, production, suitability, attraction, crafting, milestones, offline caps and save migrations
- [ ] Playwright flow: first session from planting through the shelter milestone
- [ ] Playwright flow: save, reload and continue
- [ ] Playwright flow: simulated return visit after time away
- [ ] Playwright: desktop and mobile layouts
- [ ] Placeholder art drawn in code behind a sprite manifest, ready for real art
- [ ] Every push to `main` deployed to GitHub Pages for play-testing and balancing on a phone

## Out of scope for the MVP

- Bamboo grove gameplay
- Pond ecology, frogs and population growth
- Branching habitat upgrades
- Rare discoveries
- Weather and seasons
- Audio
- Final watercolour art
- Capacitor iPhone port
