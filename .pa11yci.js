// pa11y-ci: skan OPUBLIKOWANEJ strony (adresy z sitemap.xml na grafit-fitness.pl), dwoma silnikami
// naraz: axe i HTML_CodeSniffer. Uruchamiaj po publikacji: npm run test:pa11y
// Testy przed publikacją (lokalnie, z podstawionym API) są w testy/ – to jest sprawdzenie „na żywo”.
const { chromium } = require('playwright');

module.exports = {
  defaults: {
    standard: 'WCAG2AA',
    // Wyniki axe „do sprawdzenia ręcznie” (incomplete) zostają zgłaszane jako błędy (domyślne ustawienie pa11y).
    runners: ['axe', 'htmlcs'],
    timeout: 60000,
    wait: 2000, // grafik i sklep dociągają dane z API po wczytaniu strony
    chromeLaunchConfig: { executablePath: chromium.executablePath(), args: ['--no-sandbox'] },
  },
};
