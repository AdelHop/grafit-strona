// Testy zachowania zamiast audytu ręcznego: klawiatura (2.1.1, 2.4.3, 2.4.7, 2.4.1), fokus pod
// nagłówkiem (2.4.11), 320 px (1.4.10), odstępy tekstu (1.4.12), cele (2.5.8), komunikaty (4.1.3).
const { test, expect } = require('@playwright/test');
const { podstawApi } = require('./pomocnicze/api');
const { tabuj, zaslonietyPrzez, przewijaPoziomo, maleCele, ODSTEPY_WCAG, poPrzewinieciu } = require('./pomocnicze/sprawdzenia');

async function otworz(page) {
  await podstawApi(page, 'pelne');
  await page.goto('/');
  await expect(page.locator('#lista-grafiku .grafik__wiersz')).toHaveCount(6);
  await expect(page.locator('#lista-sklepu .produkt')).toHaveCount(5);
}

// Widoczne elementy interaktywne w kolejności DOM; każdy dostaje data-nr do porównania z kolejnością Tab.
async function oznaczInteraktywne(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, summary')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
      })
      .map((e, i) => {
        e.dataset.nr = String(i);
        return `${e.tagName.toLowerCase()} „${(e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 50)}”`;
      }),
  );
}

const nrFokusu = (page) =>
  page.evaluate(() => (document.activeElement === document.body ? 'body' : document.activeElement.dataset.nr ?? 'bez-nr'));

// Elementy wystające poza prawą lub lewą krawędź okna (poza owijkami z własnym przewijaniem).
async function pozaEkranem(page) {
  return page.evaluate(() => {
    const szer = document.documentElement.clientWidth;
    const wOwijce = (e) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    const wystaje = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.right > szer + 1 || r.left < -1) && !wOwijce(e);
    };
    // Tylko najgłębsze: element, którego żaden potomek też nie wystaje (przyczyna, nie kontenery).
    return [...document.body.querySelectorAll('*')]
      .filter((e) => wystaje(e) && ![...e.querySelectorAll('*')].some(wystaje))
      .map((e) => {
        const r = e.getBoundingClientRect();
        const klasa = typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '';
        return `${e.tagName.toLowerCase()}${klasa} „${e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)}” ${Math.round(r.left)}–${Math.round(r.right)} px`;
      });
  });
}

// Obszary przewijane w bok wewnątrz strony; 2.1.1 wymaga, by dało się je przewinąć klawiaturą.
// Chromium (od 130) i Firefox same dają fokus przewijanym obszarom, Safari nie — stąd wymóg tabindex="0"
// (tak samo liczy axe `scrollable-region-focusable`).
async function przewijaneObszary(page) {
  return page.evaluate(() =>
    [...document.body.querySelectorAll('*')]
      .filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth)
      .map((e) => ({ klasa: e.className, szerokosc: e.clientWidth, tresc: e.scrollWidth, tabindex0: e.hasAttribute('tabindex') && e.tabIndex >= 0 })),
  );
}

