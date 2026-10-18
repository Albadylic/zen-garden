import { expect, test } from '@playwright/test'
import { milestone, openGarden, openGoals, openTab, placeOn, play, tapTile } from './helpers'

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

  // Butterflies are not tap targets: tapping the flower one is feeding on
  // lists it as a visitor, with a book that opens its journal page.
  let flower: { x: number; y: number } | null = null
  await expect
    .poll(
      async () => {
        await play(page, 5000)
        flower = await page.evaluate(() => {
          const { state } = window.__zen!.controller
          const c = state.creatures.find(
            (c) => c.speciesId === 'small-white' && c.activity === 'feeding',
          )
          const target = c && state.entities.find((e) => e.id === c.targetId)
          return target ? { x: target.x, y: target.y } : null
        })
        return flower !== null
      },
      { timeout: 20_000 },
    )
    .toBe(true)
  await page.evaluate(({ x, y }) => window.__zen!.focusTile(x, y), flower!)
  await page.waitForTimeout(300)
  await tapTile(page, flower!.x, flower!.y)
  await expect(page.getByTestId('visitor-small-white').first()).toContainText(
    'Small white butterfly',
  )

  // Nothing pops up about the journal; a badge on its book invites a visit instead.
  await expect(page.getByTestId('journal-badge')).toBeVisible()
  // The visitor's book button opens the journal at its own page, marked as new.
  await page.getByRole('button', { name: 'Open the journal at Small white butterfly' }).click()
  await expect(page.getByTestId('journal-panel')).toBeVisible()
  await expect(page.getByTestId('journal-page')).toContainText('Small white butterfly')
  await expect(page.getByTestId('journal-page')).toContainText('New')
  // Its section's contents list it too, now read, and open its page again.
  await page.getByRole('tab', { name: /Wildlife/ }).click()
  await expect(page.getByTestId('journal-wildlife:small-white')).not.toContainText('New')
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
  await openGoals(page)
  await expect(page.getByTestId('goals-panel')).toContainText(
    /Restoration: [7-8] of 8 milestones|Chapter complete/,
  )
})
