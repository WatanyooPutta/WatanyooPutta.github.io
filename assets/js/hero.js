(function () {
  var h = document.querySelector('.apl');
  if (!h) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { 
    h.classList.add('still'); 
    h.setAttribute('data-s', '0');
    return; 
  }

  var currentP = 0;
  var targetP = 0;
  var cachedTotal = 0;
  var lastState = -1;
  var rafId = null;
  var isInView = true;

  function measure() {
    var r = h.getBoundingClientRect();
    cachedTotal = r.height - window.innerHeight;
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function tick() {
    if (!isInView) return;

    currentP = lerp(currentP, targetP, 0.15);
    
    /* Rounded precision eliminates subpixel shaking */
    h.style.setProperty('--p', currentP.toFixed(4));

    var s = 0;
    if (currentP >= 0.28 && currentP < 0.55) {
      s = 1;
    } else if (currentP >= 0.55 && currentP < 0.81) {
      s = 2;
    } else if (currentP >= 0.81) {
      s = 3;
    }

    if (lastState !== s) {
      lastState = s;
      h.setAttribute('data-s', s);
    }

    if (Math.abs(targetP - currentP) > 0.0001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function onScroll() {
    if (!isInView) return;
    var r = h.getBoundingClientRect();
    if (cachedTotal > 0) {
      targetP = Math.min(1, Math.max(0, -r.top / cachedTotal));
    }
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  var observer = new IntersectionObserver(function(entries) {
    isInView = entries[0].isIntersecting;
    if (isInView && !rafId) {
      measure();
      onScroll();
    }
  }, { threshold: 0 });
  observer.observe(h);

  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    measure();
    onScroll();
  }, { passive: true });

  onScroll();
})();
