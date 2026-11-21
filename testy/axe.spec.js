// Axe WCAG 2.2 AA na stronie z podstawionym API grafiku i sklepu: dane pełne, puste i błąd API.
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const { createHtmlReport } = require('axe-html-reporter');
const { podstawApi } = require('./pomocnicze/api');

const TAGI = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const NAZWY = { pelne: 'axe: pełne dane', puste: 'axe: pusty grafik', blad: 'axe: błąd API' };

for (const wariant of ['pelne', 'puste', 'blad']) {
  test(NAZWY[wariant], async ({ page }) => {
    await podstawApi(page, wariant);
    await page.goto('/');
    await expect(page.locator('#lista-grafiku')).not.toContainText('Wczytuję');
    await expect(page.locator('#lista-sklepu')).not.toContainText('Wczytuję');
    if (wariant === 'pelne') {
      await expect(page.locator('#lista-grafiku .grafik__wiersz')).toHaveCount(6);
      await expect(page.locator('#lista-sklepu .produkt')).toHaveCount(5);
    } else if (wariant === 'puste') {
      await expect(page.locator('#lista-grafiku')).toContainText('nie ma jeszcze zajęć');
      await expect(page.locator('#lista-sklepu')).toContainText('pojawią się tu wkrótce');
    } else {
      await expect(page.locator('#lista-grafiku')).toContainText('Nie udało się wczytać grafiku');
      await expect(page.locator('#lista-sklepu')).toContainText('Nie udało się wczytać gadżetów');
    }

    const wynik = await new AxeBuilder({ page }).withTags(TAGI).analyze();
    const opis = wynik.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    await test.info().attach('naruszenia', { body: JSON.stringify(opis, null, 2), contentType: 'application/json' });
    // Czytelny raport HTML (naruszenia, zaliczone, do ręcznej oceny) do pokazania osobom nietechnicznym.
    const raport = createHtmlReport({ results: wynik, options: { doNotCreateReportFile: true, projectKey: 'GRA-fit' } });
    await test.info().attach('raport-axe.html', { body: raport, contentType: 'text/html' });
    expect(wynik.violations.map((v) => v.id), opis.join('\n')).toEqual([]);
  });
}

// Deklaracja dostępności: strona statyczna, bez API — te same tagi co strona główna.
test('axe: deklaracja dostępności', async ({ page }) => {
  await page.goto('/dostepnosc.html');
  await expect(page.locator('h1')).toHaveText('Deklaracja dostępności');
  const wynik = await new AxeBuilder({ page }).withTags(TAGI).analyze();
  const opis = wynik.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  await test.info().attach('naruszenia', { body: JSON.stringify(opis, null, 2), contentType: 'application/json' });
  expect(wynik.violations.map((v) => v.id), opis.join('\n')).toEqual([]);
});
