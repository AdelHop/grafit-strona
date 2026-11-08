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
3. **Telefon, kod pocztowy, dzielnica, godziny otwarcia** – dopisać do sekcji Kontakt i do `address`/`telephone` w danych strukturalnych.
4. **Zdjęcia** – prawdziwe zdjęcia sali i zajęć (z podpisami `alt`) bardzo pomagają w Google i na Facebooku.
5. **Sprawdzić u właścicielki** – czy publikować adres e-mail, aktualność cen. (Studio jest dla wszystkich: teksty nie zawężają do kobiet, poza zajęciami dla kobiet w ciąży i Pelvi Balance.)

## Po publikacji

- Google Search Console: dodać domenę i wysłać `sitemap.xml`.
- Profil firmy w Google (Mapy): ten sam adres, nazwa i link do strony – najważniejsze dla wyszukiwań „fitness Kraków”.
- Link do strony w opisie profilu na Facebooku i Instagramie.
