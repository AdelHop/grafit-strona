# Audyt dostępności strony grafit-fitness.pl — listopad 2026

Miara: WCAG 2.2 AA. Spec: `docs/superpowers/specs/2026-11-21-dostepnosc-wcag22-design.md` (repo aplikacji), część A.
Znaleziska wstępne S1–S6 — w specu; nowe numerowane od S7.

## Pomiar automatyczny

Data: 21.11.2026. Gałąź `dostepnosc`, stan strony jak na `main` (8017b30), przed poprawkami.

- Narzędzia: `@playwright/test` 1.65.1 (Chromium), `@axe-core/playwright` 4.14.0 (axe-core 4.14.1), `serve` na `127.0.0.1:4173`.
- Tagi: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa`.
- Projekty: `telefon` (Pixel 7, 412×839), `komputer` (Desktop Chrome, 1280×720).
- API grafiku i sklepu podstawione w teście (`testy/pomocnicze/api.js`):
  - `pelne` — 6 zajęć w 3 dniach (2 bez miejsc, jedna nazwa 60 znaków), 5 produktów w 2 grupach (jedna nazwa 60 znaków, jeden bez zdjęcia);
  - `puste` — `[]` (komunikaty „W najbliższych dniach nie ma jeszcze zajęć…”, „Gadżety pojawią się tu wkrótce…”);
  - `blad` — status 500 (komunikaty „Nie udało się wczytać grafiku…”, „Nie udało się wczytać gadżetów…”).
- Polecenie: `npx playwright test axe`.

| Wariant | telefon | komputer |
|---|---|---|
| `pelne` | `scrollable-region-focusable` (serious): `.tabela-owijka` | brak naruszeń |
| `puste` | `scrollable-region-focusable` (serious): `.tabela-owijka` | brak naruszeń |
| `blad` | `scrollable-region-focusable` (serious): `.tabela-owijka` | brak naruszeń |

Wynik: 3 FAIL (telefon), 3 PASS (komputer). Treść z API (grafik, sklep, komunikaty pustego stanu i błędu) nie daje naruszeń axe w żadnym wariancie.

Axe nie mierzy kontrastu obrysu fokusu, zasłonięcia fokusu przez nagłówek, menu na telefonie ani ogłaszania komunikatów — S1–S4 sprawdzają testy zachowania (niżej).

## Testy zachowania i kontrastu

Data: 21.11.2026, ten sam stan strony i te same narzędzia co wyżej. Dane `pelne` (w tym nazwa zajęć i nazwa produktu po 60 znaków).
Polecenie: `npx playwright test zachowanie kontrast`. Pomiary wspólne: `testy/pomocnicze/sprawdzenia.js`.

| Test | Kryterium | telefon | komputer | Wynik / przyczyna FAIL |
|---|---|---|---|---|
| klawiatura dochodzi do wszystkiego | 2.1.1, 2.4.3 | PASS | PASS | Tab dochodzi do każdego widocznego `a[href]`, `button`, `summary` w kolejności DOM. Na telefonie menu jest ukryte, więc jego linków nie ma na liście — patrz S4. |
| fokus widoczny | 2.4.7 | PASS | PASS | Każdy element z fokusem ma obrys (`outline` 3 px). Kontrast obrysu — test kontrastu. |
| fokus niezasłonięty w obie strony | 2.4.11 | PASS | PASS (także 200%: okno 640×360) | Tab w przód do końca strony i Shift+Tab z powrotem: 0 przypadków całkowitego zasłonięcia przez `.naglowek` (`scroll-padding-top: 76px` działa także wstecz). Ostrzeżenie (telefon): częściowo pod nagłówkiem tylko `div.tabela-owijka`, bo jest wyższa niż okno — dozwolone w AA. **S2 nie potwierdzone.** |
| 320 px bez przewijania w bok | 1.4.10, 1.4.12, 2.1.1 | FAIL | FAIL | Bez odstępów: strona nie przewija się w bok, nic nie wychodzi poza ekran, długie nazwy (60 znaków) się zawijają; jedyny problem — owijka cennika bez `tabindex="0"` (S7). Z odstępami WCAG: strona przewija się w bok — S8. |
| odstępy WCAG nie ucinają treści | 1.4.12 | PASS | PASS | Przy oknie domyślnym i 320 px żaden nagłówek, akapit, wiersz grafiku ani nazwa produktu nie jest ucięty przez `overflow: hidden` (karta `.produkt` rośnie z treścią). |
| cele co najmniej 24 px | 2.5.8 | PASS | PASS | Linki „Facebook”, „Udostępnij na Facebooku” (22 px wysokości) i przycisk „Wyślij link” (27 px) spełniają wyjątek odstępu; linki w zdaniach pominięte zgodnie z wyjątkiem. |
| link skopiowany ogłaszany | 4.1.3 | FAIL | FAIL | Skrypt zmienia napis przycisku na „Link skopiowany”, ale napis nie jest w regionie `role="status"` / `aria-live` — czytnik tego nie ogłosi. S3. |
| menu dostępne na telefonie | — (dobra praktyka, poza AA) | FAIL | — (tylko telefon) | Z nagłówka Tab dochodzi tylko do „GRA-fit Fitness” i „Zapisz się”; żadna z 6 sekcji menu (`#zajecia` … `#kontakt`) nie jest osiągalna, brak przycisku menu. S4a (poza AA). |
| przejdź do treści | 2.4.1 | FAIL | FAIL | Pierwszy Tab trafia w „GRA-fit Fitness – strona główna”; linku „Przejdź do treści” nie ma. S4b. |
| kontrast kolorów strony | 1.4.3, 1.4.11 | FAIL | FAIL | Obrys `:focus-visible` `#6899cc`: 2,99:1 na `#ffffff`, 2,72:1 na `#f5f4f1` (min 3:1) — S1. Pozostałe pary przechodzą: `--tekst` 16,83 / 15,30, `--szary-tekst` 6,75 / 6,14, `--czarny` 18,88 / 17,17, „są miejsca” 5,70, „brak miejsc” 6,54, stopka `#999` na `#111` 6,63. |

