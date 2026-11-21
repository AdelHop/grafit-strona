# Strona GRA-fit Fitness (wersja testowa)

Statyczna strona dla nowych osób: oferta, cennik, pierwsze zajęcia (Intro), grafik na żywo z aplikacji, pytania i odpowiedzi, kontakt.
Bez frameworka i bez budowania – sam HTML/CSS/JS, więc Google i asystenci AI czytają całą treść od razu.

## Pliki

- `index.html` – cała treść + dane strukturalne (schema.org `ExerciseGym` z cennikiem i `FAQPage`)
- `style.css` – wygląd (kolory z logo: #FBCB69, #F26A6C, #6899CC)
- `sklep.js` – gadżety reklamowe z `https://app.grafit-fitness.pl/api/grafit/public/shop`, z podziałem na grupy
- `grafik.js` – najbliższe 7 dni zajęć z `https://app.grafit-fitness.pl/api/grafit/public/classes` (pomija zajęcia z „test” w nazwie) i przycisk „Wyślij link”
- `robots.txt` – wpuszcza Google i boty AI (GPTBot, ClaudeBot, PerplexityBot…)
- `sitemap.xml`, `llms.txt` – mapa strony i streszczenie dla asystentów AI

## Podgląd lokalnie

    npx serve C:\GrafitStrona

## Do uzupełnienia przed publikacją

1. **Domena** – strona działa pod `https://grafit-fitness.pl` (plik `CNAME`, GitHub Pages), aplikacja pod `https://app.grafit-fitness.pl`.
2. **Instagram** – w index.html odkomentuj link w sekcji „Obserwuj nas” i dopisz adres do `sameAs` w danych strukturalnych.
3. **Godziny otwarcia** – celowo pominięte, bo są różne; aktualny grafik pokazuje sekcja z zajęciami.
4. **Zdjęcia** – prawdziwe zdjęcia sali i zajęć (z podpisami `alt`) bardzo pomagają w Google i na Facebooku.
5. **Sprawdzić u właścicielki** – czy publikować adres e-mail, aktualność cen. (Studio jest dla wszystkich: teksty nie zawężają do kobiet, poza zajęciami dla kobiet w ciąży i Pelvi Balance.)

## Po publikacji

- Google Search Console: dodać domenę i wysłać `sitemap.xml`.
- Profil firmy w Google (Mapy): ten sam adres, nazwa i link do strony – najważniejsze dla wyszukiwań „fitness Kraków”.
- Link do strony w opisie profilu na Facebooku i Instagramie.

## Testy dostępności

    npm install
    npx playwright install chromium

| Polecenie | Co sprawdza |
| --- | --- |
| `npm test` | Playwright na telefonie i komputerze: axe (WCAG 2.2 AA), IBM Equal Access, Siteimprove Alfa, HTML_CodeSniffer, kontrast (WCAG 2 + APCA informacyjnie), klawiatura, 320 px, odstępy tekstu, tryb wysokiego kontrastu, ograniczenie ruchu, drzewo dostępności menu, wirtualny czytnik ekranu |
| `npm run test:nvda` | Prawdziwy czytnik NVDA (tylko Windows, NVDA zainstalowany) |
| `npm run test:html` | html-validate: poprawność HTML i reguły a11y bez uruchamiania strony |
| `npm run test:lighthouse` | Lighthouse CI: ocena dostępności musi wynosić 100 (potrzebny Chrome w systemie) |
| `npm run test:pa11y` | pa11y-ci na **opublikowanej** stronie (adresy z sitemap.xml), silniki axe i HTML_CodeSniffer |
| `npm run test:wszystko` | html-validate, Playwright i Lighthouse po kolei |

Raport ze wszystkimi wynikami i załącznikami (raport axe w HTML, wyniki IBM i Alfa, zapis wirtualnego czytnika): `playwright-report/index.html`.
Wzorzec drzewa dostępności menu jest w `testy/tryby.spec.js-snapshots/`; po świadomej zmianie menu odśwież go: `npx playwright test testy/tryby.spec.js --update-snapshots`.
