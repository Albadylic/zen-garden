# Satoyama

_Bring back the garden._

An isometric garden-restoration game for the web, built with TypeScript, React,
PixiJS and Vite. It will later be packaged for iPhone with Capacitor. Satoyama
is the Japanese word for the gentle borderland where people and wildlife live
side by side. (The repository keeps its earlier working name, `zen-garden`, and
so do save data and storage keys, so existing gardens carry over.)

The player restores a neglected Japanese-inspired sanctuary one garden at a
time: planting, gathering natural materials, building habitats and watching
wildlife arrive. All twelve gardens of the first batch are playable, from
Chapter 1, The Forgotten Garden, to Chapter 12, the Noble Garden, whose
restoration opens a return gate to where it all began.

## Design docs

- [Game design document](docs/game-design-document.md): vision, systems and design principles
- [First content batch](docs/forgotten_garden_first_batch.md): the twelve connected gardens, their world map and what each one introduces
- [Build order](docs/build-order.md): the phased plan the project follows, with progress so far
- [Phase 2 plan](docs/phase-2-plan.md): Chapter 1 snag list, then the Bamboo Grove (complete)
- [Chapter build guide](docs/chapter-build-guide.md): how gardens 3–12 were built, and the shared scaffolding (complete)
- [Snag list](docs/snag-list.md): the owner's latest playtest notes, next in line
- [MVP plan](docs/mvp-plan.md): checklist for the first playable level (complete)
- [Open items](docs/open-items.md): owner actions, decisions and every placeholder in use

## Getting started

Requires Node 22+.

```sh
npm install
npm run dev
```

Add `?debug` to the URL for playtesting tools in Settings (faster time, a
simulated hour away), or `?seed=N` for a repeatable new garden.

## Scripts

| Script             | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Start the Vite dev server                                          |
| `npm run build`    | Typecheck and build to `dist/`                                     |
| `npm run preview`  | Serve the production build locally                                 |
| `npm run check`    | Lint, format check, typecheck and unit tests                       |
| `npm test`         | Run Vitest unit tests                                              |
| `npm run test:e2e` | Run Playwright tests (desktop and mobile; iPhone Safari too in CI) |
| `npm run format`   | Format all files with Prettier                                     |

## Architecture

Game state and simulation are independent of React, PixiJS and platform APIs.

```
src/
  core/         Simulation (pure TS): state, clock, plants, wildlife, habitats,
                resources, gardens, progression, journal, saves and migrations
  content/      Content loader and zod schemas
    data/       JSON content: plants, wildlife, items, structures, recipes,
                chapters, restoration projects, and the world
      gardens/  One map file per built garden
  render/       PixiJS garden rendering
  app/          Game controller, bootstrap, autosave and preferences
  ui/           React interface
  persistence/  Save storage behind an interface; IndexedDB first, Capacitor later
```

`src/core` is guarded twice: it is type-checked without DOM types
(`tsconfig.core.json`), and the linter rejects imports of React, PixiJS,
Capacitor or other layers from it.

### Gardens and the world

`content/data/world.json` describes the sanctuary: all twelve gardens of the
first batch, each with its number, name and slot on the world map, and the
connections between them (the main route and the return gate from the Noble
Garden to the Forgotten Garden). Each garden has a world origin and a map file in
`content/data/gardens/`. Gates are data too: a tile in
one garden's wall and the opening beside it in the next.

Positions in the game are world tiles. The Forgotten Garden sits at the origin,
and gardens to its north have negative coordinates. Saved games keep each
garden's terrain separately, so a garden added to the content later appears in
existing saves without a migration.

### Placeholder art

Most of the newer species are drawn from a `look` in their data (a form such as
`shrub`, `reed` or `dragonfly`, plus colours), by `src/render/looks.ts`. Final
art can replace any of them through the same texture keys.

### Proving the chapters

`src/test/autoplay.ts` is a patient automatic player used in tests. The
campaign test plays every chapter in order from a fresh garden, so a content
change that makes a chapter impossible to finish fails the build.

### Saves

Saves are versioned (`src/core/save.ts`), with migrations in
`src/core/migrations.ts` that bring older saves up to date one version at a
time.

## Deployment

Every push to `main` is deployed to GitHub Pages by
`.github/workflows/deploy.yml`. The build uses a relative base path, so it also
works on any other static host.
