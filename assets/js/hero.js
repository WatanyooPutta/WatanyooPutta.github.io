(function () {
  var h = document.querySelector('.apl');
  if (!h) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { 
    h.classList.add('still'); 
    return; 
  }

  var ticking = false;
  var lastState = -1;

  function update() {
    ticking = false;
    var r = h.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    
    if (total <= 0) return;

    var p = Math.min(1, Math.max(0, -r.top / total));
    h.style.setProperty('--p', p.toFixed(4));

    var s = 0;
    if (p >= 0.28 && p < 0.55) {
      s = 1;
    } else if (p >= 0.55 && p < 0.81) {
      s = 2;
    } else if (p >= 0.81) {
      s = 3;
    }

    if (lastState !== s) {
      lastState = s;
      h.setAttribute('data-s', s);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  
  update();
})();
