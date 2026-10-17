# Snag List — After the Twelve Gardens

Owner feedback from playtesting, to come back to once all twelve gardens of the first batch are built (see [`chapter-build-guide.md`](chapter-build-guide.md)). Tick items as they land.

## Balance

- [x] **Too few wildflower seeds.** Since the A2 fix (slower seeds, pausing at 12 held), seeds have dried up and the game feels stale. Find a balance between the earlier flood (about 60 by the end of Chapter 1) and now.
  - Done: the first seed came 11–15 minutes in, so the opening felt dry. Now the player starts with 6 seeds, wildflowers seed every 4 minutes (was 5), and clearing overgrowth turns up a seed about one time in four. A player who sows every seed holds about 20 by minute 20, against about 7 before. The cap of 12 held still applies, and now covers seeds found while clearing too.

## Interactions

- [x] **Watering is one plant at a time.** Make watering less tedious, for example watering a small area, or every plant in reach, with one action.
  - Done: watering a plant also waters every growing plant within two tiles of it (a 5 × 5 patch) in the same garden. The button says how many it will reach ("Water 4 plants"), and a short message confirms it. A plant that is already wet still lets the player water the dry ones around it.
- [x] **Clearing is hard to discover.** It is not obvious that Restore lets the player clear overgrowth continuously. Make the clearing mode easier to find and to stay in.
  - Done: clearing one tangle from its own panel now carries straight on into clearing mode, with the remaining tangles highlighted and the bar saying to keep tapping them; Done ends it. The Restore panel, the tile panel and the hint all say that one tangle can follow another.

## Interface

- [x] **Icons in the bottom bar** instead of text labels. Review the art assets on the pull request, decide which can be used, and list what is missing. Do the UI overhaul **on a branch**, so it can be compared with the current interface.
  - Done on the branch `ui/icons-and-journal`, for comparison: see [`ui-overhaul.md`](ui-overhaul.md) for the asset review, what is used and what is missing.
- [x] **The journal as its own side panel.** Tapping a book icon opens a sidebar where the player flicks through the journal's pages.
  - Done on the branch `ui/icons-and-journal`: a book icon in the HUD opens the journal as a sidebar, with bookmarks, a contents page per section and one page per discovered entry, turned with arrows, a swipe or the arrow keys.
- [x] **Hide what cannot be used yet.** Do not list plants (and other things) the player cannot get yet; it is frustrating.
  - Done: the Plants panel lists a species only once the player holds or has found its seed (or has planted it), and keeps it listed after the last seed is sown. The Build panel lists only recipes the player has discovered. Both end with a line saying more will appear. Inventory and Make already showed only what the player has or can make.

## Design questions

- [x] **Are plants specific to each garden, or usable anywhere?** Decide, and with it what each new garden brings beyond extra space (its own plants, wildlife, materials, terrain, mechanics, projects).
  - Proposed answer (owner to confirm; recorded in `open-items.md`): usable anywhere their ground allows, which is how the game already works. Seeds are shared across gardens. What a new garden brings is its ground, the native plants whose seeds turn up there first, its own wildlife community, materials, decorations, a new mechanic and its project. Hiding plants until their seed is found (above) makes each garden's newcomers feel like its own.
- [x] **What are rocks for?** Are stones only decoration? Should paths and stepping stones help animals move around the garden?
  - Done (a proposal, kept in data): stones and logs are now refuges. Ground creatures living in a shelter within 3 tiles come out to bask and shelter by them ("Basking and sheltering by the old boulder"), and stay a quarter longer. Paths and stepping stones joined to a shelter's foraging ground let its residents forage up to 5 tiles from home instead of 2, so they visibly wander along them. The inspect panel says what each stone, log or path does. Stones also still give cover and perches, and some species need them (jumping spiders and rock piles, wagtails and stepping stones, stag beetles and logs).
  - Found along the way: seasonal species (brimstone, seven-spot ladybird, bullfinch) were arriving long before the seasons began, and ladybirds were filling shelter places in the first garden. They now wait for Chapter 11.
