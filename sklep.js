// Gadżety reklamowe na żywo z aplikacji studia (publiczna lista produktów), z podziałem na grupy.
(function () {
  var APLIKACJA = 'https://grafit.adelahopek.pl';
  var lista = document.getElementById('lista-sklepu');
  var grupyEl = document.getElementById('sklep-grupy');
  if (!lista) return;
  var cena = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  var produkty = [];
  var wybrana = '';

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

  function pokaz() {
    lista.textContent = '';
    produkty.filter(function (p) { return !wybrana || p.group === wybrana; }).forEach(function (p) {
      var karta = el('article', 'produkt');
      if (p.image_url) {
        var img = document.createElement('img');
        img.src = APLIKACJA + p.image_url;
        img.alt = p.name;
        img.loading = 'lazy';
        karta.appendChild(img);
      }
      var tresc = el('div', 'produkt__tresc');
      if (p.group) tresc.appendChild(el('span', 'produkt__grupa', p.group));
      tresc.appendChild(el('h3', '', p.name));
      tresc.appendChild(el('span', 'produkt__cena', cena.format(p.price_gr / 100)));
      if (p.description) tresc.appendChild(el('p', 'produkt__opcje', p.description));
      if (p.sizes && p.sizes.length) tresc.appendChild(el('p', 'produkt__opcje', 'Rozmiary: ' + p.sizes.join(', ')));
      if (p.colors && p.colors.length) tresc.appendChild(el('p', 'produkt__opcje', 'Kolory: ' + p.colors.join(', ')));
      karta.appendChild(tresc);
      lista.appendChild(karta);
    });
  }

  function przyciski(grupy) {
    if (!grupyEl || grupy.length < 2) return;
    grupyEl.textContent = '';
    [''].concat(grupy).forEach(function (g) {
      var b = el('button', 'sklep__grupa', g || 'Wszystkie');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(g === wybrana));
      b.addEventListener('click', function () {
        wybrana = g;
        Array.prototype.forEach.call(grupyEl.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        pokaz();
      });
      grupyEl.appendChild(b);
    });
  }

  fetch(APLIKACJA + '/api/grafit/public/shop')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (dane) {
      produkty = dane || [];
      if (!produkty.length) { info('Gadżety pojawią się tu wkrótce. Zajrzyj do aplikacji.'); return; }
      var grupy = [];
      produkty.forEach(function (p) { if (p.group && grupy.indexOf(p.group) === -1) grupy.push(p.group); });
      przyciski(grupy);
      pokaz();
    })
    .catch(function () { info('Nie udało się wczytać gadżetów. Zobacz je w aplikacji.'); });
})();
