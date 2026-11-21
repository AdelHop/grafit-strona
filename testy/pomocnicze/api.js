// Podstawione odpowiedzi publicznego API aplikacji (grafik i sklep), żeby mierzyć stronę z treścią.
// Warianty: 'pelne' — dane z testy/pomocnicze/dane, 'puste' — [], 'blad' — status 500.
const fs = require('node:fs');
const path = require('node:path');

const DANE = path.join(__dirname, 'dane');
const LOGO = path.join(__dirname, '..', '..', 'obrazy', 'logo.png');

function czytaj(plik) {
  return JSON.parse(fs.readFileSync(path.join(DANE, plik), 'utf8'));
}

// Daty liczone względem „teraz” w strefie Europe/Warsaw: dzień 1 = jutro, godzina z danych to
// godzina w Warszawie niezależnie od pory roku (przesunięcie strefy wyznaczane dla danej daty).
const STREFA = 'Europe/Warsaw';
const czesci = new Intl.DateTimeFormat('en-US', {
  timeZone: STREFA, hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
});

function wStrefie(ms) {
  const c = {};
  for (const { type, value } of czesci.formatToParts(new Date(ms))) c[type] = Number(value);
  return c;
}

// Przesunięcie strefy (ms) w chwili `ms`: czas „na zegarze” w Warszawie minus UTC.
function przesuniecie(ms) {
  const c = wStrefie(ms);
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second) - Math.floor(ms / 1000) * 1000;
}

// Chwila (UTC) odpowiadająca godzinie g:m dnia r-mc-d w Warszawie.
function warszawa(r, mc, d, g, m) {
  const zegar = Date.UTC(r, mc - 1, d, g, m);
  let ms = zegar - przesuniecie(zegar);
  ms = zegar - przesuniecie(ms); // druga iteracja na wypadek zmiany czasu między przybliżeniami
  return new Date(ms);
}

function zajecia() {
  const dzis = wStrefie(Date.now());
  return czytaj('zajecia.json').map((z) => {
    const [g, m] = z.godzina.split(':').map(Number);
    const start = warszawa(dzis.year, dzis.month, dzis.day + z.dzien, g, m);
    return { starts_at: start.toISOString().replace('T', ' '), nazwa: z.nazwa, sa_miejsca: z.sa_miejsca };
  });
}

async function podstawApi(page, wariant) {
  if (!['pelne', 'puste', 'blad'].includes(wariant)) throw new Error('Nieznany wariant: ' + wariant);
  const odpowiedz = (dane) => (route) =>
    wariant === 'blad'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"błąd"}' })
      : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wariant === 'puste' ? [] : dane()) });

  // Siatka bezpieczeństwa: testy nigdy nie trafiają w produkcję. Trasy dodane później mają
  // pierwszeństwo, więc podstawione odpowiedzi poniżej działają, a reszta adresów aplikacji jest odcięta.
  await page.route('https://app.grafit-fitness.pl/**', (route) => route.abort());
  await page.route('**/api/grafit/public/classes', odpowiedz(zajecia));
  await page.route('**/api/grafit/public/shop', odpowiedz(() => czytaj('sklep.json')));
  await page.route('**/*.{png,jpg,webp}', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(LOGO) }),
  );
}

module.exports = { podstawApi };
