(function () {
  var h = document.querySelector('.apl');
  if (!h) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { h.classList.add('still'); return; }
  var ticking = false;
  function update() {
    ticking = false;
    var r = h.getBoundingClientRect(), total = r.height - innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    h.style.setProperty('--p', p.toFixed(4));
    var s = p < 0.26 ? 0 : p < 0.54 ? 1 : p < 0.8 ? 2 : 3;
    if (h.getAttribute('data-s') !== String(s)) h.setAttribute('data-s', s);
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
