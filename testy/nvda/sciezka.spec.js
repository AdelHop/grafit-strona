// Ścieżka czytnikiem ekranu: nagłówkami do „Cennik” → tabela (nagłówek „Co”) → „Najbliższe zajęcia”
// → pierwszy „Dopisz się”. Dodatkowo: czy NVDA ogłasza wczytanie grafiku (region role="status", S3).
const fs = require('node:fs');
const path = require('node:path');
const { nvdaTest: test } = require('@guidepup/playwright');
const { WindowsKeyCodes, WindowsModifiers } = require('@guidepup/guidepup');
const { expect } = require('@playwright/test');
const { podstawApi } = require('../pomocnicze/api');

const MAKS_KROKOW = 60;
const NA_POCZATEK = { keyCode: [WindowsKeyCodes.Home], modifiers: [WindowsModifiers.Control] };
const LOG = path.join(__dirname, '..', '..', 'test-results', 'nvda-spokenPhraseLog.txt');

// Wykonuje komendę NVDA, aż ostatnia wypowiedź zawiera `tekst` (albo skończą się kroki).
// Po jednym klawiszu NVDA często mówi kilka fraz (np. „tabela…”, „wiersz 1 kolumna 1”, „Co”),
// więc sprawdzamy wszystkie frazy od ostatniego kroku, nie tylko ostatnią.
async function doFrazy(nvda, komenda, tekst) {
  for (let i = 0; i < MAKS_KROKOW; i++) {
    const przed = (await nvda.spokenPhraseLog()).length;
    await nvda.perform(komenda);
    const nowe = (await nvda.spokenPhraseLog()).slice(przed);
    // Bez rozróżniania wielkości liter: nagłówki z `text-transform: uppercase` NVDA czyta jako „CO”.
    if (nowe.some((f) => f.toLocaleLowerCase('pl').includes(tekst.toLocaleLowerCase('pl')))) return;
  }
  throw new Error(`NVDA nie doszedł do „${tekst}” w ${MAKS_KROKOW} krokach`);
}

function zapiszLog(ogloszenie, log) {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(
    LOG,
    ['# Ogłoszenie po wczytaniu grafiku', ...ogloszenie, '', '# Ścieżka', ...log].join('\n') + '\n',
    'utf8',
  );
}

// Godzina pierwszych zajęć z wolnymi miejscami (dane testowe: jutro 08:00 w Warszawie).
function oczekiwanyZapis() {
  const dane = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pomocnicze', 'dane', 'zajecia.json'), 'utf8'));
  const z = dane.find((x) => x.sa_miejsca);
  return { nazwa: z.nazwa, godzina: z.godzina };
}

test.use({ viewport: { width: 1280, height: 900 } });

test('NVDA: cennik → najbliższe zajęcia → dopisz się', async ({ page, nvda }) => {
  // Grafik czeka na sygnał, żeby NVDA był już na stronie, gdy region statusu się zmieni.
  let wypusc;
  const sygnal = new Promise((r) => { wypusc = r; });
  await podstawApi(page, 'pelne');
  await page.route('**/api/grafit/public/classes', async (route) => { await sygnal; await route.fallback(); });

  await page.goto('/');
  await expect(page.locator('#lista-grafiku')).toContainText('Wczytuję grafik');
  await nvda.navigateToWebContent();

  // 1. Ogłoszenie wczytania grafiku (S3): NVDA stoi na początku strony, grafik przychodzi później.
  await nvda.clearSpokenPhraseLog();
  wypusc();
  await expect(page.locator('#lista-grafiku .grafik__dzien').first()).toBeVisible();
  await page.waitForTimeout(4000);
  const ogloszenie = [...(await nvda.spokenPhraseLog())];

  // 2. Ścieżka nagłówkami. Mowa zapisywana zawsze — także gdy krok się nie uda.
  await nvda.clearSpokenPhraseLog();
  try {
    await nvda.perform(NA_POCZATEK);
    await doFrazy(nvda, nvda.keyboardCommands.moveToNextHeading, 'Cennik');
    await doFrazy(nvda, nvda.keyboardCommands.moveToNextTable, 'Co');
    await doFrazy(nvda, nvda.keyboardCommands.moveToPreviousHeading, 'Najbliższe zajęcia');
    await doFrazy(nvda, nvda.keyboardCommands.moveToNextLink, 'Dopisz się');
  } finally {
    zapiszLog(ogloszenie, await nvda.spokenPhraseLog());
  }

  const log = await nvda.spokenPhraseLog();
  console.log('--- ogłoszenie grafiku ---\n' + ogloszenie.join('\n'));
  console.log('--- spokenPhraseLog ---\n' + log.join('\n'));

  const mowa = log.join('\n');
  const { nazwa, godzina } = oczekiwanyZapis();
  expect(mowa).toContain('Cennik');
  expect(log.some((f) => /(^|\W)Co(\W|$)/i.test(f))).toBe(true);
  expect(mowa).toContain('Najbliższe zajęcia');
  expect(mowa).toContain(`Dopisz się do zajęć: ${nazwa}`);
  expect(mowa).toContain(godzina);

  // S3 b: ogłoszenie wczytania przy otwarciu strony to dobra praktyka poza AA — tylko zapis informacyjny
  // (21.11: NVDA w Edge go nie ogłasza, także ręcznie; audyt, sekcja „NVDA”).
  const ogloszono = ogloszenie.some((f) => f.includes('Wczytano grafik'));
  console.log(`S3 b — NVDA ogłosił wczytanie grafiku: ${ogloszono ? 'tak' : 'nie'}`);
});
