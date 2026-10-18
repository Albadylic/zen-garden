import { expect, test } from '@playwright/test'
import { openGarden, tapTile } from './helpers'

test('tapping an empty tile offers what can be planted or built there', async ({ page }) => {
  await openGarden(page)
  // Open grass in the sunny clearing.
  await tapTile(page, 6, 9)
  const options = page.getByTestId('tile-options')
  await expect(options).toContainText('Plant here')
  await expect(options).toContainText('Build here')
  await options.getByRole('button', { name: /Wildflowers/ }).click()
  // The tile now holds the new planting, and its panel shows it.
  await expect(page.getByTestId('inspect-panel')).toContainText('Wildflowers')
  expect(
    await page.evaluate(() =>
      window.__zen!.controller.state.entities.some(
        (e) => e.defId === 'wildflower-mix' && e.x === 6 && e.y === 9,
      ),
    ),
  ).toBe(true)
})

test('an overgrown tile offers only clearing', async ({ page }) => {
  await openGarden(page)
  await tapTile(page, 7, 3)
  await expect(page.getByTestId('inspect-panel')).toContainText('Overgrowth')
  await expect(page.getByTestId('tile-options')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear', exact: true })).toBeVisible()
})
