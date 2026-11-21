// Testy dostępności strony na lokalnym serwerze (bez budowania), w widoku telefonu i komputera.
const { defineConfig, devices } = require('@playwright/test');

const ADRES = 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: 'testy',
  testIgnore: 'nvda/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // monocart-reporter: raport HTML z załącznikami (wyniki axe, IBM, Alfa, log czytnika) w jednym miejscu.
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['monocart-reporter', { name: 'Dostępność GRA-fit', outputFile: 'playwright-report/index.html' }],
  ],
  use: { baseURL: ADRES, locale: 'pl-PL', timezoneId: 'Europe/Warsaw' },
  projects: [
    { name: 'telefon', use: { ...devices['Pixel 7'] } },
    { name: 'komputer', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx serve -l 4173 --no-clipboard .',
    url: ADRES,
    reuseExistingServer: !process.env.CI,
  },
});

module.exports.ADRES = ADRES;
