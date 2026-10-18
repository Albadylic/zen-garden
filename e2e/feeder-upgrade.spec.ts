import { expect, test } from '@playwright/test'
import { openGarden } from './helpers'

test('a leaf-litter bed can be filled and improved from its panel', async ({ page }) => {
  await openGarden(page)
  await page.evaluate(() => {
    const c = window.__zen!.controller as unknown as {
      state: {
        nextId: number
        entities: object[]
        unlocks: string[]
        inventory: Record<string, number>
      }
      select(s: object): void
    }
    const id = c.state.nextId++
    c.state.entities.push({
      id,
      kind: 'structure',
      defId: 'leaf-litter-bed',
      x: 3,
      y: 4,
      level: 0,
      visits: 2,
      produceMs: [0],
      fixed: false,
    })
    c.state.unlocks.push('upgrade:leaf-litter-bed')
    Object.assign(c.state.inventory, { deadwood: 3, 'leaf-mould': 2, 'leaf-litter': 1 })
    c.select({ kind: 'entity', id })
  })
  const panel = page.getByTestId('inspect-panel')
  await expect(panel.getByRole('button', { name: 'Fill' })).toBeVisible()
  const improve = panel.getByRole('button', { name: 'Improve' })
  await expect(improve).toBeEnabled()
  await expect(panel).toContainText('Deep leaf bed')
  await improve.click()
  expect(
    await page.evaluate(() =>
      (window.__zen!.controller.state.entities as unknown as { defId: string; level: number }[])
        .filter((e) => e.defId === 'leaf-litter-bed')
        .map((e) => e.level),
    ),
  ).toEqual([1])
})
