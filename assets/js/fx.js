(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer: fine)').matches;

  // 1. Headings "decode" once, the first time you scroll to them (the real text is always in the page for Google)
  if (!still && 'IntersectionObserver' in window) {
    var abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var decode = function (el) {
      var t = el.dataset.txt, i = 0;
      var iv = setInterval(function () {
        el.textContent = t.split('').map(function (c, k) { return c === ' ' || k < i ? c : abc[Math.floor(Math.random() * abc.length)]; }).join('');
        if (i >= t.length) { clearInterval(iv); el.textContent = t; }
        i += 0.5;
      }, 28);
    };
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); decode(e.target); } }); }, { threshold: 0.6 });
    document.querySelectorAll('main h2').forEach(function (h) {
      if (h.children.length || /[^\x00-\x7F]/.test(h.textContent) || h.closest('.tile')) return;
      h.dataset.txt = h.textContent; io.observe(h);
    });
  }

  // 2. Tiny haptic tick on buttons (Android phones)
  document.addEventListener('click', function (e) { if (e.target.closest('.btn') && navigator.vibrate) navigator.vibrate(8); });

  // 3. Desktop only: magnetic buttons, cursor glow, depth on photo tiles
  if (!still && fine) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    var g = document.createElement('div'); g.id = 'cursor-glow'; document.body.appendChild(g);
    addEventListener('pointermove', function (e) { g.style.transform = 'translate(' + (e.clientX - 210) + 'px,' + (e.clientY - 210) + 'px)'; g.style.opacity = 1; }, { passive: true });
    document.querySelectorAll('.tile').forEach(function (t) {
      var im = t.querySelector('img');
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        if (im) im.style.transform = 'scale(1.09) translate(' + (px * -16).toFixed(1) + 'px,' + (py * -16).toFixed(1) + 'px)';
      });
      t.addEventListener('pointerleave', function () { if (im) im.style.transform = ''; });
    });
  }
})();
