// Wspólne pomiary testów zachowania: tabowanie, zasłonięcie fokusu, poziome przewijanie,
// rozmiar celów, odstępy tekstu (WCAG 1.4.12) i kontrast.

// Czeka, aż przewijanie strony się zatrzyma (html ma scroll-behavior: smooth).
async function poPrzewinieciu(page) {
  await page.evaluate(
    () =>
      new Promise((gotowe) => {
        let ostatni = -1;
        let stale = 0;
        const krok = () => {
          const teraz = window.scrollX * 100000 + window.scrollY;
          stale = teraz === ostatni ? stale + 1 : 0;
          ostatni = teraz;
          if (stale >= 3) gotowe();
          else requestAnimationFrame(krok);
        };
        requestAnimationFrame(krok);
      }),
  );
}

// Po każdym Tab (albo Shift+Tab): opis elementu z fokusem (tag, id, nazwa dostępna) i jego prostokąt.
async function tabuj(page, ile, wstecz = false) {
  const kroki = [];
  for (let i = 0; i < ile; i++) {
    await page.keyboard.press(wstecz ? 'Shift+Tab' : 'Tab');
    await poPrzewinieciu(page);
    kroki.push(
      await page.evaluate(() => {
        const e = document.activeElement;
        const nazwa = (
          e.getAttribute('aria-label') ||
          (e.getAttribute('aria-labelledby') || '')
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent || '')
            .join(' ') ||
          e.innerText ||
          e.getAttribute('alt') ||
          e.getAttribute('title') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60);
        const r = e.getBoundingClientRect();
        return {
          opis: `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} „${nazwa}”`,
          prostokat: { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left },
        };
      }),
    );
  }
  return kroki;
}

// Czy prostokąt elementu z fokusem nachodzi na prostokąt `selektor` choćby w części.
// { calkowicie: true } — czy leży w nim w całości (2.4.11 AA zabrania całkowitego zasłonięcia).
// Element z fokusem wewnątrz `selektor` (np. link w nagłówku) nie jest zasłonięty.
async function zaslonietyPrzez(page, selektor, { calkowicie = false } = {}) {
  return page.evaluate(
    ([sel, cal]) => {
      const e = document.activeElement;
      const z = document.querySelector(sel);
      if (!e || e === document.body || !z || z.contains(e)) return false;
      const a = e.getBoundingClientRect();
      const b = z.getBoundingClientRect();
      if (cal) return a.top >= b.top && a.bottom <= b.bottom && a.left >= b.left && a.right <= b.right;
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    },
    [selektor, calkowicie],
  );
}

async function przewijaPoziomo(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

// Cele węższe lub niższe niż `min` px, które nie spełniają wyjątku odstępu (2.5.8): okrąg o średnicy
// 24 px wokół środka celu nie może nachodzić na inny cel ani na okrąg innego małego celu.
// Pominięte linki w zdaniu: `a` w `p` oraz `a` w `li`, które ma tekst poza linkiem.
async function maleCele(page, min = 24) {
  return page.evaluate((min) => {
    const widoczne = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    };
    const wZdaniu = (e) => {
      if (e.tagName !== 'A') return false;
      const rodzic = e.parentElement;
      if (rodzic.tagName === 'P') return true;
      return rodzic.tagName === 'LI' && rodzic.textContent.trim() !== e.textContent.trim();
    };
    const cele = [...document.querySelectorAll('a, button, summary, [role=button]')].filter(widoczne);
    const male = cele.filter((e) => !wZdaniu(e)).filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width < min || r.height < min;
    });
    const srodek = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
    };
    const prostokat = (e) => {
      const r = e.getBoundingClientRect();
      return { l: r.left + window.scrollX, r: r.right + window.scrollX, t: r.top + window.scrollY, b: r.bottom + window.scrollY };
    };
    const opis = (e) => {
      const r = e.getBoundingClientRect();
      const nazwa = (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 40);
      return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} „${nazwa}” ${Math.round(r.width)}×${Math.round(r.height)}`;
    };
    return male
      .filter((e) => {
        const c = srodek(e);
        const kolizjaZCelem = cele.some((inny) => {
          if (inny === e || inny.contains(e) || e.contains(inny)) return false;
          const p = prostokat(inny);
          const dx = Math.max(p.l - c.x, 0, c.x - p.r);
          const dy = Math.max(p.t - c.y, 0, c.y - p.b);
          return Math.hypot(dx, dy) < 12;
        });
        const kolizjaZOkregiem = male.some((inny) => {
          if (inny === e) return false;
          const d = srodek(inny);
          return Math.hypot(c.x - d.x, c.y - d.y) < 24;
        });
        return kolizjaZCelem || kolizjaZOkregiem;
      })
      .map(opis);
  }, min);
}

const ODSTEPY_WCAG =
  '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }';

// Kolor jako #rgb, #rrggbb albo rgb()/rgba() (przezroczystość pomijana).
function rgb(kolor) {
  const k = kolor.trim();
  let m = k.match(/^#([0-9a-f]{3})$/i);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = k.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = k.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) return [m[1], m[2], m[3]].map(Number);
  throw new Error('Nieznany kolor: ' + kolor);
}

function luminancja(kolor) {
  const [r, g, b] = rgb(kolor).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Współczynnik kontrastu WCAG (1–21).
function kontrast(a, b) {
  const [j, c] = [luminancja(a), luminancja(b)].sort((x, y) => y - x);
  return (j + 0.05) / (c + 0.05);
}

module.exports = { tabuj, zaslonietyPrzez, przewijaPoziomo, maleCele, ODSTEPY_WCAG, kontrast, poPrzewinieciu };
