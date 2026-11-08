// Najbliższe zajęcia na żywo z aplikacji studia (publiczny podgląd: nazwa, godzina, czy są miejsca).
(function () {
  var ADRES = 'https://app.grafit-fitness.pl/api/grafit/public/classes';
  var DNI = 7;
  var lista = document.getElementById('lista-grafiku');
  if (!lista) return;

  var dzien = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' });
  var godzina = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });

  function el(tag, klasa, tekst) {
    var e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst) e.textContent = tekst;
    return e;
  }

  function info(tekst) {
    lista.textContent = '';
    lista.appendChild(el('p', 'grafik__info', tekst));
  }

  fetch(ADRES)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (zajecia) {
      var granica = Date.now() + DNI * 24 * 3600 * 1000;
      var dni = {};
      var kolejnosc = [];
      zajecia.forEach(function (z) {
        var start = new Date(String(z.starts_at).replace(' ', 'T'));
        if (isNaN(start) || start.getTime() > granica) return;
        if (/\btest\b/i.test(z.nazwa)) return; // zajęcia testowe nie trafiają na stronę
        var klucz = dzien.format(start);
        if (!dni[klucz]) { dni[klucz] = []; kolejnosc.push(klucz); }
        dni[klucz].push({ start: start, nazwa: z.nazwa, miejsca: z.sa_miejsca });
      });
      if (!kolejnosc.length) { info('W najbliższych dniach nie ma jeszcze zajęć w grafiku. Zajrzyj do aplikacji.'); return; }
      lista.textContent = '';
      kolejnosc.forEach(function (klucz) {
        var blok = el('div', 'grafik__dzien');
        blok.appendChild(el('h3', '', klucz));
        dni[klucz].forEach(function (z) {
          var w = el('div', 'grafik__wiersz');
          w.appendChild(el('span', 'grafik__godz', godzina.format(z.start)));
          w.appendChild(el('span', '', z.nazwa));
          w.appendChild(el('span', z.miejsca ? 'grafik__stan' : 'grafik__stan grafik__stan--brak', z.miejsca ? 'są miejsca' : 'brak miejsc'));
          blok.appendChild(w);
        });
        lista.appendChild(blok);
      });
    })
    .catch(function () { info('Nie udało się wczytać grafiku. Pełny grafik jest w aplikacji.'); });

  // Udostępnianie linku znajomej (na telefonie otwiera menu udostępniania: WhatsApp, Messenger, Instagram…)
  var przycisk = document.getElementById('udostepnij');
  if (przycisk) {
    przycisk.addEventListener('click', function () {
      var dane = { title: 'GRA-fit Fitness', text: 'Studio treningowe dla kobiet w Krakowie – grupy do 7 osób', url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(dane).catch(function () {}); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dane.url).then(function () { przycisk.textContent = 'Link skopiowany'; });
      }
    });
  }
})();
