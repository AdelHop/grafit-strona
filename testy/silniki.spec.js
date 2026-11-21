// Drugie zdanie po axe: trzy inne silniki reguł na tej samej stronie z podstawionym API.
// IBM Equal Access (polityka WCAG 2.2), Siteimprove Alfa (reguły W3C ACT) i HTML_CodeSniffer (WCAG2AA).
// Każdy silnik ma inne reguły, więc łapią problemy, których axe nie zgłasza. Test pada tylko na
// naruszeniach poziomu A/AA; ostrzeżenia i „do sprawdzenia ręcznie” trafiają do załącznika.
const { test, expect } = require('@playwright/test');
const aChecker = require('accessibility-checker');
const { podstawApi } = require('./pomocnicze/api');

async function otworz(page) {
  await podstawApi(page, 'pelne');
  await page.goto('/');
  await expect(page.locator('#lista-grafiku .grafik__wiersz')).toHaveCount(6);
  await expect(page.locator('#lista-sklepu .produkt')).toHaveCount(5);
}

async function zalacz(nazwa, dane) {
  await test.info().attach(nazwa, { body: JSON.stringify(dane, null, 2), contentType: 'application/json' });
}

test.afterAll(async () => {
  await aChecker.close();
});

test('IBM Equal Access: WCAG 2.2', async ({ page }, info) => {
  await otworz(page);
  // Etykieta musi być unikalna w obrębie uruchomienia (projekty telefon/komputer, ponowienia).
  const { report } = await aChecker.getCompliance(page, `strona-${info.project.name}-${info.retry}`);
  const wyniki = report.results.map((r) => ({ poziom: r.level, regula: r.ruleId, gdzie: r.path.dom, opis: r.message }));
  await zalacz('ibm', wyniki);
  expect(report.summary.counts.pass, 'IBM nic nie ocenił').toBeGreaterThan(100);
  const naruszenia = wyniki.filter((r) => r.poziom === 'violation').map((r) => `${r.regula}: ${r.gdzie} – ${r.opis}`);
  expect(naruszenia, naruszenia.join('\n')).toEqual([]);
});

// Kryteria AAA z WCAG 2.2 – reguły Alfa przypisane wyłącznie do nich nie blokują testu.
const AAA = new Set([
  '1.2.6', '1.2.7', '1.2.8', '1.2.9', '1.3.6', '1.4.6', '1.4.7', '1.4.8', '1.4.9', '2.1.3', '2.2.3', '2.2.4',
  '2.2.5', '2.2.6', '2.3.2', '2.3.3', '2.4.8', '2.4.9', '2.4.10', '2.4.12', '2.4.13', '2.5.5', '2.5.6',
  '3.1.3', '3.1.4', '3.1.5', '3.1.6', '3.2.5', '3.3.5', '3.3.6', '3.3.9',
]);

test('Siteimprove Alfa: reguły ACT', async ({ page }) => {
  await otworz(page);
  // Pakiety Alfa są ESM, więc ładowane dynamicznie z testu CommonJS.
  const { Playwright } = await import('@siteimprove/alfa-playwright');
  const { Audit, Outcome } = await import('@siteimprove/alfa-act');
  const { Rules } = await import('@siteimprove/alfa-rules');

  const dokument = await page.evaluateHandle(() => window.document);
  const strona = await Playwright.toPage(dokument);
  const wyniki = [];
  let zaliczone = 0;
  for (const o of await Audit.of(strona, Rules.values()).evaluate()) {
    if (Outcome.isPassed(o)) zaliczone++;
    if (!Outcome.isFailed(o)) continue;
    const kryteria = o.rule.requirements.map((q) => q.toJSON()).filter((q) => q.type === 'criterion').map((q) => q.chapter);
    const cel = o.target;
    wyniki.push({
      regula: o.rule.uri.split('/').pop(),
      kryteria,
      blokuje: kryteria.some((k) => !AAA.has(k)),
      gdzie: cel && typeof cel.path === 'function' ? cel.path() : String(cel),
    });
  }
  await zalacz('alfa', { zaliczone, niezaliczone: wyniki });
  expect(zaliczone, 'Alfa nic nie oceniła – strona nie została przekazana do audytu').toBeGreaterThan(100);
  const naruszenia = wyniki.filter((w) => w.blokuje).map((w) => `${w.regula} (${w.kryteria.join(', ')}): ${w.gdzie}`);
  expect(naruszenia, naruszenia.join('\n')).toEqual([]);
});

test('HTML_CodeSniffer: WCAG2AA', async ({ page }) => {
  await otworz(page);
  await page.addScriptTag({ path: require.resolve('@pa11y/html_codesniffer/build/HTMLCS.js') });
  const komunikaty = await page.evaluate(
    () =>
      new Promise((gotowe) => {
        window.HTMLCS.process('WCAG2AA', document, () => {
          const typ = { 1: 'błąd', 2: 'ostrzeżenie', 3: 'uwaga' };
          gotowe(
            window.HTMLCS.getMessages().map((m) => ({
              typ: typ[m.type],
              kod: m.code,
              opis: m.msg,
              element: m.element && m.element.outerHTML ? m.element.outerHTML.slice(0, 120) : '',
            })),
          );
        });
      }),
  );
  await zalacz('htmlcs', komunikaty.filter((k) => k.typ !== 'uwaga'));
  expect(komunikaty.length, 'HTML_CodeSniffer nie zwrócił żadnych komunikatów').toBeGreaterThan(0);
  const bledy = komunikaty.filter((k) => k.typ === 'błąd').map((k) => `${k.kod}: ${k.element}`);
  expect(bledy, bledy.join('\n')).toEqual([]);
});
