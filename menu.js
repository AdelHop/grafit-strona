// Menu na telefonie: przycisk „Menu” rozwija listę sekcji; Esc albo wybór sekcji ją zwija.
(function () {
  var przycisk = document.querySelector('.menu-przycisk');
  var menu = document.getElementById('menu');
  if (!przycisk || !menu) return;
  przycisk.hidden = false;

  function ustaw(otwarte) {
    przycisk.setAttribute('aria-expanded', String(otwarte));
    menu.classList.toggle('menu--otwarte', otwarte);
  }
  function otwarte() { return przycisk.getAttribute('aria-expanded') === 'true'; }

  przycisk.addEventListener('click', function () { ustaw(!otwarte()); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) ustaw(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && otwarte()) { ustaw(false); przycisk.focus(); }
  });
  // Fokus wychodzi poza przycisk i menu (Tab dalej, klik w treść) — menu się zwija, żeby nie zasłaniać strony.
  function pozaMenu(cel) { return cel && !przycisk.contains(cel) && !menu.contains(cel); }
  document.addEventListener('focusin', function (e) { if (otwarte() && pozaMenu(e.target)) ustaw(false); });
  document.addEventListener('click', function (e) { if (otwarte() && pozaMenu(e.target)) ustaw(false); });
})();
