// Ścieżka czytnikiem ekranu: nagłówkami do „Cennik” → tabela (nagłówek „Co”) → „Najbliższe zajęcia”
// → pierwszy „Dopisz się”. Dodatkowo: czy NVDA ogłasza wczytanie grafiku (region aria-live, S3).
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
async function doFrazy(nvda, komenda, tekst) {
  for (let i = 0; i < MAKS_KROKOW; i++) {
    await nvda.perform(komenda);
    if ((await nvda.lastSpokenPhrase()).includes(tekst)) return;
  }
  throw new Error(`NVDA nie doszedł do „${tekst}” w ${MAKS_KROKOW} krokach`);
}

// Godzina pierwszych zajęć z wolnymi miejscami (dane testowe: jutro 08:00 w Warszawie).
function oczekiwanyZapis() {
  const dane = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pomocnicze', 'dane', 'zajecia.json'), 'utf8'));
  const z = dane.find((x) => x.sa_miejsca);
  return { nazwa: z.nazwa, godzina: z.godzina };
}

test.use({ viewport: { width: 1280, height: 900 } });

test('NVDA: cennik → najbliższe zajęcia → dopisz się', async ({ page, nvda }) => {
  // Grafik czeka na sygnał, żeby NVDA był już na stronie, gdy region aria-live się zmieni.
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

  // 2. Ścieżka nagłówkami.
  await nvda.perform(NA_POCZATEK);
  await doFrazy(nvda, nvda.keyboardCommands.moveToNextHeading, 'Cennik');
  await doFrazy(nvda, nvda.keyboardCommands.moveToNextTable, 'Co');
  await doFrazy(nvda, nvda.keyboardCommands.moveToPreviousHeading, 'Najbliższe zajęcia');
  await doFrazy(nvda, nvda.keyboardCommands.moveToNextLink, 'Dopisz się');

  const log = await nvda.spokenPhraseLog();
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(
    LOG,
    ['# Ogłoszenie po wczytaniu grafiku', ...ogloszenie, '', '# Ścieżka', ...log].join('\n') + '\n',
    'utf8',
  );
  console.log('--- ogłoszenie grafiku ---\n' + ogloszenie.join('\n'));
  console.log('--- spokenPhraseLog ---\n' + log.join('\n'));

  const mowa = log.join('\n');
  const { nazwa, godzina } = oczekiwanyZapis();
  expect(mowa).toContain('Cennik');
  expect(log.some((f) => /(^|\W)Co(\W|$)/.test(f))).toBe(true);
  expect(mowa).toContain('Najbliższe zajęcia');
  expect(mowa).toContain(`Dopisz się do zajęć: ${nazwa}`);
  expect(mowa).toContain(godzina);

  // S3: region aria-live — czy NVDA odczytał treść grafiku bez przenoszenia kursora.
  expect.soft(ogloszenie.join('\n'), 'NVDA ogłasza wczytany grafik').toContain(nazwa);
});
