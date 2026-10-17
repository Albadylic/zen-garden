# Art assets

Source: **Forgotten Garden — Level 1 MVP Asset Pack**, supplied by the project owner (added 2026-10-17). Licence and author are not yet recorded; see `docs/open-items.md` section 6.

Files here are copied into the build as-is and served from `assets/…` relative to the page.

- `sprites/` — 56 PNGs with transparent backgrounds, @1x only. Ground tiles and placement overlays are 128×64 isometric diamonds; other sprites range from 32×32 to 256×256. The pack describes them as having "custom ground anchors", but no anchor data was included, so anchors are assumed to be bottom-centre until a manifest records otherwise.
- `icons/` — 15 SVG UI and inventory icons on a 64×64 viewBox.

Known quirks in the pack as delivered:

- `fx_growth_sparkle.png` and `fx_planting_sparkle.png` are byte-identical.
- Japanese maple saplings appear twice, as `plant_japanese_maple_sapling_0{1,2}.png` and `tree_japanese_maple_sapling_0{1,2}.png`, with slightly different art.
- No spritesheets/atlases or @2x/@3x variants yet (the target format in `docs/open-items.md` section 3).