Wynik: telefon 5 PASS / 5 FAIL, komputer 6 PASS / 4 FAIL (menu tylko na telefonie, 200% tylko na komputerze).

Potwierdzone znaleziska wstępne ze specu: **S1** (kontrast obrysu), **S3** w części „Link skopiowany” (ogłaszanie wczytania grafiku i sklepu oraz błędów pobierania — do sprawdzenia NVDA w Task 3; listy mają już `aria-live="polite"`), **S4** — brak „Przejdź do treści” (2.4.1); ukryte menu na telefonie potwierdzone jako problem wygody poza AA (S4a). **S2** nie potwierdzone testem (fokus nie chowa się pod nagłówkiem ani w przód, ani wstecz, także przy 200%).

## Znaleziska

| # | Kryterium | Znalezisko | Waga | Źródło | Status |
|---|---|---|---|---|---|
| S1 | 1.4.11 | Potwierdzone: obrys fokusu `#6899cc` ma 2,99:1 na `#ffffff` i 2,72:1 na `#f5f4f1` (wymagane 3:1). Obrys jest, ale słabo widoczny dla osób słabowidzących. | utrudnia | test `kontrast kolorów strony` | poprawione (4ac9a70): obrys `--czarny` 18,88:1 / 17,17:1, na stopce `#fff` |
| S2 | 2.4.11 | Nie potwierdzone: przy tabowaniu w przód i wstecz (telefon, komputer, 200%) fokus nigdy nie jest całkowicie pod nagłówkiem. Do ponownego sprawdzenia po zmianie nagłówka/menu (Task 4). | — | test `fokus niezasłonięty w obie strony` | nie dotyczy; po zmianach (przycisk „Menu”, „Przejdź do treści”) test nadal PASS |
| S3 | 4.1.3 | Potwierdzone w części: „Link skopiowany” zmienia tylko napis przycisku, poza regionem `role="status"` / `aria-live` — czytnik nie ogłasza. Wczytanie grafiku/sklepu i błędy: listy mają `aria-live="polite"`, ocena ogłaszania — NVDA (Task 3). | drobne | test `link skopiowany ogłaszany` | poprawione w części „Link skopiowany” (b7c589d, test 5c41bfc); ogłaszanie grafiku i sklepu — test NVDA gotowy (`testy/nvda/sciezka.spec.js`, asercja „NVDA ogłasza wczytany grafik”), jeszcze nieuruchomiony — sekcja „NVDA” |
| S4a | — (dobra praktyka, poza AA) | Potwierdzone: na ≤ 760 px menu `display: none` bez przycisku menu — z nagłówka nie da się przejść do żadnej z 6 sekcji (do treści można dojść tylko tabując przez całą stronę). **Nie jest niezgodnością WCAG 2.2 AA**: 2.4.5 dotyczy zbioru stron (strona jest jedna), 2.1.1 jest spełnione (test `klawiatura dochodzi do wszystkiego` — PASS), a obejście bloków (2.4.1) jest w S4b. Poprawiamy dla wygody, deklaracja tego nie wymienia jako niezgodności. | utrudnia (wygoda, nie zgodność) | test `menu dostępne na telefonie` | poprawione (6993f45, afe8e3d): przycisk „Menu” z `aria-expanded`/`aria-controls`, Esc, zwijanie po wyborze |
| S4b | 2.4.1 | Potwierdzone: brak linku „Przejdź do treści”; pierwszy Tab trafia w logo. Nagłówek ma 2 cele na telefonie i 8 na komputerze, więc obejście bloku dotyczy głównie komputera. | drobne | test `przejdź do treści` | poprawione (1b2d96e) |
| S7 | 2.1.1, 1.4.10 | Tabela cennika (`min-width: 520px`) jest szersza niż okno ≤ 520 px — telefon, a także komputer przy wąskim oknie albo powiększeniu 400% (1280 px / 4 = 320 px CSS; test `320 px bez przewijania w bok` na projekcie `komputer`: owijka 288 px, treść 520 px). Owijka `.tabela-owijka` (`overflow-x: auto`) nie ma `tabindex="0"`, roli ani nazwy. Chromium (od 130) i Firefox same dają fokus przewijanemu obszarowi (test widział Tab na `div.tabela-owijka` na telefonie), ale czytnik ogłasza go bez nazwy, a Safari nie daje fokusu wcale — bez myszy/dotyku nie da się tam przewinąć do kolumny „Na co”. Tabela danych jest wyjątkiem 1.4.10 (układ dwuwymiarowy), więc samo przewijanie tabeli jest dozwolone, o ile obszar jest dostępny z klawiatury. Do poprawy: `tabindex="0"`, `role="region"` i nazwa (np. `aria-labelledby` na nagłówek „Cennik”) albo układ tabeli mieszczący się w 320 px. | utrudnia | axe `scrollable-region-focusable` (telefon, wszystkie warianty); test `320 px bez przewijania w bok` (telefon i komputer) | poprawione (ef364b7): `tabindex="0"`, `role="region"`, `aria-labelledby` → „Cennik” |
| S8 | 1.4.10, 1.4.12 | Przy 320 px (telefon albo komputer z powiększeniem 400%) z odstępami tekstu WCAG cała strona przewija się w bok. Przyczyna: napisy bez zawijania rozpychają kolumnę — przycisk „Dopisz się do zajęć” (`.grafik__zapis`, `white-space: nowrap`) ma ok. 303 px przy 288 px miejsca, status „są miejsca” / „brak miejsc” (`.grafik__stan`, `nowrap`), a w kontakcie adres e-mail `gra.fit.fitness.krakow@gmail.com` (słowo bez miejsc podziału) — prawe krawędzie wychodzą 8–31 px poza ekran. Bez odstępów WCAG 320 px mieści się. Długie nazwy zajęć i produktów (60 znaków) zawijają się poprawnie. Do poprawy: zawijanie przycisku i statusu przy wąskim ekranie, `overflow-wrap: anywhere` dla adresu e-mail. | utrudnia | test `320 px bez przewijania w bok` (telefon i komputer) | poprawione (14556f9) |

