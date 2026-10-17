import { expect, test } from '@playwright/test'
import { openGarden, openTab, placeOn } from './helpers'

test('returning after time away shows what changed', async ({ page }) => {
  await openGarden(page)
  await openTab(page, 'Plants')
  await page.getByRole('button', { name: /Wildflowers/ }).click()
  await placeOn(page, 6, 9)
  await placeOn(page, 6, 8)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.evaluate(() => window.__zen!.save())

  // Age the save by two hours, as if the player closed the game and came back.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('zen-garden')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const tx = db.transaction('saves', 'readwrite')
    const store = tx.objectStore('saves')
    const data = await new Promise<{ savedAt: number }>((resolve) => {
      const get = store.get('main')
      get.onsuccess = () => resolve(get.result as { savedAt: number })
    })
    data.savedAt -= 2 * 60 * 60_000
    store.put(data, 'main')
    await new Promise((resolve) => (tx.oncomplete = resolve))
    db.close()
  })
  await page.reload()

  const recap = page.getByTestId('recap')
  await expect(recap).toBeVisible()
  await expect(recap).toContainText('While you were away (2 h)')
  await expect(recap).toContainText('Fully grown: Wildflowers.')
  await expect(recap).toContainText('ready to gather')

  const seedsBefore = await page.evaluate(
    () => window.__zen!.controller.state.inventory['wildflower-seeds'] ?? 0,
  )
  await page.getByRole('button', { name: 'Gather and continue' }).click()
  await expect(recap).toBeHidden()
  const after = await page.evaluate(() => ({
    seeds: window.__zen!.controller.state.inventory['wildflower-seeds'] ?? 0,
    lying: window.__zen!.controller.state.drops.length,
  }))
  expect(after.seeds).toBeGreaterThan(seedsBefore)
  expect(after.lying).toBe(0)
})

test('a very long absence is capped and loses nothing', async ({ page }) => {
  await openGarden(page)
  await page.evaluate(() => window.__zen!.away(5 * 24 * 60 * 60_000))
  const recap = page.getByTestId('recap')
  await expect(recap).toContainText('5 days')
  await expect(recap).toContainText('The garden grew for the first 8 h')
  // Simulated time is the 8-hour cap plus the few real seconds already played.
  const elapsed = await page.evaluate(() => window.__zen!.controller.state.elapsedMs)
  expect(elapsed).toBeGreaterThanOrEqual(8 * 60 * 60_000)
  expect(elapsed).toBeLessThan(8 * 60 * 60_000 + 60_000)
})
