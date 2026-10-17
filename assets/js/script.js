(function () {
  var $ = function (s) { return document.querySelector(s); };
  // Safe listener: pages without a given element (for example the QR button) no longer break the rest of the script
  function on(sel, evt, fn, opt) { var el = $(sel); if (el) el.addEventListener(evt, fn, opt); }

  var dlg = $('#lightbox'), big = $('#big'), qr = $('#qr'), toastEl = $('#toast'), timer;
  function toast(m) { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(timer); timer = setTimeout(function () { toastEl.classList.remove('show'); }, 2500); }

  document.addEventListener('error', function (e) { var z = e.target.closest && e.target.closest('.zoom'); if (e.target.tagName === 'IMG' && z) z.hidden = true; }, true);

  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoom');
    if (z && dlg) { var i = z.querySelector('img'); big.src = i.currentSrc || i.src; big.alt = i.alt; dlg.showModal(); return; }
    if ((dlg && e.target === dlg) || (qr && e.target === qr) || e.target.closest('[data-close]')) { if (dlg && dlg.open) dlg.close(); if (qr && qr.open) qr.close(); }
  });

  // Contact card + QR (home page only)
  var VCARD = ['BEGIN:VCARD','VERSION:3.0','N:Putta;Watanyoo;;;','FN:Watanyoo Putta','TITLE:Medical Researcher','ORG:Khonkaenwittayayon School',
    'URL:https://watanyooputta.github.io/','URL:https://www.linkedin.com/in/watanyoo-putta/','URL:https://medium.com/@watanyoo.putta','END:VCARD'].join('\r\n');
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

  // Map (Research page only). One map, your latest pin positions, no extra CDN loading.
  if ($('#map') && typeof L !== 'undefined') {
    var map = L.map('map', { scrollWheelZoom: false }).setView([16.4322, 102.8236], 10);
    var tiles = L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4gfd_1_8f4a0c9e8b3d85a310477693', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    // If CARTO rejects the key (for example it expired), switch to OpenStreetMap so the map never goes blank
    var tileErrors = 0;
    tiles.on('tileerror', function () {
      if (++tileErrors === 3) {
        map.removeLayer(tiles);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      }
    });
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

  if ('serviceWorker' in navigator) addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
})();
