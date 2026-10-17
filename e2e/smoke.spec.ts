import { expect, test } from '@playwright/test'

test('loads the garden with its sprites and the HUD overlay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    // Missing sprites only warn in the game, but the shipped art should be complete.
    if (msg.type() === 'error' || msg.text().startsWith('Sprite ')) errors.push(msg.text())
  })

  await page.goto('./')

  await expect(page).toHaveTitle('Zen Garden')
  await expect(page.getByTestId('hud')).toContainText('Zen Garden')

  const canvas = page.locator('canvas[data-testid="garden-canvas"]')
  await expect(canvas).toHaveCount(1)
  const box = await canvas.boundingBox()
  const viewport = page.viewportSize()!
  // High-DPR devices can round the canvas to a fraction of a CSS pixel.
  expect(Math.abs(box!.width - viewport.width)).toBeLessThan(1)
  expect(Math.abs(box!.height - viewport.height)).toBeLessThan(1)

  await expect(canvas).toHaveAttribute('data-ready', 'true')
  expect(errors).toEqual([])
})
