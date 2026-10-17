import { expect, test } from '@playwright/test'
import { milestone, openGarden, openTab, play, tapTile } from './helpers'

/** Skips to the end of Chapter 1: milestones done, the grove open, an improved shelter with residents. */
async function finishChapterOne(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const c = window.__zen!.controller as unknown as {
      content: { chapters: { milestones: { id: string }[]; completionUnlock: string }[] }
      state: {
        milestones: Record<string, number>
        unlocks: string[]
        inventory: Record<string, number>
      }
      startPlacing(source: unknown): void
      ui: { get(): { mode: object }; set(patch: object): void }
      confirmPlacement(): void
      cancelMode(): void
      dismissCelebration(): void
    }
    for (const m of c.content.chapters[0]!.milestones) c.state.milestones[m.id] = 0
    c.state.unlocks.push('recipe:natural-shelter', 'upgrade:natural-shelter')
    Object.assign(c.state.inventory, { twigs: 20, bark: 10, 'leaf-litter': 10, stones: 10 })
  })
  await play(page, 2000)
  await page.getByRole('button', { name: 'Keep tending the garden' }).click()
}

test('the grove opens, an approach is chosen, and a stage is completed', async ({ page }) => {
  test.setTimeout(90_000)
  await openGarden(page)
  await finishChapterOne(page)
  await expect(page.getByRole('heading', { name: /The Bamboo Grove/ })).toBeVisible()

  // Look around the grove.
  await tapTile(page, 20, 5)
  await expect.poll(() => milestone(page, 'into-the-grove')).toBe(true)
  await page.keyboard.press('Escape')

  // Choose the shaded corner in Restore.
  await openTab(page, 'Restore')
  await page
    .getByTestId('approach-shaded-corner')
    .getByRole('button', { name: 'Begin this' })
    .click()
  await expect(page.getByTestId('current-stage')).toContainText('Clear the understory')

  // Clear four overgrown patches in the grove, then complete the stage.
  await page.getByRole('button', { name: 'Start clearing' }).click()
  for (const [x, y] of [
    [17, 1],
    [18, 1],
    [18, 2],
    [16, 3],
  ] as const) {
    await tapTile(page, x, y)
  }
  await page.getByRole('button', { name: 'Done' }).click()
  await openTab(page, 'Restore')
  const complete = page.getByTestId('current-stage').getByRole('button', { name: 'Complete stage' })
  await expect(complete).toBeEnabled()
  await complete.click()
  await expect(page.getByTestId('current-stage')).toContainText('Plant the shade')
})

test('an improved shelter can branch into an insect hotel', async ({ page }) => {
  await openGarden(page)
  await finishChapterOne(page)
  await page.evaluate(() => {
    const c = window.__zen!.controller as unknown as {
      state: {
        unlocks: string[]
        inventory: Record<string, number>
        entities: { kind: string; level: number; visits: number }[]
      }
      startPlacing(source: unknown): void
      ui: { get(): { mode: object }; set(patch: object): void }
      confirmPlacement(): void
      cancelMode(): void
    }
    c.state.unlocks.push('branch:natural-shelter')
    Object.assign(c.state.inventory, { 'bamboo-canes': 10 })
    c.startPlacing({ kind: 'recipe', recipeId: 'natural-shelter' })
    c.ui.set({ mode: { ...c.ui.get().mode, tile: { x: 2, y: 4 } } })
    c.confirmPlacement()
    c.cancelMode()
    const shelter = c.state.entities.find((e) => e.kind === 'structure')!
    shelter.level = 5
    shelter.visits = 1
  })
  await tapTile(page, 2, 4)
  const panel = page.getByTestId('inspect-panel')
  await expect(panel).toContainText('Choose a direction')
  await panel
    .getByTestId('upgrade-insect-hotel')
    .getByRole('button', { name: 'Choose this' })
    .click()
  await expect(panel).toContainText('Insect hotel')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window.__zen!.controller.state as unknown as {
              stats: { branched: Record<string, number> }
            }
          ).stats.branched['insect-hotel'],
      ),
    )
    .toBe(1)
})
