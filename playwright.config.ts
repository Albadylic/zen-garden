import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Safari on iPhone, ahead of the Capacitor port. WebKit is installed in CI;
    // set PW_WEBKIT=1 to run it locally where it is available.
    ...(process.env.CI || process.env.PW_WEBKIT
      ? [
          {
            name: 'iphone',
            use: { ...devices['iPhone 13'] },
            testMatch: ['smoke.spec.ts', 'layout.spec.ts', 'persistence.spec.ts'],
          },
        ]
      : []),
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
})
