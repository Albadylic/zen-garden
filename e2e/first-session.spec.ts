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
  ).toBe(3)

  // Clear overgrowth with the Restore tool.
  await openTab(page, 'Restore')
  await page.getByRole('button', { name: 'Start clearing' }).click()
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
  // Butterflies come in their own time; let the garden play on until one does.
  await expect
    .poll(
      async () => {
        if (await milestone(page, 'first-visitor')) return true
        await play(page, MIN)
        return false
      },
      { timeout: 30_000 },
    )
    .toBe(true)

  // Tap a butterfly while it feeds (so it stays put) to inspect it.
  await expect
    .poll(
      async () => {
        await play(page, 5000)
        return page.evaluate(() => {
          // A butterfly feeding on its own, so the tap cannot land on a bee beside it.
          const all = window.__zen!.controller.state.creatures
          const c = all.find(
            (c) =>
              c.speciesId === 'small-white' &&
              c.activity === 'feeding' &&
              all.every((o) => o === c || Math.hypot(o.x - c.x, o.y - c.y) > 1),
          )
          if (!c) return false
          window.__zen!.focusTile(Math.floor(c.x), Math.floor(c.y))
          ;(window as unknown as { __target: number }).__target = c.id
          return true
        })
      },
      { timeout: 20_000 },
    )
    .toBe(true)
  await page.waitForTimeout(300)
  const point = await page.evaluate(() =>
    window.__zen!.creatureToScreen((window as unknown as { __target: number }).__target),
  )
  const box = await page.locator('canvas').boundingBox()
  expect(point && box).toBeTruthy()
  await tapAt(page, box!.x + point!.x, box!.y + point!.y)
  await expect(page.getByTestId('inspect-panel')).toContainText('Small white butterfly')
  await page.getByRole('button', { name: 'Close Small white butterfly' }).click()

  // Nothing pops up about the journal; a badge on its book invites a visit instead.
  await expect(page.getByTestId('journal-badge')).toBeVisible()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-panel')).toBeVisible()
  // The Wildlife bookmark opens its contents, where the butterfly is marked as new.
  await page.getByRole('tab', { name: /Wildlife/ }).click()
  await expect(page.getByTestId('journal-wildlife:small-white')).toContainText('New')
  await page.getByTestId('journal-wildlife:small-white').click()
  await expect(page.getByTestId('journal-page')).toContainText('Small white butterfly')
  // Each time the book opens, it opens at the next new page; reading them all clears the badge.
  await page.getByRole('button', { name: 'Close Journal' }).click()
  for (let i = 0; i < 10 && (await page.getByTestId('journal-badge').count()) > 0; i++) {
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await page.getByRole('button', { name: 'Close Journal' }).click()
  }
  await expect(page.getByTestId('journal-badge')).toHaveCount(0)

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
