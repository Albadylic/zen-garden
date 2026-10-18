# UI overhaul (merged from `ui/icons-and-journal`)

The interface items from the [snag list](snag-list.md), built on a branch so the owner could compare them with the old interface. The owner chose them, and they are now on `main`. Screenshots from the comparison are in `screenshots/ui-overhaul/`.

## What changes

- **Icons in the bottom bar.** Plants, Build, Restore and Inventory are icons from the Level 1 asset pack. Each keeps its name as a tooltip and for screen readers. The active tool is marked with a soft green wash, because the icons keep their own colours.
- **The journal is a book in a side panel.** A book icon in the top right (with the count of new things as a badge) opens the journal as a sidebar over the right of the garden. Bookmarks along the top jump between Plants, Wildlife, Habitats and Materials.
  - Each section opens with a contents page: what has been discovered, numbered, with anything new tagged, followed by **Still to find**, the clues for undiscovered entries.
  - Every discovered entry has its own page. The player turns pages with the arrows, by swiping across the page, or with the arrow keys. The book runs on from one section into the next.
  - The book opens at the first page with something new. An entry counts as read when its page is shown, so the badge goes down page by page.
- **Item icons in the inventory** for the five items the pack draws (twigs, bark, stones, leaf litter, wildflower seeds). The rest keep their colour swatch.

## The top bar

After choosing the overhaul, the owner asked for a simpler top bar. It is now one row of round icons, right-aligned:

- **Journal** (the book): opens the journal book. Its badge counts what is new.
- **Gather all** (a basket): gathers everything lying in the open gardens. Its badge counts what is lying there.
- **Gardens** (a map): the travel panel. Its badge counts gardens opened but not yet looked around.
- **Undo** (a curved arrow): appears only while there is something to undo.
- **Settings** (sliders).

The garden's name and the current goal are no longer written in the bar.

## Goals live in Restore

Goals and Restore were two views of the same thing, so they are now one: Restore. Its pages, turned with the arrows, the dots or a swipe:

1. **The chapter's goals**: the garden's emblem, name and season, the milestones with the current hint and its progress, things along the way, ideas, and approaches finished so far.
2. **One page per approach** to every restoration project on offer, from every open garden (the current chapter's garden first): its stages, ticked off as they are done, and the next stage's progress and cost.

Several approaches can be under way at once, so the player can work on one while plants grow for another. Restore opens on a stage that is ready to complete, else an approach under way, else the chapter's goals, and its tool icon shows how many stages are ready. A new garden opens Restore at the first goal. Clearing overgrowth is a one-line strip above the pages while any is left.

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
