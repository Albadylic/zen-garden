import { expect, test } from '@playwright/test'
import { openGarden, openTab } from './helpers'

test('restoration projects are pages to flick through, each with its garden', async ({ page }) => {
  await openGarden(page)
  // Open the first three projects' gardens.
  await page.evaluate(() =>
    window.__zen!.controller.state.unlocks.push(
      'area:bamboo-grove',
      'chapter:bamboo-grove',
      'chapter:living-waters',
    ),
  )
  await openTab(page, 'Restore')
  const panel = page.getByTestId('restore-panel')
  // Overgrowth is left in the first garden, so clearing comes first.
  await expect(panel.getByTestId('clear-overgrowth')).toBeVisible()
  // It opens at the project for the current chapter's garden.
  await expect(panel.getByTestId('project-page')).toHaveText('Project 3 of 3')
  await expect(panel.getByTestId('project-garden')).toContainText('Quiet Stone Garden')
  await expect(panel.locator('[data-motif="stones"]')).toBeVisible()
  await panel.getByRole('button', { name: 'Previous project' }).click()
  await expect(panel.getByTestId('project-page')).toHaveText('Project 2 of 3')
  await expect(panel.getByTestId('project-garden')).toContainText('Living Waters')
  await expect(panel.locator('[data-motif="water"]')).toBeVisible()
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
