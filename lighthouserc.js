// Lighthouse CI: audyt dostępności (i przy okazji SEO) na plikach z tego katalogu.
// Lighthouse używa axe, więc głównie potwierdza wynik testów; zwraca też ocenę 0–100 do raportu.
// Przeglądarka: Chrome zainstalowany w systemie (wykrywany sam; jest też na GitHub Actions) albo
// ścieżka z CHROME_PATH. Chromium z Playwright nie startuje z Lighthouse na Windows.
module.exports = {
  ci: {
    collect: {
      staticDistDir: '.',
      url: ['/index.html'],
      numberOfRuns: 1,
      settings: { onlyCategories: ['accessibility', 'seo', 'best-practices'], chromeFlags: '--headless=new --no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'test-results/lighthouse' },
  },
};
