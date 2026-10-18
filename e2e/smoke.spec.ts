import { expect, test } from '@playwright/test'

test('loads the garden canvas with the HUD overlay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('./')

  await expect(page).toHaveTitle('Satoyama')
  // A new garden opens with a welcome; dismissing it reveals the HUD.
  await expect(page.getByTestId('welcome')).toBeVisible()
  await page.getByRole('button', { name: 'Step into the garden' }).click()
  await expect(page.getByTestId('welcome')).toBeHidden()
  // Restore opens at the chapter's goals.
  await expect(page.getByTestId('chapter-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The Forgotten Garden' })).toBeVisible()

  const canvas = page.locator('canvas[data-testid="garden-canvas"]')
  await expect(canvas).toHaveCount(1)
  const box = await canvas.boundingBox()
  const viewport = page.viewportSize()!
  // High-DPR devices can round the canvas to a fraction of a CSS pixel.
  expect(Math.abs(box!.width - viewport.width)).toBeLessThan(1)
  expect(Math.abs(box!.height - viewport.height)).toBeLessThan(1)

  expect(errors).toEqual([])
})
