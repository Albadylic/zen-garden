import { expect, test } from '@playwright/test'
import { milestone, openGarden, openTab, placeOn, play, tapAt, tapTile } from './helpers'

const MIN = 60_000

test('first session: plant, clear, gather, attract a butterfly and house the first residents', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await openGarden(page)

  // Sow wildflowers in the sunny clearing.
  await openTab(page, 'Plants')
  await page.getByRole('button', { name: /Wildflowers/ }).click()
  await expect(page.getByTestId('placement-bar')).toBeVisible()
  for (const [x, y] of [
    [6, 9],
    [6, 8],
    [5, 9],
  ] as const) {
    await placeOn(page, x, y)
  }
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect.poll(() => milestone(page, 'first-planting')).toBe(true)
  expect(
    await page.evaluate(() => window.__zen!.controller.state.inventory['wildflower-seeds'] ?? 0),
  ).toBe(1)

  // Clear overgrowth with the Restore tool.
  await openTab(page, 'Restore')
  await expect(page.getByTestId('clear-bar')).toBeVisible()
  for (const [x, y] of [
    [3, 10],
    [3, 11],
    [4, 11],
    [1, 13],
  ] as const) {
    await tapTile(page, x, y)
  }
  await expect(page.getByTestId('clear-bar')).toContainText('16 left to clear')
  await page.getByRole('button', { name: 'Done' }).click()

  // Let the flowers bloom; materials from the old pines are gathered along the way.
  await play(page, 8 * MIN)
  await expect.poll(() => milestone(page, 'clearing-the-way')).toBe(true)
  await expect.poll(() => milestone(page, 'first-visitor')).toBe(true)

  // Tap a butterfly while it feeds (so it stays put) to inspect it.
  await expect
    .poll(
      async () => {
        await play(page, 5000)
        return page.evaluate(() => {
          const c = window.__zen!.controller.state.creatures.find(
            (c) => c.speciesId === 'small-white' && c.activity === 'feeding',
          )
          if (!c) return false
          window.__zen!.focusTile(Math.floor(c.x), Math.floor(c.y))
          return true
        })
      },
      { timeout: 20_000 },
    )
    .toBe(true)
  await page.waitForTimeout(300)
  const point = await page.evaluate(() => {
    const c = window.__zen!.controller.state.creatures.find(
      (c) => c.speciesId === 'small-white' && c.activity === 'feeding',
    )
    return c ? window.__zen!.creatureToScreen(c.id) : null
  })
  const box = await page.locator('canvas').boundingBox()
  expect(point && box).toBeTruthy()
  await tapAt(page, box!.x + point!.x, box!.y + point!.y)
  await expect(page.getByTestId('inspect-panel')).toContainText('Small white butterfly')
  await page.getByRole('button', { name: 'Close Small white butterfly' }).click()

  // Wait until a shelter is affordable, then build it in the shade of the old pines.
  await expect
    .poll(
      async () => {
        await play(page, MIN)
        return page.evaluate(() =>
          window.__zen!.controller.canAfford({ twigs: 6, bark: 2, 'leaf-litter': 2 }),
        )
      },
      { timeout: 30_000 },
    )
    .toBe(true)
  await openTab(page, 'Build')
  await page.getByRole('button', { name: /Natural shelter/ }).click()
  await placeOn(page, 3, 4)
  await expect.poll(() => milestone(page, 'a-place-to-shelter')).toBe(true)

  // Residents move in over the next few minutes.
  await expect
    .poll(
      async () => {
        await play(page, MIN)
        return milestone(page, 'first-residents')
      },
      { timeout: 30_000 },
    )
    .toBe(true)

  // The goals panel shows the progress made.
  await page.getByRole('button', { name: /chapter goals/ }).click()
  await expect(page.getByTestId('goals-panel')).toContainText(
    /Restoration: [7-8] of 8 milestones|Chapter complete/,
  )
})
