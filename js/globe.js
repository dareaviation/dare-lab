/*!
 * DARE Lab — member network globe
 * ------------------------------------------------------------------
 * Renders a dotted Earth with the lab's member locations (labelled by
 * the nearest airport's IATA code) connected by animated great-circle
 * links. Dependency-free, retina-aware, pauses when off-screen and
 * respects `prefers-reduced-motion`.
 *
 * To add a location, append it to NODES below (lat/lon in degrees) and
 * connect it in LINKS. `lx/ly` place the label relative to the node.
 */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-globe]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DEG = Math.PI / 180;
  var TAU = Math.PI * 2;

  /* ---------------------------------------------------------------
   * Member locations (nearest airport, IATA)
   * ------------------------------------------------------------- */
  var NODES = [
    { code: 'SZF', city: 'Samsun',    lat: 41.29, lon: 36.33,   lx: -10, ly: -34, align: 'right' },
    { code: 'AOE', city: 'Eskişehir', lat: 39.78, lon: 30.52,   lx: -36, ly: 2,   align: 'right' },
    { code: 'ERC', city: 'Erzincan',  lat: 39.75, lon: 39.49,   lx: 34,  ly: -20, align: 'left' },
    { code: 'EZS', city: 'Elazığ',    lat: 38.68, lon: 39.22,   lx: 34,  ly: 20,  align: 'left' },
    { code: 'HND', city: 'Tokyo',     lat: 35.71, lon: 139.76,  lx: 28,  ly: -22, align: 'left' },
    { code: 'PUB', city: 'Pueblo',    lat: 38.25, lon: -104.61, lx: -28, ly: -22, align: 'right' }
  ];

  var LINKS = [
    ['AOE', 'SZF'], ['SZF', 'ERC'], ['EZS', 'AOE'],
    ['SZF', 'HND'], ['AOE', 'PUB'], ['HND', 'PUB'],
    ['EZS', 'HND'], ['SZF', 'PUB']
  ];

  /* ---------------------------------------------------------------
   * Land mask: equal-area rows every 1.6° (generated from the GLOBE
   * land/sea mask). One bit per cell, row lengths listed in ROWS.
   * ------------------------------------------------------------- */
  var LAND_STEP = 1.6;
  var LAND_LAT0 = 82.4;
  var LAND_ROWS = [30,36,42,48,54,61,67,73,78,84,90,96,101,107,113,118,123,128,134,139,143,148,153,157,162,166,170,174,178,182,186,189,192,196,199,202,204,207,209,211,213,215,217,219,220,221,222,223,224,224,225,225,225,225,224,224,223,222,221,220,219,217,215,213,211,209,207,204,202,199,196,192,189,186,182,178,174,170,166,162,157,153,148,143,139,134,128];
  var LAND_BITS = 'ANgAAAP+BkAADfiAIAAB/8IAAAAD4/AAhwgAEIH4ACHwAAB7w/AAJ/+gIgefH8AAT//8Afd9Y/gDgX///c//L3PwA//////+v//554AH//////6f//+8cGA///////4f//9nHAAP///////w///8MBgAHv//////eB/f/8HAQAB7f/////8gAYP/+H4AAEW//////8EABAP/+H4AAGKf/////+BgAAB///fwAAOI///////A4AAAL//7/gAA0////////4MAAAAf///+AABb////////8EAAAAH////AAAE/////////oAAAAAH///+YAAA//////////AAAAAAH///8AAAA//////////gAAAAAA////8AAAA//1///////oAAAAAAP///6AAAAH9+H//////+IAAAAAAH///4AAAAPhvgf//////hAAAAAAAf///wAAAAPi/////////ggAAAAAAD///8AAAAB8IL///////zAgAAAAAAA///+AAAAAPAx////////MMAAAAAAAD///8AAAAAA/AA///////jOAAAAAAAAP///AAAAAA/8AD///////E4AAAAAAAAD///AAAAAAf/jA///////4IAAAAAAAAAP//4AAAAAB//nr///////4QAAAAAAAAAF/+MAAAAAA////////////gAAAAAAAAAAL/AIAAAAAL/////7//////gAAAAAAAAAAB/gCAAAAAA////7/H/////4AAAAAAAAAAAG/AAAAAAAD////7/IH////8AAAAAAAAAAABfAAAAAAAB////+f/g////8AAAAAAAAAAAAB8AMAAAAAH////9/+B/8//AAAAAAAABAAAAB8YGAAAAAH////8/+Af4f6AAAAAAAAAAAAAAf+C9AAAAB/////n/AD+D/QIAAAAAAAAAAAAAfwAAAAAAH/////P4APwH+AwAAAAAAAAAAAAAD8AAAAACP/////vwAHgB/AQAAAAAAAAAAAAAAPAAAAAAD//////wAA4AP4BAAAAAAAAAAAAAAAYCAAAAAP/////4AADgAngCAAAAAAAAAAAAAAAw/QAAAAf//////AAHABMAIAAAAAAAAAAAAAAA9/4AAAAP/////+AAHABAAEAAAAAAAAAAAAAAAD/+AAAAH/////+AAAgAgAGAAAAAAAAAAAAAAAA//4AAAA/H////AAAABMAwAAAAAAAAAAAAAAAAP//AAAAAAf///wAAAANA8AAAAAAAAAAAAAAAAH//4AAAAAB///8AAAAB8PAAAAAAAAAAAAAAAAB///AAAAAAf//+AAAAAPD90AAAAAAAAAAAAAAQP///AAAAAD///gAAAAAYfQsAAAAAAAAAAAAAAB///+AAAAAf//4AAAAABzzA+AAAAAAAAAAAAAAf///+AAAAB//+AAAAAAcE4H8AAAAAAAAAAAAAH////wAAAAP//gAAAAABAIBPuAAAAAAAAAAAAA////8AAAAH//wAAAAAAfAAH4IAAAAAAAAAAAAf///8AAAAD//wAAAAAAAeQDMCAAAAAAAAAAAAf///4AAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAf///gAAAAP//gAAAAAAAAEEAAAAAAAAAAAAAB///8AAAAB//8EAAAAAAAD4gAAAAAAAAAAAAAP///AAAAAf//DAAAAAAAP8YAAAAAAAAAAAAAD///AAAAAf/+OAAAAAAA/+4AAAAAAAAAAAAAD//8AAAAD//g4AAAAAAH//AAAAAAAAAAAAAA///AAAAAf/wcAAAAAAH//4AAAAAAAAAAAAAf//AAAAAf/wcAAAAAA///wBAAAAAAAAAAAB//wAAAAA//DgAAAAAH///AAAAAAAAAAAAAf/wAAAAAf/gwAAAAAH///wAAAAAAAAAAAA//gAAAAA/8AAAAAAAP///AAAAAAAAAAAAH/8AAAAAH/gAAAAAAD///gAAAAAAAAAAAH/4AAAAAH+AAAAAAAH///AAAAAAAAAAAA/+AAAAAB/AAAAAAAH///AAAAAAAAAAAB/4AAAAAD8AAAAAAAfB/4AAAAAAAAAAAf8AAAAAAgAAAAAAAcA/wAAAAAAAAAAB/gAAAAAAAAAAAAAAAH8AAAAAAAAAAA/wAAAAAAAAAAAAAAAHwAIAAAAAAAAPwAAAAAAAAAAAAAAAAAAMAAAAAAAAfgAAAAAAAAAAAAAAAAAGAAAAAAAAPgAAAAAAAAAAAAAAAQAQAAAAAAAB4AAAAAAAAAAAAAAAAAwAAAAAAAHAAAAAAAAAAAAAAAAAwAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAADiAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAA=';

  function decodeLand() {
    var bin = atob(LAND_BITS);
    var out = [];
    var k = 0;
    for (var r = 0; r < LAND_ROWS.length; r++) {
      var n = LAND_ROWS[r];
      var lat = (LAND_LAT0 - r * LAND_STEP) * DEG;
      var cp = Math.cos(lat), sp = Math.sin(lat);
      for (var i = 0; i < n; i++, k++) {
        if ((bin.charCodeAt(k >> 3) >> (7 - (k & 7))) & 1) {
          var lon = (-180 + (i + 0.5) * 360 / n) * DEG;
          out.push(cp * Math.sin(lon), sp, cp * Math.cos(lon));
        }
      }
    }
    return new Float32Array(out);
  }

  function toVec(lat, lon) {
    var p = lat * DEG, l = lon * DEG;
    return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
  }

  var land = decodeLand();
  var landCount = land.length / 3;

  var nodeByCode = {};
  NODES.forEach(function (n, i) {
    n.v = toVec(n.lat, n.lon);
    n.phase = (i * 0.37) % 1;
    try { n.label = n.city.toLocaleUpperCase('tr-TR'); } catch (e) { n.label = n.city.toUpperCase(); }
    nodeByCode[n.code] = n;
  });

  // Pre-compute elevated great-circle polylines for every link.
  var SEG = 72;
  var arcs = LINKS.map(function (pair, i) {
    var a = nodeByCode[pair[0]].v, b = nodeByCode[pair[1]].v;
    var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    var w = Math.acos(Math.max(-1, Math.min(1, dot)));
    var sw = Math.sin(w) || 1e-6;
    var lift = 0.035 + 0.24 * (w / Math.PI);
    var pts = new Float32Array((SEG + 1) * 3);
    for (var s = 0; s <= SEG; s++) {
      var t = s / SEG;
      var fa = Math.sin((1 - t) * w) / sw, fb = Math.sin(t * w) / sw;
      var h = 1 + lift * Math.sin(Math.PI * t);
      pts[s * 3] = (fa * a[0] + fb * b[0]) * h;
      pts[s * 3 + 1] = (fa * a[1] + fb * b[1]) * h;
      pts[s * 3 + 2] = (fa * a[2] + fb * b[2]) * h;
    }
    return {
      pts: pts,
      travel: 1.3 + 2.4 * (w / Math.PI),      // seconds for one pass
      cycle: 0,
      offset: i * 1.13
    };
  });
  arcs.forEach(function (a) { a.cycle = a.travel + 1.6 + (a.offset % 1.7); });

  /* ---------------------------------------------------------------
   * State
   * ------------------------------------------------------------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isStatic = canvas.hasAttribute('data-static');
  var animate = !reduceMotion && !isStatic;

  var centerLon = parseFloat(canvas.getAttribute('data-center-lon'));
  var yaw = -(isNaN(centerLon) ? 58 : centerLon) * DEG;
  var pitch = parseFloat(canvas.getAttribute('data-pitch'));
  pitch = isNaN(pitch) ? 0.36 : pitch;
  var AUTO_SPEED = 0.075; // rad / s

  var W = 0, H = 0, R = 0, CX = 0, CY = 0, DPR = 1, compact = false;
  var colors = {};
  var cache = {};
  var running = false, visible = true, rafId = 0, lastT = 0, clock = 0;
  var dragging = false, lastX = 0, lastY = 0, velocity = 0;

  // Scratch buffers for projected dots.
  var px = new Float32Array(landCount), py = new Float32Array(landCount), pz = new Float32Array(landCount);

  function readColors() {
    var cs = getComputedStyle(canvas);
    function v(name, fallback) {
      var s = cs.getPropertyValue(name);
      return (s && s.trim()) || fallback;
    }
    colors = {
      dot: v('--globe-dot', '160, 185, 225'),
      node: v('--globe-node', '91, 155, 255'),
      arc: v('--globe-arc', '79, 209, 232'),
      label: v('--globe-label', '238, 242, 248'),
      labelDim: v('--globe-label-dim', '150, 164, 188'),
      halo: v('--globe-halo', '6, 9, 16'),
      dotAlpha: parseFloat(v('--globe-dot-alpha', '0.9')) || 0.9,
      glow: parseFloat(v('--globe-glow', '1')) || 1
    };
    cache = {};
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    R = Math.min(W, H) * 0.39;
    CX = W / 2; CY = H / 2 + R * 0.02;
    compact = R < 150;
    cache = {};
    requestFrame();
  }

  /* ---------------------------------------------------------------
   * Rendering
   * ------------------------------------------------------------- */
  function rot(x, y, z, sy, cy_, sp, cp, out) {
    var x1 = x * cy_ + z * sy;
    var z1 = -x * sy + z * cy_;
    out[0] = x1;
    out[1] = y * cp - z1 * sp;
    out[2] = y * sp + z1 * cp;
  }

  function gradients() {
    if (cache.ok) return cache;
    var g = colors.glow;
    var atm = ctx.createRadialGradient(CX, CY, R * 0.92, CX, CY, R * 1.42);
    atm.addColorStop(0, 'rgba(' + colors.node + ',' + (0.2 * g) + ')');
    atm.addColorStop(0.35, 'rgba(' + colors.node + ',' + (0.07 * g) + ')');
    atm.addColorStop(1, 'rgba(' + colors.node + ',0)');
    var body = ctx.createRadialGradient(CX - R * 0.38, CY - R * 0.42, R * 0.05, CX, CY, R * 1.02);
    body.addColorStop(0, 'rgba(' + colors.node + ',' + (0.16 * g) + ')');
    body.addColorStop(0.55, 'rgba(' + colors.node + ',' + (0.06 * g) + ')');
    body.addColorStop(1, 'rgba(' + colors.node + ',' + (0.02 * g) + ')');
    var rim = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
    rim.addColorStop(0, 'rgba(' + colors.arc + ',0.45)');
    rim.addColorStop(0.5, 'rgba(' + colors.node + ',0.12)');
    rim.addColorStop(1, 'rgba(' + colors.node + ',0.3)');
    cache = { ok: true, atm: atm, body: body, rim: rim };
    return cache;
  }

  var tmp = [0, 0, 0];
  var BUCKETS = 7;

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    var gr = gradients();

    // Atmosphere + body
    ctx.fillStyle = gr.atm;
    ctx.beginPath(); ctx.arc(CX, CY, R * 1.42, 0, TAU); ctx.fill();
    ctx.fillStyle = gr.body;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = gr.rim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.stroke();

    var sy = Math.sin(yaw), cy_ = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);

    // Land dots, bucketed by depth to keep fillStyle changes low.
    var i, j;
    for (i = 0; i < landCount; i++) {
      j = i * 3;
      var x = land[j], y = land[j + 1], z = land[j + 2];
      var x1 = x * cy_ + z * sy;
      var z1 = -x * sy + z * cy_;
      var z2 = y * sp + z1 * cp;
      pz[i] = z2;
      if (z2 <= 0) continue;
      px[i] = CX + x1 * R;
      py[i] = CY - (y * cp - z1 * sp) * R;
    }
    var baseR = Math.max(0.75, R * 0.0056);
    for (var b = 0; b < BUCKETS; b++) {
      var lo = b / BUCKETS, hi = (b + 1) / BUCKETS;
      var mid = (lo + hi) / 2;
      var a = (0.1 + 0.9 * Math.pow(mid, 0.9)) * colors.dotAlpha;
      var rr = baseR * (0.55 + 0.45 * mid);
      ctx.fillStyle = 'rgba(' + colors.dot + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      for (i = 0; i < landCount; i++) {
        var zz = pz[i];
        if (zz <= lo || zz > hi) continue;
        ctx.moveTo(px[i] + rr, py[i]);
        ctx.arc(px[i], py[i], rr, 0, TAU);
      }
      ctx.fill();
    }

    // Links
    drawArcs(sy, cy_, sp, cp);

    // Nodes + labels
    drawNodes(sy, cy_, sp, cp);
  }

  function arcPoint(arc, s, sy, cy_, sp, cp, out) {
    var p = arc.pts, k = s * 3;
    rot(p[k], p[k + 1], p[k + 2], sy, cy_, sp, cp, out);
    out[3] = (out[2] > 0) || (out[0] * out[0] + out[1] * out[1] > 1.0);
    out[0] = CX + out[0] * R;
    out[1] = CY - out[1] * R;
  }

  var P0 = [0, 0, 0, 0], P1 = [0, 0, 0, 0];

  function drawArcs(sy, cy_, sp, cp) {
    ctx.lineCap = 'round';
    for (var n = 0; n < arcs.length; n++) {
      var arc = arcs[n];
      // Base track
      ctx.strokeStyle = 'rgba(' + colors.node + ',' + (animate ? 0.34 : 0.55) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      var pen = false;
      for (var s = 0; s <= SEG; s++) {
        arcPoint(arc, s, sy, cy_, sp, cp, P0);
        if (P0[3]) {
          if (pen) ctx.lineTo(P0[0], P0[1]); else ctx.moveTo(P0[0], P0[1]);
          pen = true;
        } else pen = false;
      }
      ctx.stroke();

      if (!animate) continue;

      // Travelling pulse with a fading tail
      var tt = (clock + arc.offset) % arc.cycle;
      if (tt > arc.travel) continue;
      var head = tt / arc.travel;
      var tail = 0.28;
      var hs = Math.floor(head * SEG);
      var ts = Math.max(0, Math.floor((head - tail) * SEG));
      for (var q = ts; q < hs; q++) {
        arcPoint(arc, q, sy, cy_, sp, cp, P0);
        arcPoint(arc, q + 1, sy, cy_, sp, cp, P1);
        if (!P0[3] || !P1[3]) continue;
        var f = (q - ts) / Math.max(1, hs - ts);
        ctx.strokeStyle = 'rgba(' + colors.arc + ',' + (0.95 * f * f).toFixed(3) + ')';
        ctx.lineWidth = 1 + 1.2 * f;
        ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.stroke();
      }
      arcPoint(arc, Math.min(SEG, hs), sy, cy_, sp, cp, P0);
      if (P0[3]) {
        ctx.fillStyle = 'rgba(' + colors.arc + ',0.25)';
        ctx.beginPath(); ctx.arc(P0[0], P0[1], 4.5, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(P0[0], P0[1], 1.6, 0, TAU); ctx.fill();
      }
    }
  }

  function drawNodes(sy, cy_, sp, cp) {
    var mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
    for (var n = 0; n < NODES.length; n++) {
      var node = NODES[n];
      rot(node.v[0], node.v[1], node.v[2], sy, cy_, sp, cp, tmp);
      var z = tmp[2];
      if (z <= 0.02) continue;
      var x = CX + tmp[0] * R, y = CY - tmp[1] * R;
      var vis = Math.min(1, (z - 0.02) / 0.22);

      // Pulse ring
      var p = animate ? ((clock / 2.8 + node.phase) % 1) : 0.45;
      ctx.strokeStyle = 'rgba(' + colors.node + ',' + (0.65 * (1 - p) * vis).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, 3.5 + 13 * p, 0, TAU); ctx.stroke();

      // Core
      ctx.fillStyle = 'rgba(' + colors.node + ',' + (0.22 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(' + colors.node + ',' + vis.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill();

      // Data block with leader line (radar style)
      var k = compact ? 0.72 : 1;
      var ax = x + node.lx * k, ay = y + node.ly * k;
      var right = node.align === 'right';
      var la = vis * (z > 0.25 ? 1 : (z - 0.02) / 0.23);
      if (la <= 0.02) continue;
      ctx.strokeStyle = 'rgba(' + colors.labelDim + ',' + (0.55 * la).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      var dx = ax - x, dy = ay - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      ctx.moveTo(x + dx / d * 6, y + dy / d * 6);
      ctx.lineTo(ax + (right ? 4 : -4), ay);
      ctx.stroke();

      ctx.textAlign = right ? 'right' : 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(' + colors.halo + ',' + (0.85 * la).toFixed(3) + ')';
      ctx.font = '600 ' + (compact ? 10 : 11) + 'px ' + mono;
      var cyText = compact ? ay + 4 : ay - 1;
      ctx.strokeText(node.code, ax, cyText);
      ctx.fillStyle = 'rgba(' + colors.label + ',' + la.toFixed(3) + ')';
      ctx.fillText(node.code, ax, cyText);
      if (!compact) {
        ctx.font = '500 9.5px ' + mono;
        ctx.strokeText(node.label, ax, ay + 11);
        ctx.fillStyle = 'rgba(' + colors.labelDim + ',' + la.toFixed(3) + ')';
        ctx.fillText(node.label, ax, ay + 11);
      }
    }
  }

  /* ---------------------------------------------------------------
   * Loop
   * ------------------------------------------------------------- */
  function frame(t) {
    rafId = 0;
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    if (animate) {
      clock += dt;
      if (!dragging) {
        yaw += AUTO_SPEED * dt + velocity;
        velocity *= 0.92;
        if (Math.abs(velocity) < 1e-5) velocity = 0;
      }
    } else if (!dragging && velocity) {
      yaw += velocity;
      velocity *= 0.9;
      if (Math.abs(velocity) < 1e-4) velocity = 0;
    }
    draw();
    if ((animate && running) || velocity || dragging) requestFrame();
  }

  function requestFrame() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    running = on && visible && !document.hidden;
    if (running) { lastT = 0; requestFrame(); }
  }

  /* ---------------------------------------------------------------
   * Interaction: drag to rotate (horizontal), tilt with vertical drag
   * ------------------------------------------------------------- */
  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; velocity = 0;
    lastX = e.clientX; lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    canvas.classList.add('is-dragging');
    requestFrame();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    var k = 1 / Math.max(120, R);
    yaw += dx * k;
    velocity = dx * k * 0.6;
    if (e.pointerType === 'mouse') pitch = Math.max(0.02, Math.min(0.85, pitch + dy * k * 0.6));
    requestFrame();
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    requestFrame();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  /* ---------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------- */
  readColors();
  resize();

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { resize(); }).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      setRunning(true);
    }, { rootMargin: '80px' }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { setRunning(true); });

  new MutationObserver(function () { readColors(); requestFrame(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { requestFrame(); });
  }

  setRunning(true);
  requestFrame();
  canvas.classList.add('is-ready');
})();
