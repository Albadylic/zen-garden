# Zen Garden — guidance for Claude

## Source of truth

When unsure about what to build, how something should behave, or what comes next, read the design docs before deciding:

- `docs/game-design-document.md` — the game's vision, systems and design principles. Sections 3 (design principles), 17.3 (no-punishment policy) and 24 (confirmed vs proposed) are the quickest checks for whether an idea fits.
- `docs/forgotten_garden_first_batch.md` — the first content batch: twelve connected gardens on a 3 × 4 world map, and what each garden introduces. Where it differs from the design document, it is the more recent plan.
- `docs/phase-2-plan.md` — the current phase: the Chapter 1 snag list, then Chapter 2 (The Bamboo Grove). Tick items in the same commit that completes them.
- `docs/mvp-plan.md` — the completed checklist for the MVP (Chapter 1).
- `docs/open-items.md` — owner actions, open design decisions and every placeholder in use. When you add a placeholder or a decision gets made, update this file in the same commit.
- `docs/build-order.md` — the order to build the game in. Work phase by phase, keep the game playable after each phase, and finish the vertical slice before widening content.

The design doc separates **confirmed** decisions from **proposals** (section 24). Treat species lists, quantities, chapter details and recipes as proposals: fine to implement as starting content, but keep them in data so they are easy to change, and check with the user before treating a proposal as final.

## Wildlife rule

No predation is ever shown. Animals never kill, eat or remove one another, and no creature disappears because of another. Food relationships only decide which species are attracted; every departure is an ordinary visit ending. Journal text must not describe one animal hunting or eating another.

## Architecture rule

Game state and simulation (`src/core`) stay independent of React, PixiJS and platform APIs. React shows and controls the game, PixiJS renders the garden, the simulation updates the world, and the save layer persists state. This is enforced by `tsconfig.core.json` (no DOM types) and lint rules in `.oxlintrc.json`. The web build comes first; a Capacitor iPhone port follows later, so keep platform-specific code behind interfaces.

## Workflow

- Run `npm run check` (lint, format, typecheck, unit tests) and `npm run test:e2e` before pushing.
- Content (plants, wildlife, resources, habitats, recipes, milestones) is data-driven JSON, not hard-coded.
- Each garden is its own map in `src/content/data/gardens/`, placed in the world by `src/content/data/world.json`, which also holds the gates between gardens. Positions are world tiles; the Forgotten Garden sits at the origin.
- Snags reported by the owner wait in `docs/snag-list.md` until their turn comes.
