import { expect, test } from '@playwright/test'
import { openGarden, openTab, placeOn } from './helpers'

test('saves the garden and continues it after a reload', async ({ page }) => {
  await openGarden(page)
  await openTab(page, 'Plants')
  await page.getByRole('button', { name: /Wildflowers/ }).click()
  await placeOn(page, 6, 9)
  await page.getByRole('button', { name: 'Cancel' }).click()
  const before = await page.evaluate(() => ({
    seeds: window.__zen!.controller.state.inventory['wildflower-seeds'],
    plants: window
      .__zen!.controller.state.entities.filter((e) => !e.fixed)
      .map((e) => `${e.defId}@${e.x},${e.y}`),
  }))
  expect(before.plants).toEqual(['wildflower-mix@6,9'])

  // Autosave runs a few seconds after a change.
  await page.waitForTimeout(6000)
  await page.reload()
  await page.waitForFunction(() => window.__zen?.tileToScreen(0, 0) !== null)

  // A returning garden skips the welcome and keeps everything.
  await expect(page.getByTestId('welcome')).toBeHidden()
  const after = await page.evaluate(() => ({
    seeds: window.__zen!.controller.state.inventory['wildflower-seeds'],
    plants: window
      .__zen!.controller.state.entities.filter((e) => !e.fixed)
      .map((e) => `${e.defId}@${e.x},${e.y}`),
  }))
  expect(after).toEqual(before)
})

test('starting a new garden from Settings clears the old one', async ({ page }) => {
  await openGarden(page)
  await openTab(page, 'Plants')
  await page.getByRole('button', { name: /Wildflowers/ }).click()
  await placeOn(page, 6, 9)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Start a new garden' }).click()
  await page.getByRole('button', { name: 'Yes, start a new garden' }).click()
  await expect(page.getByTestId('welcome')).toBeVisible()
  await page.getByRole('button', { name: 'Step into the garden' }).click()
  await page.reload()
  await page.waitForFunction(() => window.__zen?.tileToScreen(0, 0) !== null)
  expect(
    await page.evaluate(
      () => window.__zen!.controller.state.entities.filter((e) => !e.fixed).length,
    ),
  ).toBe(0)
})
