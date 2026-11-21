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

Axe nie mierzy kontrastu obrysu fokusu, zasłonięcia fokusu przez nagłówek, menu na telefonie ani ogłaszania komunikatów — S1–S4 sprawdzają testy zachowania (Task 2).

## Znaleziska

| # | Kryterium | Znalezisko | Waga | Źródło |
|---|---|---|---|---|
| S7 | 2.1.1 | Na telefonie tabela cennika jest szersza niż ekran, a owijka `.tabela-owijka` (`overflow-x: auto`) nie przyjmuje fokusu — bez myszy/dotyku nie da się przewinąć do kolumny „Na co”. Do poprawy: `tabindex="0"`, `role="region"` i nazwa (np. `aria-labelledby` na nagłówek „Cennik”) albo układ tabeli mieszczący się w 320 px. | utrudnia | axe `scrollable-region-focusable`, telefon, wszystkie warianty |