## Po poprawkach (Task 4)

Data: 21.11.2026, gałąź `dostepnosc`. Polecenie: `npx playwright test` (bez `testy/nvda`).
Wynik: **28 PASS, 2 pominięte** (powiększenie 200% tylko na komputerze, menu zwijane tylko na telefonie), 0 FAIL.
Axe: 0 naruszeń w każdym wariancie (`pelne`, `puste`, `blad`) na telefonie i komputerze.
Nowy test: `menu na telefonie zamyka Esc i oddaje fokus` (320 px; także: przycisk ukryty przy 1280 px).
Poprawka testu: `link skopiowany ogłaszany` wymagał zmiany napisu przycisku — sprzeczne z planem (przycisk zachowuje nazwę), commit 5c41bfc.
Zrzuty przed/po i opis dla właścicielki: `docs/dostepnosc/zrzuty/`. NVDA (`npm run test:nvda`) — po Task 3.

## NVDA

Test: `testy/nvda/sciezka.spec.js`, konfiguracja `testy/nvda/playwright.config.js` (Chromium z oknem, 1 worker, limit 5 min, ten sam serwer co testy główne). Polecenie: `npm run test:nvda`. W CI pomijany (`testIgnore: 'nvda/**'`).

Ścieżka: grafik wstrzymany do chwili, gdy NVDA jest na stronie → po wczytaniu grafiku 4 s nasłuchu (czy region `aria-live="polite"` zostaje ogłoszony — otwarta część S3) → Ctrl+Home → nagłówki (H) do „Cennik” → tabela (T) z nagłówkiem „Co” → nagłówki wstecz (Shift+H) do „Najbliższe zajęcia” → linki (K) do pierwszego „Dopisz się”. Asercje na `spokenPhraseLog`: „Cennik”, „Co”, „Najbliższe zajęcia”, „Dopisz się do zajęć: Trening funkcjonalny” i „08:00” (godzina w Warszawie — dane testowe liczą przesunięcie strefy dla danej daty, a1d34b1). Ogłoszenie grafiku sprawdzane miękko (`expect.soft`), żeby wynik S3 nie zatrzymywał reszty ścieżki. Cała mowa zapisuje się do `test-results/nvda-spokenPhraseLog.txt`.

**Stan 21.11.2026: test nieuruchomiony — dwie blokady środowiska:**

1. Brak zasobów Guidepup: `@guidepup/guidepup` 0.40 uruchamia własną, przenośną kopię NVDA z `%LOCALAPPDATA%\guidepup\nvda\all\0.2.1-2026.3\extracted\nvda.exe`, a nie NVDA z `C:\Program Files\NVDA`. Po `npx @guidepup/setup setup` tej kopii nie ma — trzeba jeszcze, na komputerze Adeli: `npx @guidepup/setup install` (pobiera `guidepup-nvda-0.2.1-2026.3.zip` z GitHuba `guidepup/nvda`, sprawdza sumę SHA-256).
2. Chromium z oknem (`headless: false`) nie startuje w środowisku agenta (brak dostępu do pulpitu; bez okna startuje). Test trzeba uruchomić z własnego terminala Adeli.

Po uruchomieniu: wkleić tu `test-results/nvda-spokenPhraseLog.txt` z przebiegu zaliczonego, uwagi do niejasnej mowy i ewentualne znaleziska S9+, zaktualizować status S3.
