(function () {
  var h = document.querySelector('.apl');
  if (!h) return;

  // Accessibility Guard: Clean up and exit immediately if user prefers reduced motion
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

  // Cache dimensions to avoid layout thrashing during scroll ticks
  function measure() {
    var r = h.getBoundingClientRect();
    cachedTotal = r.height - window.innerHeight;
  }

  // Linear Interpolation (lerp) for weightless momentum physics
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function tick() {
    if (!isInView) return;

    // Smoothly glide currentP towards targetP (factor 0.12 = Apple smooth physics)
    currentP = lerp(currentP, targetP, 0.12);
    h.style.setProperty('--p', currentP.toFixed(4));

    // Calculate active text narrative stage
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

    // Keep running RAF loop until target position is reached
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

  // IntersectionObserver: Pause GPU/CPU calculations when hero is off-screen
  var observer = new IntersectionObserver(function(entries) {
    isInView = entries[0].isIntersecting;
    if (isInView && !rafId) {
      measure();
      onScroll();
    }
  }, { threshold: 0 });
  observer.observe(h);

  // Desktop 3D Cursor Parallax Tilt (Fine pointers only)
  var stage = h.querySelector('.apl-stage');
  var photo = h.querySelector('.apl-photo');
  if (stage && photo && window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('mousemove', function(e) {
      var rect = stage.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      
      photo.style.transform = `
        translate3d(0, calc(var(--p, 0) * -5%), 0) 
        scale(calc(1 + var(--p, 0) * .06)) 
        rotateY(${x * 8}deg) 
        rotateX(${-y * 8}deg)
      `;
    });

    stage.addEventListener('mouseleave', function() {
      photo.style.transform = `translate3d(0, calc(var(--p, 0) * -5%), 0) scale(calc(1 + var(--p, 0) * .06))`;
      photo.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    stage.addEventListener('mouseenter', function() {
      photo.style.transition = 'filter 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  }

  // Handle Tab Visibility Changes (Battery preservation)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (isInView) {
      measure();
      onScroll();
    }
  });

  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    measure();
    onScroll();
  }, { passive: true });

  onScroll();
})();
