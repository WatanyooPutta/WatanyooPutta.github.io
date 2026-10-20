(function () {
  var $ = function (s) { return document.querySelector(s); };
  // Safe listener: pages without a given element (for example the QR button) no longer break the rest of the script
  function on(sel, evt, fn, opt) { var el = $(sel); if (el) el.addEventListener(evt, fn, opt); }

  var dlg = $('#lightbox'), big = $('#big'), qr = $('#qr'), toastEl = $('#toast'), timer;
  function toast(m) { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(timer); timer = setTimeout(function () { toastEl.classList.remove('show'); }, 2500); }

  document.addEventListener('error', function (e) { var z = e.target.closest && e.target.closest('.zoom'); if (e.target.tagName === 'IMG' && z) z.hidden = true; }, true);

  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoom');
    if (z && dlg) { var i = z.querySelector('img'); big.src = i.dataset.full || i.currentSrc || i.src; big.alt = i.alt; dlg.showModal(); return; }
    if ((dlg && e.target === dlg) || (qr && e.target === qr) || e.target.closest('[data-close]')) { if (dlg && dlg.open) dlg.close(); if (qr && qr.open) qr.close(); }
  });

  // Contact card + QR (home page only)
  var VCARD = ['BEGIN:VCARD','VERSION:3.0','N:Putta;Watanyoo;;;','FN:Watanyoo Putta','TITLE:Medical Researcher','ORG:Khonkaenwittayayon School',
    'URL:https://watanyooputta.com/','URL:https://www.linkedin.com/in/watanyoo-putta/','URL:https://medium.com/@watanyoo.putta','END:VCARD'].join('\r\n');
  function download() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([VCARD], { type: 'text/vcard' }));
    a.download = 'watanyoo-putta.vcf'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast('Contact file downloaded');
  }
  on('#vcard', 'click', download);
  on('#dl2', 'click', download);
  on('#qrbtn', 'click', function () {
    var box = $('#qrbox');
    if (!box.firstChild) {
      if (typeof qrcode === 'undefined') { toast('QR library is still loading, try again'); return; }
      var q = qrcode(0, 'M'); q.addData(VCARD); q.make(); box.innerHTML = q.createImgTag(5, 0);
      var im = box.querySelector('img'); if (im) im.alt = 'QR code containing the contact card of Watanyoo Putta';
    }
    qr.showModal();
  });

  // Citation copy (Research page only)
  on('#cite', 'click', function () {
    var c = 'Putta, W. (2022). The Effects of Industrial Noise on Human Mental Health and Well-being in Khonkaenwittayayon School. Zenodo. https://doi.org/10.5281/zenodo.23219819';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(function () { toast('Citation copied'); }, function () { toast('Copy failed'); });
    else toast('Copy is not supported in this browser');
  });

  // Reading progress bar and card spotlight
  var bar = $('#bar');
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
  });
  if (bar) addEventListener('scroll', function () { var h = document.documentElement; bar.style.transform = 'scaleX(' + (h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)) + ')'; }, { passive: true });

  // Callsign decode effect
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.call').forEach(function (el) {
    var t = el.dataset.t, abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', n, iv;
    function run() { if (still) return; clearInterval(iv); n = 0; iv = setInterval(function () { el.textContent = t.split('').map(function (ch, i) { return i < n ? ch : abc[Math.floor(Math.random() * 36)]; }).join(''); if (n >= t.length) { clearInterval(iv); el.textContent = t; } n += 1 / 3; }, 30); }
    el.addEventListener('mouseenter', run); el.addEventListener('touchstart', run, { passive: true });
  });

  // Clock (home page only)
  var clock = $('#clock');
  if (clock) {
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    var tick = function () { clock.textContent = fmt.format(new Date()); }; tick(); setInterval(tick, 1000);
  }

  // Map tiles: CARTO with your key, falling back to OpenStreetMap if CARTO refuses
  function addTiles(map) {
    var tiles = L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4gfd_1_8f4a0c9e8b3d85a310477693', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map), errs = 0;
    tiles.on('tileerror', function () {
      if (++errs === 3) {
        map.removeLayer(tiles);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      }
    });
  }

  // Map (Research page only). One map, your latest pin positions, no extra CDN loading.
  if ($('#map') && typeof L !== 'undefined') {
    var map = L.map('map', { scrollWheelZoom: false }).setView([16.4322, 102.8236], 10);
    addTiles(map);
    [['Tropical Disease Research Center', [16.4740, 102.8220], 'Khon Kaen University. Research internship affiliation and laboratory base.'],
     ['SatFinder_KKN_KKW (E25ZVB)', [16.4297, 102.8315], '433 MHz TinyGS satellite ground station, Khonkaenwittayayon School.'],
     ['Lawa Model Site', [16.0350, 102.7300], 'Field research location: epidemiological fieldwork and community health engagement.']].forEach(function (p) {
      var m = L.marker(p[1], { title: p[0] }).addTo(map);
      m.bindTooltip('<b>' + p[0] + '</b>', { permanent: true, direction: 'top', offset: [0, -28], className: 'map-marker-label' });
      m.bindPopup('<strong>' + p[0] + '</strong><br>' + p[2]);
    });
    setTimeout(function () { map.invalidateSize(); }, 300);
  }

  // Scroll reveal for cards and tiles
  if (!still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.card,.tile').forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  // Quote that zooms in as you scroll it to the middle of the screen
  var zs = [].slice.call(document.querySelectorAll('[data-zoom]')), ticking = false;
  function zoomUpdate() {
    ticking = false; var vh = innerHeight;
    zs.forEach(function (z) {
      var r = z.getBoundingClientRect();
      var d = Math.abs((r.top + r.height / 2) - vh / 2) / (vh * 0.65);
      z.style.setProperty('--p', (still ? 1 : Math.max(0, 1 - d)).toFixed(3));
    });
  }
  if (zs.length) {
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(zoomUpdate); } }, { passive: true });
    addEventListener('resize', zoomUpdate); zoomUpdate();
  }

  // Research page filter chips
  var fb = document.querySelectorAll('[data-f]');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f;
      fb.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-cat]').forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.cat === f); });
      if (typeof map !== 'undefined' && map) setTimeout(function () { map.invalidateSize(); }, 60);
    });
  });

  // ===== One Health network (home) =====
  var oh = $('#oh');
  if (oh) {
    var ctx = oh.getContext('2d'), W, H, dpr, parts = [], act = -1, ptr = null, raf = 0, vis = true, fr = 0, cA = '#3ee0b5', cT = '#ececf1';
    var NODES = [
      { l: 'Human', x: .5, y: .27, t: 'Human health: first aid, EMS and prehospital care.', a: '/emergency/', b: 'See Emergency & First Aid' },
      { l: 'Animal', x: .2, y: .74, t: 'Animal health: fish and snails are hosts in the liver fluke life cycle.', a: '/research/#lifecycle', b: 'See the life cycle' },
      { l: 'Environment', x: .8, y: .74, t: 'Environmental health: lakes, water and communities, as at the Lawa field site.', a: '/research/#lifecycle', b: 'See the Lawa Model' }
    ];
    var ohBtns = document.querySelectorAll('.oh-btn');
    function colors() { var s = getComputedStyle(document.documentElement); cA = s.getPropertyValue('--accent').trim() || cA; cT = s.getPropertyValue('--text').trim() || cT; }
    function ohSet(i) {
      act = i; var n = NODES[i];
      $('#oh-text').textContent = n.t;
      var a = $('#oh-link'); a.textContent = n.b + ' \u2192'; a.href = n.a; a.hidden = false;
      ohBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (still) ohDraw();
    }
    function ohSize() {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = oh.clientWidth; H = oh.clientHeight;
      oh.width = W * dpr; oh.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var N = W < 500 ? 22 : 38; parts = [];
      for (var i = 0; i < N; i++) { var k = i % 3, n = NODES[k]; parts.push({ k: k, x: n.x * W + (Math.random() - .5) * 120, y: n.y * H + (Math.random() - .5) * 120, vx: 0, vy: 0 }); }
      colors(); ohDraw();
    }
    function ohDraw() {
      fr++; if (fr % 40 === 0) colors();
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      var i, j, p, q, n, d;
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; n = NODES[p.k];
        if (!still) {
          p.vx += (n.x * W - p.x) * .0009 + (Math.random() - .5) * .08; p.vy += (n.y * H - p.y) * .0009 + (Math.random() - .5) * .08;
          if (ptr) { var dx = p.x - ptr.x, dy = p.y - ptr.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 110 && dd > 0) { p.vx += dx / dd * .6; p.vy += dy / dd * .6; } }
          p.vx *= .96; p.vy *= .96; p.x += p.vx; p.y += p.vy;
        }
      }
      ctx.strokeStyle = cA; ctx.fillStyle = cA;
      ctx.globalAlpha = .22; ctx.beginPath();
      for (i = 0; i < 3; i++) { ctx.moveTo(NODES[i].x * W, NODES[i].y * H); ctx.lineTo(NODES[(i + 1) % 3].x * W, NODES[(i + 1) % 3].y * H); }
      ctx.stroke();
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; n = NODES[p.k];
        d = Math.hypot(p.x - n.x * W, p.y - n.y * H);
        ctx.globalAlpha = Math.max(0, .35 - d / 420); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x * W, n.y * H); ctx.stroke();
        for (j = i + 1; j < parts.length; j++) {
          q = parts[j]; d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 70) { ctx.globalAlpha = (1 - d / 70) * .35; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.3); ctx.fill();
      }
      for (i = 0; i < 3; i++) {
        n = NODES[i]; var x = n.x * W, y = n.y * H, on = i === act, pulse = on && !still ? 4 * Math.sin(fr / 10) : 0;
        ctx.globalAlpha = on ? .28 : .12; ctx.beginPath(); ctx.arc(x, y, 38 + pulse, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 24, 0, 6.3); ctx.fillStyle = on ? cA : 'rgba(10,12,16,.85)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = cA; ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = cA;
        ctx.font = '600 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = cT; ctx.fillText(n.l, x, y + 48); ctx.fillStyle = cA;
      }
      ctx.globalAlpha = 1;
    }
    function ohLoop() { if (!vis || document.hidden) { raf = 0; return; } ohDraw(); raf = requestAnimationFrame(ohLoop); }
    function ohStart() { if (!still && !raf) raf = requestAnimationFrame(ohLoop); }
    function ohPos(e) { var r = oh.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    oh.addEventListener('pointermove', function (e) { ptr = ohPos(e); });
    oh.addEventListener('pointerleave', function () { ptr = null; });
    oh.addEventListener('click', function (e) {
      var p = ohPos(e);
      NODES.forEach(function (n, i) { if (Math.hypot(p.x - n.x * W, p.y - n.y * H) < 42) ohSet(i); });
    });
    ohBtns.forEach(function (b) { b.addEventListener('click', function () { ohSet(+b.dataset.i); }); });
    addEventListener('resize', ohSize);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) ohStart(); }).observe(oh);
    document.addEventListener('visibilitychange', ohStart);
    ohSize(); ohStart();
  }

  // ===== Liver fluke life cycle (research) =====
  var lc = $('#lc');
  if (lc) {
    var ST = [
      ['Eggs', 'Eggs in water', 'Eggs leave the body in stool. Where sanitation is poor they reach ponds, canals and lakes.', 'Control point: safe toilets and sanitation keep eggs out of the water.'],
      ['Snail', 'Snail host', 'Bithynia snails eat the eggs. Inside the snail the parasite multiplies and larvae (cercariae) are released into the water.', 'Control point: managing the habitats around the water.'],
      ['Fish', 'Freshwater fish', 'Larvae burrow into freshwater fish (cyprinids) and form tiny cysts, called metacercariae, in the flesh.', 'Control point: fish handling and farming practices.'],
      ['People', 'People eat raw fish', 'Eating raw or undercooked fish swallows live cysts. Cats and dogs can carry the parasite too.', 'Control point: health education, thorough cooking, and treating pets.'],
      ['Flukes', 'Adult flukes in the bile ducts', 'The cysts grow into adult flukes in the liver bile ducts and lay eggs. Long-term infection raises the risk of bile duct cancer.', 'Control point: screening and treatment, which also stops new eggs.']
    ];
    var cx = 200, cy = 190, R = 130, g = '<circle class="ring" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>';
    ST.forEach(function (s, i) {
      var a = (-90 + i * 72) * Math.PI / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      g += '<g class="st" tabindex="0" role="button" aria-label="Stage ' + (i + 1) + ': ' + s[1] + '" data-i="' + i + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="30"/><text class="n" x="' + x.toFixed(1) + '" y="' + (y + 5).toFixed(1) + '">' + (i + 1) + '</text><text class="l" x="' + x.toFixed(1) + '" y="' + (y + 48).toFixed(1) + '">' + s[0] + '</text></g>';
    });
    lc.innerHTML = g;
    var stg = lc.querySelectorAll('.st'), timer2 = 0, cur = -1;
    function lcSet(i) {
      cur = i; stg.forEach(function (n, k) { n.classList.toggle('on', k === i); });
      $('#lc-t').textContent = (i + 1) + '. ' + ST[i][1]; $('#lc-d').textContent = ST[i][2];
      var c = $('#lc-c'); c.textContent = ST[i][3]; c.hidden = false;
    }
    function lcStop() { clearInterval(timer2); timer2 = 0; $('#lc-play').textContent = 'Play the cycle'; }
    stg.forEach(function (n) {
      n.addEventListener('click', function () { lcStop(); lcSet(+n.dataset.i); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lcStop(); lcSet(+n.dataset.i); } });
    });
    on('#lc-play', 'click', function () {
      if (timer2) { lcStop(); return; }
      $('#lc-play').textContent = 'Pause'; lcSet((cur + 1) % ST.length);
      timer2 = setInterval(function () { lcSet((cur + 1) % ST.length); }, 3200);
    });
  }

  // ===== Morse callsign (tap it) =====
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  var actx = null;
  document.querySelectorAll('.call').forEach(function (el) {
    var word = el.dataset.t, busy = false, label = document.createElement('span'); label.className = 'morse'; label.setAttribute('aria-hidden', 'true');
    label.textContent = word.split('').map(function (c) { return MORSE[c] || ''; }).join('  ');
    el.parentNode.insertBefore(label, el.nextSibling);
    el.addEventListener('click', function () {
      if (busy) return; busy = true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !actx) { try { actx = new AC(); } catch (e) { actx = null; } }
      var t = 0, U = 90; // one dot = 90 ms
      word.split('').forEach(function (ch, ci) {
        (MORSE[ch] || '').split('').forEach(function (sym) {
          var len = sym === '.' ? U : U * 3, st = t;
          setTimeout(function () {
            if (!still) el.classList.add('on');
            if (actx) { try { var o = actx.createOscillator(), gn = actx.createGain(); o.frequency.value = 650; gn.gain.value = .04; o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime + len / 1000); } catch (e) {} }
          }, st);
          setTimeout(function () { el.classList.remove('on'); }, st + len);
          t += len + U;
        });
        t += U * 2;
      });
      setTimeout(function () { busy = false; el.classList.remove('on'); }, t + 100);
    });
  });

  // ===== Sky that follows Khon Kaen time =====
  var skyFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false });
  function sky() {
    var h = parseInt(skyFmt.format(new Date()), 10) % 24, s = h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night';
    document.documentElement.setAttribute('data-sky', s);
    var L = { dawn: 'Dawn in Khon Kaen', day: 'Daytime in Khon Kaen', dusk: 'Dusk in Khon Kaen', night: 'Night in Khon Kaen' }, el = $('#sky-label'); if (el) el.textContent = L[s];
  }
  sky(); setInterval(sky, 60000);

  // ===== Lawa scrollytelling =====
  var sm = $('#story-map');
  if (sm && typeof L !== 'undefined') {
    var smap = L.map('story-map', { scrollWheelZoom: false, zoomControl: false, dragging: !L.Browser.mobile, tap: false }).setView([16.4740, 102.8220], 11);
    addTiles(smap);
    [['Tropical Disease Research Center', [16.4740, 102.8220]], ['Lawa Model Site', [16.0350, 102.7300]]].forEach(function (p) {
      L.marker(p[1], { title: p[0] }).addTo(smap).bindTooltip('<b>' + p[0] + '</b>', { permanent: true, direction: 'top', offset: [0, -28], className: 'map-marker-label' });
    });
    var steps = document.querySelectorAll('.step');
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          steps.forEach(function (s) { s.classList.toggle('active', s === e.target); });
          var d = e.target.dataset;
          if (d.lat) { var ll = [+d.lat, +d.lng]; if (still) smap.setView(ll, +d.zoom, { animate: false }); else smap.flyTo(ll, +d.zoom, { duration: 2 }); }
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { so.observe(s); });
    }
    setTimeout(function () { smap.invalidateSize(); }, 300);
  }

  // ===== Story reels =====
  var rl = $('#reel'), rdata = $('#reel-data');
  if (rl && rdata) {
    var RD = {}, cur = null, ri = 0, bars = $('#reel-bars'), rimg = $('#reel-img'), rcap = $('#reel-cap');
    try { RD = JSON.parse(rdata.textContent); } catch (e) {}
    var rshow = function (i) {
      var s = RD[cur].slides; if (i < 0) i = 0; if (i >= s.length) { rl.close(); return; }
      ri = i; rimg.src = rl.dataset.base + s[i].img + '.webp'; rimg.alt = s[i].cap; rcap.textContent = s[i].cap;
      [].forEach.call(bars.children, function (b, k) { b.className = k < i ? 'done' : ''; });
      var cb = bars.children[i]; void cb.offsetWidth; cb.className = 'on';
    };
    var ropen = function (id) {
      if (!RD[id]) return; cur = id; bars.innerHTML = '';
      RD[id].slides.forEach(function () { var b = document.createElement('b'); b.appendChild(document.createElement('i')); bars.appendChild(b); });
      rl.showModal(); rshow(0);
    };
    document.addEventListener('click', function (e) { var b = e.target.closest('.reel-btn'); if (b) ropen(b.dataset.reel); });
    bars.addEventListener('animationend', function (e) { if (e.target.tagName === 'I') rshow(ri + 1); });
    $('#reel-next').addEventListener('click', function () { rshow(ri + 1); });
    $('#reel-prev').addEventListener('click', function () { rshow(ri - 1); });
    $('#reel-x').addEventListener('click', function () { rl.close(); });
    rl.addEventListener('pointerdown', function () { rl.classList.add('paused'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { rl.addEventListener(ev, function () { rl.classList.remove('paused'); }); });
    rl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') rshow(ri + 1); else if (e.key === 'ArrowLeft') rshow(ri - 1); });
    rl.addEventListener('click', function (e) { if (e.target === rl) rl.close(); });
  }

  // ===== Holographic credential cards =====
  document.querySelectorAll('.holo').forEach(function (h) {
    h.addEventListener('pointermove', function (e) {
      var r = h.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      h.style.setProperty('--hx', (px * 100) + '%'); h.style.setProperty('--hy', (py * 100) + '%'); h.classList.add('live');
      if (!still) h.style.transform = 'perspective(700px) rotateX(' + ((.5 - py) * 8).toFixed(1) + 'deg) rotateY(' + ((px - .5) * 10).toFixed(1) + 'deg)';
    });
    ['pointerleave', 'pointercancel'].forEach(function (ev) { h.addEventListener(ev, function () { h.classList.remove('live'); h.style.transform = ''; }); });
  });

  // ===== Magnifier in the photo viewer =====
  var lens = $('#lens'), lbtn = $('#lens-btn'), lensOn = false;
  if (dlg && lens && lbtn) {
    var Z = 2.6, S = 140;
    lbtn.addEventListener('click', function () {
      lensOn = !lensOn; lbtn.setAttribute('aria-pressed', lensOn ? 'true' : 'false'); lbtn.textContent = lensOn ? 'Magnifier: on' : 'Magnifier';
      big.style.touchAction = lensOn ? 'none' : ''; if (!lensOn) lens.style.display = 'none';
    });
    var lmove = function (e) {
      if (!lensOn) return;
      var r = big.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { lens.style.display = 'none'; return; }
      var d = dlg.getBoundingClientRect(), off = e.pointerType === 'touch' ? -(S / 2 + 28) : 0;
      lens.style.display = 'block'; lens.style.backgroundImage = 'url("' + big.src + '")';
      lens.style.backgroundSize = (r.width * Z) + 'px ' + (r.height * Z) + 'px';
      lens.style.backgroundPosition = (-(x * Z - S / 2)) + 'px ' + (-(y * Z - S / 2)) + 'px';
      lens.style.left = (e.clientX - d.left - S / 2) + 'px'; lens.style.top = (e.clientY - d.top - S / 2 + off) + 'px';
    };
    big.addEventListener('pointermove', lmove); big.addEventListener('pointerdown', lmove);
    big.addEventListener('pointerleave', function () { lens.style.display = 'none'; });
    dlg.addEventListener('close', function () { lens.style.display = 'none'; lensOn = false; lbtn.setAttribute('aria-pressed', 'false'); lbtn.textContent = 'Magnifier'; big.style.touchAction = ''; });
  }

  // ===== Journey timeline progress =====
  var tl = $('#tl'), tf = $('#tl-fill');
  if (tl && tf) {
    var tlUpdate = function () { var m = tl.scrollWidth - tl.clientWidth; tf.style.setProperty('--tp', (m > 0 ? 6 + (tl.scrollLeft / m) * 94 : 100) + '%'); tf.style.width = ''; tf.parentNode.style.setProperty('--tp', (m > 0 ? 6 + (tl.scrollLeft / m) * 94 : 100) + '%'); };
    tl.addEventListener('scroll', tlUpdate, { passive: true }); addEventListener('resize', tlUpdate); tlUpdate();
  }

  // ===== Cinematic intro (first visit per session) =====
  var intro = $('#intro');
  if (intro && document.documentElement.classList.contains('has-intro')) {
    var left = false;
    var leave = function () {
      if (left) return; left = true; intro.classList.add('out');
      try { sessionStorage.setItem('intro', '1'); } catch (e) {}
      setTimeout(function () { document.documentElement.classList.remove('has-intro'); }, 1000);
    };
    setTimeout(leave, 3500);
    intro.addEventListener('click', leave);
    document.addEventListener('keydown', function (e) { if (!left && (e.key === 'Escape' || e.key === 'Enter')) leave(); });
  }

  // ===== Copy buttons (media kit) =====
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.dataset.copy).innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied'); }, function () { toast('Copy failed'); });
      else toast('Copy is not supported in this browser');
    });
  });

  // ===== Search / command palette (Ctrl or Command + K) =====
  var cmd = $('#cmd'), cdata = $('#cmd-data');
  if (cmd && cdata) {
    var items = [], cin = $('#cmd-in'), clist = $('#cmd-list'), sel = 0, shown = [];
    try { items = JSON.parse(cdata.textContent); } catch (e) {}
    var go = function (i) { if (!i) return; if (i.k === 'profile') window.open(i.u, '_blank', 'noopener'); else location.href = i.u; };
    var mark = function () { [].forEach.call(clist.children, function (li, n) { li.classList.toggle('on', n === sel); li.setAttribute('aria-selected', n === sel ? 'true' : 'false'); }); };
    var render = function (q) {
      q = q.trim().toLowerCase(); sel = 0; clist.innerHTML = '';
      shown = items.filter(function (i) { return !q || i.t.toLowerCase().indexOf(q) > -1 || i.k.indexOf(q) > -1; }).slice(0, 12);
      shown.forEach(function (i) {
        var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('em');
        li.setAttribute('role', 'option'); a.textContent = i.t; b.textContent = i.k === 'profile' ? 'profile \u2197' : i.k;
        li.appendChild(a); li.appendChild(b); li.addEventListener('click', function () { go(i); }); clist.appendChild(li);
      });
      if (!shown.length) { var none = document.createElement('li'); none.className = 'none'; none.textContent = 'No results'; clist.appendChild(none); }
      mark();
    };
    var openCmd = function () { cin.value = ''; render(''); if (!cmd.open) cmd.showModal(); cin.focus(); };
    on('#cmd-open', 'click', openCmd);
    cin.addEventListener('input', function () { render(cin.value); });
    cin.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
    });
    cmd.addEventListener('click', function (e) { if (e.target === cmd) cmd.close(); });
    document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); } });
  }

  if ('serviceWorker' in navigator) addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
})();
