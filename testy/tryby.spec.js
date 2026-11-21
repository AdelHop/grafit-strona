// Ustawienia systemu, których axe nie sprawdza: tryb wysokiego kontrastu Windows (forced-colors, 1.4.11),
// ograniczenie ruchu (prefers-reduced-motion, 2.3.3 jako dobra praktyka) oraz snapshot drzewa
// dostępności nagłówka i menu – zmiana ról albo nazw (4.1.2) wychodzi w diffie.
const { test, expect } = require('@playwright/test');
const { podstawApi } = require('./pomocnicze/api');

async function otworz(page) {
  await podstawApi(page, 'pelne');
  await page.goto('/');
  await expect(page.locator('#lista-grafiku .grafik__wiersz')).toHaveCount(6);
}

// Widoczne elementy interaktywne, których obrys fokusu lub ramka znika (np. przez outline: none
// albo forced-color-adjust: none), sprawdzone po kolei z fokusem z klawiatury.
async function bezWidocznegoFokusu(page) {
  const liczba = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a[href], button, summary')].filter((e) => e.checkVisibility());
    el.forEach((e, i) => (e.dataset.trybNr = String(i)));
    return el.length;
  });
  const zle = [];
  for (let i = 0; i < liczba; i++) {
    const e = page.locator(`[data-tryb-nr="${i}"]`);
    // focus() z klawiatury: Playwright ustawia :focus-visible po wciśnięciu klawisza.
    await e.focus();
    await page.keyboard.press('Shift');
    const styl = await e.evaluate((n) => {
      const s = getComputedStyle(n);
      return {
        opis: `${n.tagName.toLowerCase()} „${(n.getAttribute('aria-label') || n.textContent).replace(/\s+/g, ' ').trim().slice(0, 40)}”`,
        obrys: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
        wymuszone: s.forcedColorAdjust,
      };
    });
    if (!styl.obrys || styl.wymuszone === 'none') zle.push(styl.opis);
  }
  return zle;
}

test.describe('tryb wysokiego kontrastu', () => {
  test.use({ colorScheme: 'dark' });

  test('fokus widoczny w forced-colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await otworz(page);
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    expect(await bezWidocznegoFokusu(page)).toEqual([]);
  });

  test('przyciski rozpoznawalne w forced-colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await otworz(page);
    // W trybie wysokiego kontrastu tło przycisku znika – granicę musi wyznaczać ramka (border),
    // a przycisk wystylizowany na link (.link) musi zostać podkreślony.
    const bezRamki = await page.evaluate(() =>
      [...document.querySelectorAll('.przycisk, button')]
        .filter((e) => e.checkVisibility())
        .filter((e) => {
          const s = getComputedStyle(e);
          const ramka = ['Top', 'Right', 'Bottom', 'Left'].some((b) => s[`border${b}Style`] !== 'none' && parseFloat(s[`border${b}Width`]) > 0);
          return !ramka && !s.textDecorationLine.includes('underline');
        })
        .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} „${e.textContent.trim().slice(0, 40)}”`),
    );
    expect(bezRamki, 'przyciski bez ramki znikną w trybie wysokiego kontrastu').toEqual([]);
  });
});

test('ograniczenie ruchu wyłącza animacje', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await otworz(page);
  const ruch = await page.evaluate(() => {
    const wynik = [];
    if (getComputedStyle(document.documentElement).scrollBehavior !== 'auto') wynik.push('html: scroll-behavior nie jest auto');
    for (const e of document.querySelectorAll('body *')) {
      const s = getComputedStyle(e);
      const czasy = `${s.transitionDuration},${s.animationDuration}`.split(',').map((t) => parseFloat(t) || 0);
      const ruchome = s.transitionProperty !== 'none' && /transform|translate|scale|rotate|all/.test(s.transitionProperty);
      if ((ruchome && czasy.some((t) => t > 0)) || (s.animationName !== 'none' && czasy.some((t) => t > 0))) {
        wynik.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')}: ${s.transitionProperty} ${s.transitionDuration} ${s.animationName}`);
      }
    }
    return [...new Set(wynik)];
  });
  expect(ruch).toEqual([]);
});

test('drzewo dostępności nagłówka i menu', async ({ page }, info) => {
  test.skip(info.project.name !== 'komputer', 'menu na telefonie jest zwinięte – snapshot tylko dla komputera');
  await otworz(page);
  // Pierwsze uruchomienie (lub npx playwright test --update-snapshots) zapisuje wzorzec do repo.
  await expect(page.locator('header.naglowek')).toMatchAriaSnapshot({ name: 'naglowek.aria.yml' });
});
