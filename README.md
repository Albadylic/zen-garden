# Zen Garden

An isometric garden-restoration game for the web, built with TypeScript, React,
PixiJS and Vite. It will later be packaged for iPhone with Capacitor.

## Design docs

- [Game design document](docs/game-design-document.md): vision, systems and design principles
- [Build order](docs/build-order.md): the phased plan the project follows
- [Phase 2 plan](docs/phase-2-plan.md): Chapter 1 snag list, then the Bamboo Grove
- [MVP plan](docs/mvp-plan.md): checklist for the first playable level
- [Open items](docs/open-items.md): owner actions, pending decisions and placeholders

## Getting started

Requires Node 22+.

```sh
npm install
npm run dev
```

## Scripts

| Script             | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start the Vite dev server                        |
| `npm run build`    | Typecheck and build to `dist/`                   |
| `npm run preview`  | Serve the production build locally               |
| `npm run check`    | Lint, format check, typecheck and unit tests     |
| `npm test`         | Run Vitest unit tests                            |
| `npm run test:e2e` | Run Playwright tests (desktop + mobile viewport) |
| `npm run format`   | Format all files with Prettier                   |

## Architecture

Game state and simulation are independent of React, PixiJS and platform APIs.

```
src/
  core/         Simulation: state, time, plants, wildlife, resources, progression (pure TS)
  content/      JSON content definitions (planned)
  render/       PixiJS garden rendering
  ui/           React interface
  persistence/  Save storage behind an interface; IndexedDB first, Capacitor later (planned)
```

`src/core` is guarded twice: it is type-checked without DOM types
(`tsconfig.core.json`), and the linter rejects imports of React, PixiJS,
Capacitor or other layers from it.

## Deployment

Every push to `main` is deployed to GitHub Pages by
`.github/workflows/deploy.yml`. The build uses a relative base path, so it also
works on any other static host.
