// Wirtualny czytnik ekranu (@guidepup/virtual-screen-reader): przechodzi całą stronę jak użytkownik
// czytnika strzałką w dół i zapisuje, co zostałoby przeczytane. Działa w każdej przeglądarce i w CI,
// bez NVDA – szybkie sprawdzenie przed rzadszym testem z prawdziwym czytnikiem (npm run test:nvda).
const { test, expect } = require('@playwright/test');
const { podstawApi } = require('./pomocnicze/api');

const SKRYPT = '/__czytnik-wirtualny.js';
const PLIK = require.resolve('@guidepup/virtual-screen-reader/browser.js');

async function przeczytajStrone(page) {
  await page.route(`**${SKRYPT}`, (r) => r.fulfill({ path: PLIK, contentType: 'text/javascript' }));
  await podstawApi(page, 'pelne');
  await page.goto('/');
  await expect(page.locator('#lista-grafiku .grafik__wiersz')).toHaveCount(6);
  await expect(page.locator('#lista-sklepu .produkt')).toHaveCount(5);
  return page.evaluate(async (adres) => {
    const { virtual } = await import(adres);
    await virtual.start({ container: document.body });
    // Czytamy, aż czytnik dojdzie do końca dokumentu (ostatnia fraza przestaje się zmieniać).
    let poprzednia = '';
    let powtorzenia = 0;
    for (let i = 0; i < 3000 && powtorzenia < 3; i++) {
      await virtual.next();
      const ostatnia = await virtual.lastSpokenPhrase();
      powtorzenia = ostatnia === poprzednia ? powtorzenia + 1 : 0;
      poprzednia = ostatnia;
    }
    const log = await virtual.spokenPhraseLog();
    await virtual.stop();
    return log;
  }, SKRYPT);
}

test('wirtualny czytnik czyta stronę w sensownym porządku', async ({ page }, info) => {
  const log = await przeczytajStrone(page);
  const telefon = info.project.name === 'telefon';
  await test.info().attach('co-przeczytal-czytnik', { body: log.join('\n'), contentType: 'text/plain' });

  // Punkty orientacyjne i nagłówki, po których nawigują użytkownicy czytników.
  const indeks = (wzor) => log.findIndex((f) => wzor.test(f));
  const kolejnosc = [
    /^banner/,
    // Na telefonie menu jest zwinięte – czytnik ma trafić na przycisk, który je rozwija.
    // (stan aria-expanded sprawdza zachowanie.spec.js › „menu dostępne na telefonie”).
    telefon ? /^button, Menu\b/ : /^navigation, Menu/,
    /^main/,
    /^heading, Kameralne studio treningowe w.Krakowie, level 1/,
    /^heading, Dlaczego GRA-fit, level 2/,
    /^heading, Najbliższe zajęcia, level 2/,
    /^heading, Cennik, level 2/,
    /^heading, Kontakt i dojazd, level 2/,
    /^contentinfo/,
  ].map((w) => ({ wzor: String(w), gdzie: indeks(w) }));
  const brakujace = kolejnosc.filter((k) => k.gdzie < 0).map((k) => k.wzor);
  expect(brakujace, 'czytnik nie przeczytał').toEqual([]);
  const pozycje = kolejnosc.map((k) => k.gdzie);
  expect(pozycje, 'punkty orientacyjne i nagłówki w złej kolejności').toEqual([...pozycje].sort((a, b) => a - b));

  // Elementy bez nazwy dostępnej: czytnik mówi wtedy samą rolę („link”, „button”, „img”).
  const bezNazwy = log.filter((f) => /^(link|button|img|image|textbox|combobox)$/.test(f.trim()));
  expect(bezNazwy, 'elementy przeczytane bez nazwy').toEqual([]);
});
