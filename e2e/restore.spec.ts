import { expect, test } from '@playwright/test'
import { openGarden, openRestorePage, openTab } from './helpers'

test('Restore pages through the chapter goals and every approach, several under way at once', async ({
  page,
}) => {
  await openGarden(page)
  // Open the grove and the pond, so two projects are on offer.
  await page.evaluate(() =>
    window.__zen!.controller.state.unlocks.push('area:bamboo-grove', 'chapter:bamboo-grove'),
  )
  await openTab(page, 'Restore')
  const panel = page.getByTestId('restore-panel')
  // The first page is the chapter's goals, with the current hint.
  await expect(panel.getByTestId('chapter-page')).toBeVisible()
  await expect(panel.getByTestId('current-hint')).not.toBeEmpty()
  // Then one page per approach: three for the grove and three for the pond.
  await expect(panel.getByTestId('project-page')).toHaveText('1 of 7')

  // The current chapter's garden comes first: the pond, with its emblem.
  await panel.getByRole('button', { name: 'Next page' }).click()
  await expect(panel.getByTestId('project-garden')).toContainText('Living Waters')
  await expect(panel.locator('[data-motif="water"]')).toBeVisible()

  // Begin two of the pond's approaches; both stay under way.
  await openRestorePage(page, 'A lily pond')
  await panel.getByRole('button', { name: 'Begin this' }).click()
  await expect(panel.getByTestId('current-stage')).toBeVisible()
  await openRestorePage(page, 'A reed margin')
  await panel.getByRole('button', { name: 'Begin this' }).click()
  await expect(panel.getByTestId('current-stage')).toBeVisible()
  await openRestorePage(page, 'A lily pond')
  await expect(panel.getByTestId('current-stage')).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        (
          window.__zen!.controller.state as unknown as {
            projects: Record<string, { active: string[] }>
          }
        ).projects['restore-pond']!.active,
    ),
  ).toEqual(['lily-pond', 'reed-margin'])

  // The grove's approaches are pages too, with the grove's emblem.
  await openRestorePage(page, 'A shaded planting corner')
  await expect(panel.getByTestId('project-garden')).toContainText('Bamboo Grove')
  await expect(panel.locator('[data-motif="bamboo"]')).toBeVisible()
})

test('clearing overgrowth leaves Restore once every tangle is cleared', async ({ page }) => {
  await openGarden(page)
  await page.evaluate(() => {
    const { state } = window.__zen!.controller
    for (const g of Object.values(state.gardens))
      g.terrain = g.terrain.map((t) => (t === 'overgrown' ? 'grass' : t))
  })
  await openTab(page, 'Restore')
  await expect(page.getByTestId('restore-panel')).toBeVisible()
  await expect(page.getByTestId('clear-overgrowth')).toHaveCount(0)
})
