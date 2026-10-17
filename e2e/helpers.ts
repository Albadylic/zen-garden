import { expect, type Page } from '@playwright/test'

/** The parts of the in-page test hooks (src/app/testHooks.ts) the tests use. */
interface ZenHooks {
  controller: {
    state: {
      entities: { id: number; defId: string; x: number; y: number; fixed: boolean; kind: string }[]
      inventory: Record<string, number>
      milestones: Record<string, number>
      creatures: {
        id: number
        speciesId: string
        hidden: boolean
        activity: string
        x: number
        y: number
      }[]
      drops: unknown[]
      unlocks: string[]
      elapsedMs: number
      journal: Record<string, { discoveredAtMs: number; encounters: number; read?: number }>
    }
    canAfford(cost: Record<string, number>): boolean
    ui: { get(): { selection: unknown; toasts: { text: string }[] } }
  }
  tileToScreen(x: number, y: number): { x: number; y: number } | null
  creatureToScreen(id: number): { x: number; y: number } | null
  focusTile(x: number, y: number): void
  advance(ms: number): void
  away(ms: number): void
  save(): Promise<void>
}

declare global {
  interface Window {
    __zen?: ZenHooks
  }
}

/** Opens a fresh, deterministic garden with test hooks enabled. */
export async function openGarden(page: Page, { seed = 7, fresh = true } = {}): Promise<void> {
  await page.goto(`./?test&seed=${seed}`)
  await expect(page.locator('canvas[data-testid="garden-canvas"]')).toHaveCount(1)
  await page.waitForFunction(() => window.__zen?.tileToScreen(0, 0) !== null)
  if (fresh) await page.getByRole('button', { name: 'Step into the garden' }).click()
}

/** Taps (clicks or touches) the centre of a tile, centring the camera on it first. */
export async function tapTile(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(([x, y]) => window.__zen!.focusTile(x, y), [x, y] as const)
  await page.waitForTimeout(50)
  const point = await page.evaluate(([x, y]) => window.__zen!.tileToScreen(x, y), [x, y] as const)
  const box = await page.locator('canvas[data-testid="garden-canvas"]').boundingBox()
  if (!point || !box) throw new Error('garden not ready')
  await tapAt(page, box.x + point.x, box.y + point.y)
}

/** A touch tap on mobile viewports, a mouse click on desktop. */
export async function tapAt(page: Page, x: number, y: number): Promise<void> {
  if (page.viewportSize()!.width < 600) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
}

/** Advances game time as if the garden were on screen. */
export async function play(page: Page, ms: number): Promise<void> {
  await page.evaluate((ms) => window.__zen!.advance(ms), ms)
}

export async function openTab(page: Page, name: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Garden tools' })
    .getByRole('button', { name, exact: true })
    .click()
}

/** Places the current placement on a tile: one tap on desktop, preview then confirm on touch. */
export async function placeOn(page: Page, x: number, y: number): Promise<void> {
  await tapTile(page, x, y)
  if (page.viewportSize()!.width < 600) {
    await page.getByRole('button', { name: 'Place here' }).click()
  }
}

export function milestone(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => window.__zen!.controller.state.milestones[id] !== undefined, id)
}
