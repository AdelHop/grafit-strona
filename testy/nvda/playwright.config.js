// Ścieżka z czytnikiem ekranu NVDA (Guidepup) — tylko lokalnie na Windows, przejmuje klawiaturę i mówi.
// Uruchomienie: npm run test:nvda. Wymaga: npx @guidepup/setup setup oraz npx @guidepup/setup install.
const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');
const { ADRES } = require('../../playwright.config.js');

module.exports = defineConfig({
  testDir: __dirname,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 5 * 60 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: ADRES,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    headless: false,
    video: 'retain-on-failure',
  },
  projects: [{ name: 'nvda-chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npx serve -l 4173 --no-clipboard .',
    cwd: path.join(__dirname, '..', '..'),
    url: ADRES,
    reuseExistingServer: true,
  },
});
