// Podstawione odpowiedzi publicznego API aplikacji (grafik i sklep), żeby mierzyć stronę z treścią.
// Warianty: 'pelne' — dane z testy/pomocnicze/dane, 'puste' — [], 'blad' — status 500.
const fs = require('node:fs');
const path = require('node:path');

const DANE = path.join(__dirname, 'dane');
const LOGO = path.join(__dirname, '..', '..', 'obrazy', 'logo.png');

function czytaj(plik) {
  return JSON.parse(fs.readFileSync(path.join(DANE, plik), 'utf8'));
}

// Daty liczone względem „teraz”: dzień 1 = jutro (czas w Warszawie ≈ UTC+1 zimą, UTC+2 latem;
// godziny 08–19 mieszczą się w tym samym dniu w obu strefach).
function zajecia() {
  const dzis = new Date();
  dzis.setUTCHours(0, 0, 0, 0);
  return czytaj('zajecia.json').map((z) => {
    const [g, m] = z.godzina.split(':').map(Number);
    const start = new Date(dzis.getTime() + z.dzien * 24 * 3600 * 1000);
    start.setUTCHours(g - 1, m, 0, 0);
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
