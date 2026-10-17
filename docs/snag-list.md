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

- [ ] **Icons in the bottom bar** instead of text labels. Review the art assets on the pull request, decide which can be used, and list what is missing. Do the UI overhaul **on a branch**, so it can be compared with the current interface.
- [ ] **The journal as its own side panel.** Tapping a book icon opens a sidebar where the player flicks through the journal's pages.
- [ ] **Hide what cannot be used yet.** Do not list plants (and other things) the player cannot get yet; it is frustrating.

## Design questions

- [ ] **Are plants specific to each garden, or usable anywhere?** Decide, and with it what each new garden brings beyond extra space (its own plants, wildlife, materials, terrain, mechanics, projects).
- [ ] **What are rocks for?** Are stones only decoration? Should paths and stepping stones help animals move around the garden?
