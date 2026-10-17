import { expect, type Page, test } from '@playwright/test'
import { openGarden, openTab } from './helpers'

async function expectWithinViewport(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('every panel fits on screen with the tool bar still reachable', async ({ page }) => {
  await openGarden(page)
  const bar = page.getByRole('navigation', { name: 'Garden tools' })
  for (const [tab, panel] of [
    ['Plants', 'plants-panel'],
    ['Build', 'build-panel'],
    ['Inventory', 'inventory-panel'],
    ['Journal', 'journal-panel'],
  ] as const) {
    await openTab(page, tab)
    await expect(page.getByTestId(panel)).toBeVisible()
    await expectWithinViewport(page, panel)
    await expect(bar).toBeInViewport()
    await expectNoHorizontalScroll(page)
  }
  await page.getByRole('button', { name: 'Settings' }).click()
  await expectWithinViewport(page, 'settings-panel')
  await page.getByRole('button', { name: /chapter goals/ }).click()
  await expectWithinViewport(page, 'goals-panel')
  await expect(bar).toBeInViewport()
})

test('touch targets in the tool bar are large enough to tap', async ({ page }) => {
  await openGarden(page)
  const buttons = page.getByRole('navigation', { name: 'Garden tools' }).getByRole('button')
  for (const button of await buttons.all()) {
    const box = await button.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  }
})

test('the placement bar and its actions fit while placing', async ({ page }) => {
  await openGarden(page)
  await openTab(page, 'Build')
  await page.getByRole('button', { name: /Stepping stone/ }).click()
  await expectWithinViewport(page, 'placement-bar')
  await expect(page.getByRole('button', { name: 'Place here' })).toBeInViewport()
  await expectNoHorizontalScroll(page)
})
