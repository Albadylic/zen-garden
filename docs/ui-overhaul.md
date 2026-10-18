# UI overhaul (branch `ui/icons-and-journal`)

This branch holds the interface items from the [snag list](snag-list.md), so the owner can compare it with the current interface on `main` before choosing. Nothing else differs from `main`.

## What changes

- **Icons in the bottom bar.** Plants, Build, Restore and Inventory are icons from the Level 1 asset pack. Each keeps its name as a tooltip and for screen readers. The active tool is marked with a soft green wash, because the icons keep their own colours.
- **The journal is a book in a side panel.** A book icon in the top right (with the count of new things as a badge) opens the journal as a sidebar over the right of the garden. Bookmarks along the top jump between Plants, Wildlife, Habitats and Materials.
  - Each section opens with a contents page: what has been discovered, numbered, with anything new tagged, followed by **Still to find**, the clues for undiscovered entries.
  - Every discovered entry has its own page. The player turns pages with the arrows, by swiping across the page, or with the arrow keys. The book runs on from one section into the next.
  - The book opens at the first page with something new. An entry counts as read when its page is shown, so the badge goes down page by page.
- **Item icons in the inventory** for the five items the pack draws (twigs, bark, stones, leaf litter, wildflower seeds). The rest keep their colour swatch.

## The asset pack (PR #1)

PR #1 adds 56 PNG sprites and 15 SVG icons (AI-generated with Google Gemini; the licence for commercial use still needs confirming, see `open-items.md` section 6). This branch copies in only the 12 icons it uses, into `public/assets/icons/`. The sprites belong with PR #1's renderer work, which predates the separate garden maps and would need reworking before it merges.

| Icon             | Verdict | Used for                                                                             |
| ---------------- | ------- | ------------------------------------------------------------------------------------ |
| plant_cutting    | Used    | Plants tool (reads better as "sow" than `plant`, which looks like a grass tuft)      |
| build            | Used    | Build tool                                                                           |
| restore          | Used    | Restore tool                                                                         |
| inventory        | Used    | Inventory tool                                                                       |
| journal          | Used    | Journal button in the HUD                                                            |
| close            | Used    | Closing the journal                                                                  |
| back             | Used    | Previous page, and mirrored for next page                                            |
| twigs            | Used    | Inventory                                                                            |
| bark             | Used    | Inventory                                                                            |
| stones           | Used    | Inventory                                                                            |
| leaf_litter      | Used    | Inventory                                                                            |
| wildflower_seeds | Used    | Inventory                                                                            |
| plant            | Not yet | A second plant icon; could mark grasses or ferns in Plants later                     |
| collect          | Not yet | A leaf; too close to `leaf_litter` to read as "gather". Gather all stays a text pill |
| inspect          | Not yet | Nothing in the interface is a separate inspect mode; tapping inspects                |

Contrast is fine on the light panels. The icons are too dark to use on the dark garden background without a light backing.

## Missing icons

To finish the icon set, the interface still needs:

- **HUD:** gardens (the world map), settings, undo, gather all, and chapter goals. Gardens and settings use simple line icons drawn in code for now.
- **Actions in panels:** water, move, remove, clear (overgrowth), fill (feeders), harvest, upgrade, and begin or complete a project stage.
- **Journal:** bookmark icons for Plants, Wildlife, Habitats and Materials (they are text tabs for now), and perhaps a page-corner or ribbon graphic for the book.
- **Items:** about 35 more. Every seed, spore and cutting (moss, fern, grass, maple, rush, bamboo, reed and the later gardens' seeds), and every material from Chapters 2–12 (bamboo canes, maple leaves, river stones, fallen branches, cattail fluff, fine timber, ornamental stones and so on), plus the seed bundle.
- **@2x and @3x** versions are not needed for the SVGs, but the same palette and line weight should carry through any new ones.

## Deploying the branch

While the owner compares, `.github/workflows/deploy.yml` on this branch also deploys on pushes to `ui/icons-and-journal`, so GitHub Pages shows the branch's build. Pages has one site, so the last deploy from either branch wins. Before the branch merges, take `ui/icons-and-journal` out of that list again.

The branch has `main` merged in, so apart from the interface it is the same game: tapping a tile offers what can go there, visitors are listed in panels with a book button that opens the journal book at their page, costs show have and need, and Restore pages through projects.

## To compare

Run this branch and `main` side by side (`npm run dev` on each), or check out the branch's GitHub Pages build if it is deployed. If the owner prefers it, the branch merges into `main` as it stands.
