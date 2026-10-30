(function () {
  var root = document.documentElement;
  // Saved theme (runs before the page paints, so there is no flash)
  try { var s = localStorage.getItem('theme'); if (s) root.setAttribute('data-theme', s); } catch (e) {}
  // Intro: first visit of each session, unless the visitor prefers reduced motion
  try {
    if (document.querySelector('meta[name="intro"]') && !sessionStorage.getItem('intro') && !matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('has-intro');
  } catch (e) {}

  function toggleTheme() {
    var c = root.getAttribute('data-theme');
    if (!c) c = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var n = c === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem('theme', n); } catch (e) {}
  }
  window.toggleTheme = toggleTheme;

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (b) b.addEventListener('click', toggleTheme);
    document.querySelectorAll('[data-print]').forEach(function (p) { p.addEventListener('click', function () { window.print(); }); });

    // Majestic quote: the words appear one by one, at a fixed size
    var sec = document.querySelector('.regal'), q = document.querySelector('.regal-quote');
    if (!sec || !q) return;
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      var words = q.textContent.trim().split(/\s+/);
      q.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span'); s.className = 'w'; s.style.transitionDelay = (i * 90) + 'ms'; s.textContent = w;
        q.appendChild(s); q.appendChild(document.createTextNode(' '));
      });
    }
    if (!still && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { sec.classList.add('in'); ob.disconnect(); } }, { threshold: 0.3 }).observe(sec);
    } else { sec.classList.add('in'); }
  });
})();
