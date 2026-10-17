# Zen Garden — guidance for Claude

## Source of truth

When unsure about what to build, how something should behave, or what comes next, read the design docs before deciding:

- `docs/game-design-document.md` — the game's vision, systems and design principles. Sections 3 (design principles), 17.3 (no-punishment policy) and 24 (confirmed vs proposed) are the quickest checks for whether an idea fits.
- `docs/mvp-plan.md` — the checklist for the MVP (one playable level). Tick items in the same commit that completes them.
- `docs/open-items.md` — owner actions, open design decisions and every placeholder in use. When you add a placeholder or a decision gets made, update this file in the same commit.
- `docs/build-order.md` — the order to build the game in. Work phase by phase, keep the game playable after each phase, and finish the vertical slice before widening content.

The design doc separates **confirmed** decisions from **proposals** (section 24). Treat species lists, quantities, chapter details and recipes as proposals: fine to implement as starting content, but keep them in data so they are easy to change, and check with the user before treating a proposal as final.

## Architecture rule

Game state and simulation (`src/core`) stay independent of React, PixiJS and platform APIs. React shows and controls the game, PixiJS renders the garden, the simulation updates the world, and the save layer persists state. This is enforced by `tsconfig.core.json` (no DOM types) and lint rules in `.oxlintrc.json`. The web build comes first; a Capacitor iPhone port follows later, so keep platform-specific code behind interfaces.

## Workflow

- Run `npm run check` (lint, format, typecheck, unit tests) and `npm run test:e2e` before pushing.
- Content (plants, wildlife, resources, habitats, recipes, milestones) is data-driven JSON, not hard-coded.
