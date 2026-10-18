import { expect, type Page, test } from '@playwright/test'
import { openGarden, openGoals, openTab } from './helpers'

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
  ] as const) {
    await openTab(page, tab)
    await expect(page.getByTestId(panel)).toBeVisible()
    await expectWithinViewport(page, panel)
    await expect(bar).toBeInViewport()
    await expectNoHorizontalScroll(page)
  }
  await page.getByRole('button', { name: 'Settings' }).click()
  await expectWithinViewport(page, 'settings-panel')
  await openGoals(page)
  await expectWithinViewport(page, 'goals-panel')
  await expect(bar).toBeInViewport()
})

test('the journal opens as a book beside the garden and turns its pages', async ({ page }) => {
  await openGarden(page)
  // Three plants already discovered and read, so there are pages to turn.
  await page.evaluate(() => {
    const { state } = window.__zen!.controller
    for (const id of ['wildflower-mix', 'garden-moss', 'fern'])
      state.journal[`plant:${id}`] = { discoveredAtMs: 0, encounters: 1, read: 0 }
  })
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-panel')).toBeVisible()
  // Let the book finish sliding in before measuring it.
  await page
    .getByTestId('journal-panel')
    .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))
  await expectWithinViewport(page, 'journal-panel')
  await expectNoHorizontalScroll(page)
  const number = page.getByTestId('journal-page-number')
  await page.getByRole('tab', { name: /Plants/ }).click()
  await expect(number).toHaveText('Contents')
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(number).toHaveText(/^1 of \d+$/)
  // A swipe to the left turns to the next page, and one to the right turns back.
  const box = (await page.getByTestId('journal-page').boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.8, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 4 })
  await page.mouse.up()
  await expect(number).toHaveText(/^2 of \d+$/)
  await page.keyboard.press('ArrowLeft')
  await expect(number).toHaveText(/^1 of \d+$/)
  await page.getByRole('button', { name: 'Close Journal' }).click()
  await expect(page.getByTestId('journal-panel')).toHaveCount(0)
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

test('the top bar is one row of icons, and Goals opens a box of ideas to flick through', async ({
  page,
}) => {
  await openGarden(page)
  const nav = page.getByRole('navigation', { name: 'Garden menu' })
  for (const name of ['Goals', 'Journal', 'Gather all', 'Gardens', 'Settings'])
    await expect(nav.getByRole('button', { name, exact: true })).toBeVisible()
  // All on one row.
  const tops = await nav
    .getByRole('button')
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(1)
  // No garden name or goal text written out in the bar itself.
  await expect(nav).not.toContainText('Forgotten Garden')

  // The goals box starts open for a new garden, with the first idea.
  const box = page.getByTestId('suggestions')
  await expect(box).toBeVisible()
  await expect(box).toContainText('The Forgotten Garden')
  const first = await page.getByTestId('suggestion-text').textContent()
  await expect(page.getByTestId('suggestion-page')).toHaveText(/^1 of \d+$/)
  if ((await page.getByTestId('suggestion-page').textContent()) !== '1 of 1') {
    await box.getByRole('button', { name: 'Next idea' }).click()
    await expect(page.getByTestId('suggestion-text')).not.toHaveText(first!)
    await box.getByRole('button', { name: 'Previous idea' }).click()
    await expect(page.getByTestId('suggestion-text')).toHaveText(first!)
  }
  await expectWithinViewport(page, 'suggestions')
  // The cross closes it; the Goals icon opens it again.
  await box.getByRole('button', { name: 'Close goals' }).click()
  await expect(box).toHaveCount(0)
  await nav.getByRole('button', { name: 'Goals', exact: true }).click()
  await expect(page.getByTestId('suggestions')).toBeVisible()
})
