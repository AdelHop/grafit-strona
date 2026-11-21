// Kontrast par kolorów z style.css (1.4.3 tekst ≥ 4,5:1, 1.4.11 obrys fokusu ≥ 3:1), odczytanych w przeglądarce.
const { test, expect } = require('@playwright/test');
const { podstawApi } = require('./pomocnicze/api');
const { kontrast } = require('./pomocnicze/sprawdzenia');

test('kontrast kolorów strony', async ({ page }) => {
  await podstawApi(page, 'pelne');
  await page.goto('/');
  await expect(page.locator('.grafik__stan--brak').first()).toBeVisible();

  const k = await page.evaluate(() => {
    const zm = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const rozwin = (w) => w.replace(/var\((--[\w-]+)\)/g, (_, n) => zm(n));
    // Kolor obrysu wprost z reguły :focus-visible w style.css.
    let obrys = '';
    for (const arkusz of document.styleSheets) {
      for (const r of arkusz.cssRules) {
        if (r.selectorText === ':focus-visible') obrys = rozwin(r.style.outlineColor || r.style.outline.split(/\s+/).pop());
      }
    }
    const styl = (sel) => {
      const s = getComputedStyle(document.querySelector(sel));
      return { kolor: s.color, tlo: s.backgroundColor };
    };
    return {
      zmienne: Object.fromEntries(['--tekst', '--szary-tekst', '--czarny', '--tlo', '--tlo-szare'].map((n) => [n, zm(n)])),
      obrys,
      stan: styl('.grafik__stan:not(.grafik__stan--brak)'),
      brak: styl('.grafik__stan--brak'),
      stopka: { kolor: getComputedStyle(document.querySelector('.stopka .drobne')).color, tlo: getComputedStyle(document.querySelector('.stopka')).backgroundColor },
    };
  });

  const z = k.zmienne;
  const pary = [];
  for (const tekst of ['--tekst', '--szary-tekst', '--czarny']) {
    for (const tlo of ['--tlo', '--tlo-szare']) pary.push({ opis: `${tekst} na ${tlo}`, a: z[tekst], b: z[tlo], min: 4.5 });
  }
  for (const tlo of ['--tlo', '--tlo-szare']) pary.push({ opis: `obrys :focus-visible na ${tlo}`, a: k.obrys, b: z[tlo], min: 3 });
  pary.push({ opis: '.grafik__stan (są miejsca)', a: k.stan.kolor, b: k.stan.tlo, min: 4.5 });
  pary.push({ opis: '.grafik__stan--brak', a: k.brak.kolor, b: k.brak.tlo, min: 4.5 });
  pary.push({ opis: 'stopka .drobne na --czarny', a: k.stopka.kolor, b: k.stopka.tlo, min: 4.5 });

  // APCA (projekt WCAG 3) tylko informacyjnie: Lc ≥ 60 dla tekstu ciągłego, ≥ 45 dla dużego i pogrubionego.
  const { calcAPCA } = await import('apca-w3');
  const wyniki = pary.map((p) => ({
    ...p,
    wynik: Math.round(kontrast(p.a, p.b) * 100) / 100,
    apcaLc: Math.round(Math.abs(Number(calcAPCA(p.a, p.b))) * 10) / 10,
  }));
  await test.info().attach('kontrast', { body: JSON.stringify(wyniki, null, 2), contentType: 'application/json' });
  const zaNiskie = wyniki.filter((w) => w.wynik < w.min).map((w) => `${w.opis}: ${w.a} / ${w.b} = ${w.wynik}:1 (min ${w.min}:1)`);
  expect(zaNiskie).toEqual([]);
});