test.describe('zachowanie (dane pełne)', () => {
  test.beforeEach(async ({ page }) => otworz(page));

  test('klawiatura dochodzi do wszystkiego', async ({ page }) => {
    const oczekiwane = await oznaczInteraktywne(page);
    const odwiedzone = [];
    for (let i = 0; i < oczekiwane.length + 20; i++) {
      await page.keyboard.press('Tab');
      // Powtórkę poznajemy po samym elemencie (znacznik data-odwiedzony), nie po numerze:
      // elementy spoza listy (np. dodatkowy tabindex="0") mają wspólne 'bez-nr'.
      const powtorka = await page.evaluate(() => {
        const e = document.activeElement;
        if (e === document.body || e.dataset.odwiedzony) return true;
        e.dataset.odwiedzony = '1';
        return false;
      });
      if (powtorka) break;
      odwiedzone.push(await nrFokusu(page));
    }
    const kolejnosc = odwiedzone.filter((n) => n !== 'bez-nr').map(Number);
    const pominiete = oczekiwane.filter((_, i) => !kolejnosc.includes(i));
    expect(pominiete, 'elementy, do których Tab nie dochodzi').toEqual([]);
    expect(kolejnosc, 'kolejność Tab = kolejność w DOM').toEqual(oczekiwane.map((_, i) => i));
  });

  test('fokus widoczny', async ({ page }) => {
    const ile = (await oznaczInteraktywne(page)).length;
    const bezObrysu = [];
    for (let i = 0; i < ile + 10; i++) {
      await page.keyboard.press('Tab');
      const stan = await page.evaluate(() => {
        const e = document.activeElement;
        if (e === document.body) return null;
        const s = getComputedStyle(e);
        return { opis: `${e.tagName.toLowerCase()} „${e.textContent.trim().slice(0, 40)}”`, styl: s.outlineStyle, grubosc: parseFloat(s.outlineWidth) };
      });
      if (!stan) break;
      if (stan.styl === 'none' || !(stan.grubosc > 0)) bezObrysu.push(stan.opis);
    }
    expect(bezObrysu).toEqual([]);
  });

  // Review Focus 4: tabowanie w przód i wstecz pod przyklejonym nagłówkiem. Na komputerze także
  // przy powiększeniu 200% (okno 640×360 px CSS).
  for (const okno of [null, { width: 640, height: 360, opis: '200%' }]) {
    test(`fokus niezasłonięty w obie strony${okno ? ' (' + okno.opis + ')' : ''}`, async ({ page }, info) => {
      if (okno) {
        test.skip(info.project.name !== 'komputer', 'powiększenie 200% tylko na komputerze');
        await page.setViewportSize({ width: okno.width, height: okno.height });
      }
      const ile = (await oznaczInteraktywne(page)).length;
      const calkowicie = [];
      const czesciowo = [];
      const sprawdz = async (wstecz) => {
        const [krok] = await tabuj(page, 1, wstecz);
        if (krok.opis.startsWith('body')) return false;
        const kierunek = wstecz ? 'wstecz' : 'w przód';
        if (await zaslonietyPrzez(page, '.naglowek', { calkowicie: true })) calkowicie.push(`${kierunek}: ${krok.opis}`);
        else if (await zaslonietyPrzez(page, '.naglowek')) czesciowo.push(`${kierunek}: ${krok.opis}`);
        return true;
      };
      // W przód do końca strony (fokus wraca na body), potem wstecz tyle samo kroków.
      let kroki = 0;
      while (kroki < ile + 10 && (await sprawdz(false))) kroki++;
      for (let i = 0; i < kroki; i++) await sprawdz(true);
      if (czesciowo.length) {
        info.annotations.push({ type: 'ostrzeżenie', description: 'Fokus częściowo pod nagłówkiem: ' + czesciowo.join('; ') });
      }
      expect(calkowicie, 'fokus całkowicie pod nagłówkiem').toEqual([]);
    });
  }

  // 1.4.10 i Review Focus 5 (nazwy 60 znaków): 320 px, bez i z odstępami WCAG.
  test('320 px bez przewijania w bok', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await poPrzewinieciu(page);
    for (const odstepy of [false, true]) {
      if (odstepy) await page.addStyleTag({ content: ODSTEPY_WCAG });
      const etykieta = odstepy ? ' (odstępy WCAG)' : '';
      expect.soft(await przewijaPoziomo(page), 'strona przewija się w bok' + etykieta).toBe(false);
      expect.soft(await pozaEkranem(page), 'elementy poza ekranem' + etykieta).toEqual([]);
      const obszary = await przewijaneObszary(page);
      expect.soft(obszary.filter((o) => !o.tabindex0), 'obszary przewijane w bok bez tabindex="0"' + etykieta).toEqual([]);
    }
  });

  test('odstępy WCAG nie ucinają treści', async ({ page }) => {
    for (const okno of [null, { width: 320, height: 640 }]) {
      if (okno) await page.setViewportSize(okno);
      await page.addStyleTag({ content: ODSTEPY_WCAG });
      const uciete = await page.evaluate(() => {
        const ukrywa = (s) => /(hidden|clip)/.test(s.overflowX + ' ' + s.overflowY);
        return [...document.querySelectorAll('h1, h2, h3, h4, p, .grafik__wiersz span, .produkt h3')]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .filter((e) => {
            const s = getComputedStyle(e);
            if (ukrywa(s) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) return true;
            const r = e.getBoundingClientRect();
            for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
              if (!ukrywa(getComputedStyle(p))) continue;
              const q = p.getBoundingClientRect();
              if (r.right > q.right + 1 || r.bottom > q.bottom + 1 || r.left < q.left - 1 || r.top < q.top - 1) return true;
            }
            return false;
          })
          .map((e) => `${e.tagName.toLowerCase()} „${e.textContent.trim().slice(0, 40)}”`);
      });
      expect.soft(uciete, `ucięta treść przy ${okno ? '320 px' : 'domyślnym oknie'}`).toEqual([]);
    }
  });

  test('cele co najmniej 24 px', async ({ page }) => {
    expect(await maleCele(page)).toEqual([]);
  });

  test('link skopiowany ogłaszany', async ({ page, context }) => {
    await context.addInitScript(() => {
      delete Navigator.prototype.share;
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
    await otworz(page);
    await page.locator('#udostepnij').click();
    await expect(page.locator('#udostepnij'), 'skrypt zmienia napis przycisku').toHaveText('Link skopiowany');
    const ogloszenie = page
      .locator('[role="status"], [role="alert"], [aria-live="polite"], [aria-live="assertive"]')
      .filter({ hasText: 'Link skopiowany' });
    await expect(ogloszenie, 'komunikat w regionie ogłaszanym czytnikowi').not.toHaveCount(0);
  });

  test('menu dostępne na telefonie', async ({ page }, info) => {
    test.skip(info.project.name !== 'telefon', 'menu zwijane dotyczy telefonu');
    const sekcje = await page.locator('nav.menu a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    const osiagniete = new Set();
    let rozwinieto = false;
    let byloWNaglowku = false;
    // Elementy przed nagłówkiem (np. „Przejdź do treści”) pomijamy; koniec, gdy fokus wyjdzie z nagłówka.
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const stan = await page.evaluate(() => {
        const e = document.activeElement;
        return {
          wNaglowku: !!e.closest('.naglowek'),
          href: e.getAttribute('href'),
          menu: e.tagName === 'BUTTON' && e.hasAttribute('aria-expanded'),
          rozwiniete: e.getAttribute('aria-expanded') === 'true',
        };
      });
      if (!stan.wNaglowku) {
        if (byloWNaglowku) break;
        continue;
      }
      byloWNaglowku = true;
      if (stan.href) osiagniete.add(stan.href);
      if (stan.menu && !stan.rozwiniete && !rozwinieto) {
        await page.keyboard.press('Enter');
        rozwinieto = true;
      }
    }
    expect(sekcje.filter((s) => !osiagniete.has(s)), 'sekcje menu nieosiągalne Tabem z nagłówka').toEqual([]);
  });

  // Review Focus 3: 320 px z otwartym menu — Esc zamyka i oddaje fokus, wybór sekcji zamyka menu.
  test('menu na telefonie zamyka Esc i oddaje fokus', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const przycisk = page.locator('.naglowek button[aria-controls]');
    await expect(przycisk, 'przycisk menu widoczny').toBeVisible();
    await expect(przycisk).toHaveAccessibleName(/Menu/);
    const menu = page.locator('#' + (await przycisk.getAttribute('aria-controls')));
    await expect(menu, 'aria-controls wskazuje nav.menu').toHaveClass(/\bmenu\b/);
    await expect(przycisk).toHaveAttribute('aria-expanded', 'false');
    await expect(menu.locator('a').first(), 'menu zwinięte').toBeHidden();

    await przycisk.click();
    await expect(przycisk).toHaveAttribute('aria-expanded', 'true');
    for (const a of await menu.locator('a').all()) await expect(a).toBeVisible();
    // Otwarte menu nie wychodzi poza ekran.
    expect(await przewijaPoziomo(page), 'otwarte menu przewija stronę w bok').toBe(false);

    await menu.locator('a').first().focus();
    await page.keyboard.press('Escape');
    await expect(przycisk).toHaveAttribute('aria-expanded', 'false');
    await expect(menu.locator('a').first()).toBeHidden();
    await expect(przycisk, 'fokus wraca na przycisk menu').toBeFocused();

    // Wybór sekcji zamyka menu, a fokus nie ląduje pod nagłówkiem.
    await przycisk.click();
    await menu.locator('a[href="#cennik"]').click();
    await expect(przycisk).toHaveAttribute('aria-expanded', 'false');
    await poPrzewinieciu(page);
    const h = await page.locator('#cennik h2').boundingBox();
    const n = await page.locator('.naglowek').boundingBox();
    expect(h.y, 'nagłówek „Cennik” widoczny pod nagłówkiem strony').toBeGreaterThanOrEqual(n.y + n.height - 1);
  });

  test('przejdź do treści', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus'), 'pierwszy Tab').toHaveAccessibleName(/Przejdź do treści/);
    await page.keyboard.press('Enter');
    await poPrzewinieciu(page);
    expect(await page.evaluate(() => !!document.activeElement.closest('main')), 'fokus w main po Enter').toBe(true);
  });
});
