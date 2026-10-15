(function () {
  var $ = function (s) { return document.querySelector(s); };
  var dlg = $('#lightbox'), big = $('#big'), qr = $('#qr'), toastEl = $('#toast'), timer;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(timer); timer = setTimeout(function () { toastEl.classList.remove('show'); }, 2500); }

  document.addEventListener('error', function (e) { var z = e.target.closest && e.target.closest('.zoom'); if (e.target.tagName === 'IMG' && z) z.hidden = true; }, true);

  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoom');
    if (z) { var i = z.querySelector('img'); big.src = i.currentSrc || i.src; big.alt = i.alt; dlg.showModal(); return; }
    if (e.target === dlg || e.target === qr || e.target.closest('[data-close]')) { if (dlg.open) dlg.close(); if (qr.open) qr.close(); }
  });

  var VCARD = ['BEGIN:VCARD','VERSION:3.0','N:Putta;Watanyoo;;;','FN:Watanyoo Putta','TITLE:Medical Researcher','ORG:Khonkaenwittayayon School',
    'URL:https://watanyooputta.github.io/','URL:https://www.linkedin.com/in/watanyoo-putta/','URL:https://medium.com/@watanyoo.putta','END:VCARD'].join('\r\n');
  function download() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([VCARD], { type: 'text/vcard' }));
    a.download = 'watanyoo-putta.vcf'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast('Contact file downloaded');
  }
  $('#vcard').addEventListener('click', download);
  $('#dl2').addEventListener('click', download);
  $('#qrbtn').addEventListener('click', function () {
    var box = $('#qrbox');
    if (!box.firstChild) {
      if (typeof qrcode === 'undefined') { toast('QR library is still loading, try again'); return; }
      var q = qrcode(0, 'M'); q.addData(VCARD); q.make(); box.innerHTML = q.createImgTag(5, 0);
      var im = box.querySelector('img'); if (im) im.alt = 'QR code containing the contact card of Watanyoo Putta';
    }
    qr.showModal();
  });

  $('#cite').addEventListener('click', function () {
    var c = 'Putta, W. (2022). The Effects of Industrial Noise on Human Mental Health and Well-being in Khonkaenwittayayon School. Zenodo. https://doi.org/10.5281/zenodo.23219819';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(function () { toast('Citation copied'); }, function () { toast('Copy failed'); });
    else toast('Copy is not supported in this browser');
  });

  var bar = $('#bar');
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
  });
  addEventListener('scroll', function () { var h = document.documentElement; bar.style.transform = 'scaleX(' + (h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)) + ')'; }, { passive: true });

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.call').forEach(function (el) {
    var t = el.dataset.t, abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', n, iv;
    function run() { if (still) return; clearInterval(iv); n = 0; iv = setInterval(function () { el.textContent = t.split('').map(function (ch, i) { return i < n ? ch : abc[Math.floor(Math.random() * 36)]; }).join(''); if (n >= t.length) { clearInterval(iv); el.textContent = t; } n += 1 / 3; }, 30); }
    el.addEventListener('mouseenter', run); el.addEventListener('touchstart', run, { passive: true });
  });

  var clock = $('#clock'), fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function tick() { clock.textContent = fmt.format(new Date()); } tick(); setInterval(tick, 1000);

  // Map: Leaflet loads only when the map scrolls near the viewport
  var LV = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/', mapEl = $('#map'), started = false;
  function drawMap() {
    var map = L.map('map', { scrollWheelZoom: false }).setView([16.4692, 102.8290], 11);
    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', maxZoom: 19 }).addTo(map);
    [['Tropical Disease Research Center', [16.4692, 102.8290], 'Research internship affiliation & laboratory base.'],
     ['SatFinder_KKN_KKW (E25ZVB)', [16.4336, 102.8355], '433 MHz TinyGS satellite ground station.'],
     ['Lawa Model', [16.2850, 102.5833], 'Epidemiological fieldwork & community health engagement.']].forEach(function (p) {
      var m = L.marker(p[1], { title: p[0] }).addTo(map);
      m.bindTooltip('<b>' + p[0] + '</b>', { permanent: true, direction: 'top', offset: [0, -28], className: 'map-marker-label' });
      m.bindPopup('<strong>' + p[0] + '</strong><br>' + p[2]);
    });
    setTimeout(function () { map.invalidateSize(); }, 300);
  }
  function initMap() {
    if (started) return; started = true;
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LV + 'leaflet.min.css'; document.head.appendChild(css);
    var js = document.createElement('script'); js.src = LV + 'leaflet.min.js'; js.onload = drawMap; document.body.appendChild(js);
  }
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { initMap(); ob.disconnect(); } }, { rootMargin: '300px' }).observe(mapEl); } else { initMap(); }
  if ('serviceWorker' in navigator) addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
})();
