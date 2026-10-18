import { expect, test } from '@playwright/test'
import { openGarden, openTab } from './helpers'

test('panels are split into categories, and new things are marked and listed first', async ({
  page,
}) => {
  await openGarden(page)
  const panel = page.getByTestId('plants-panel')

  // Plants: one chip per group with something in it, and All.
  await openTab(page, 'Plants')
  await expect(panel.getByTestId('chip-all')).toBeVisible()
  await expect(panel.getByTestId('chip-new')).toHaveCount(0)
  await panel.getByTestId('chip-groundcover').click()
  await expect(panel).toContainText('Garden moss')
  await expect(panel).not.toContainText('Wildflowers')
  await panel.getByTestId('chip-flowers').click()
  await expect(panel).toContainText('Wildflowers')
  await page.getByRole('button', { name: 'Close Plants' }).click()

  // Something new turns up: a badge on the tool, and the panel opens on New.
  await page.evaluate(() => {
    const { state } = window.__zen!.controller
    state.inventory['bamboo-shoots'] = 2
    state.unlocks.push('recipe:natural-shelter')
  })
  await expect(page.getByTestId('new-plants')).toHaveText('1')
  await expect(page.getByTestId('new-build')).toHaveText('1')
  await openTab(page, 'Plants')
  await expect(panel.getByTestId('chip-new')).toHaveAttribute('aria-selected', 'true')
  await expect(panel.locator('.choice-list')).toContainText('Bamboo')
  await expect(panel.locator('.choice-list')).toContainText('New')
  await expect(panel.locator('.choice-list')).not.toContainText('Wildflowers')
  // Closing the panel marks it seen: the badge goes, and New with it.
  await page.getByRole('button', { name: 'Close Plants' }).click()
  await expect(page.getByTestId('new-plants')).toHaveCount(0)
  await openTab(page, 'Plants')
  await expect(panel.getByTestId('chip-new')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close Plants' }).click()

  // Build groups its recipes too, with the new shelter under Habitats.
  await openTab(page, 'Build')
  const build = page.getByTestId('build-panel')
  await expect(build.getByTestId('chip-new')).toBeVisible()
  await build.getByTestId('chip-paths').click()
  await expect(build).toContainText('Stepping stone')
  await expect(build).not.toContainText('Natural shelter')
  await build.getByTestId('chip-habitats').click()
  await expect(build).toContainText('Natural shelter')
})
