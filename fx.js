/* fx.js - canvas particle / lightning / slash effects drawn on #cvFx (design-space coordinates) + DOM floaters. */
(function () {
  const F = { W: 1280, H: 720, items: [], flashes: [], running: false, last: 0, k: 1 };
  let cv, cx, layer;
  const rnd = (a, b) => a + Math.random() * (b - a);

  F.init = function () {
    cv = document.getElementById('cvFx'); cx = cv.getContext('2d'); layer = document.getElementById('fxLayer'); setTimeout(() => { try { F.preload(); } catch (e) {} }, 800);
  };
  F.resize = function (W, H, scale) {
    F.W = W; F.H = H; if (!cv) return; const HY = window.HY || {}, dpr = window.devicePixelRatio || 1;
    /* iOS keeps every canvas backing store in GPU memory: cap density hard on lite/safe (DPR 3 phones otherwise get a 1121x1992 canvas) */
    const k = HY.lite2 ? Math.min(0.75, Math.max(0.5, scale)) : HY.lite ? Math.min(1, Math.max(0.6, scale * Math.min(dpr, 1.5))) : Math.min(2, Math.max(0.75, scale * dpr)); F.k = k;
    cv.width = Math.round(W * k); cv.height = Math.round(H * k); cx.setTransform(k, 0, 0, k, 0, 0);
  };
  F.degrade = function () { if (F.W) F.resize(F.W, F.H, (window.UI && window.UI.scale) || 1); };
  function kick() { if (!F.running) { F.running = true; F.last = performance.now(); requestAnimationFrame(loop); } }
  F.clear = function () { F.items.length = 0; F.flashes.length = 0; if (cx) cx.clearRect(0, 0, F.W, F.H); if (layer) layer.innerHTML = ''; };

  /* ---------- primitives ---------- */
  F.burst = function (x, y, o) {
    o = o || {}; const n = o.n || 14;
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + rnd(-(o.spread || 0.8), o.spread || 0.8) : rnd(0, Math.PI * 2), sp = rnd(o.s0 || 60, o.s1 || 260);
      F.items.push({ t: 'p', x: x + rnd(-(o.jx || 6), o.jx || 6), y: y + rnd(-(o.jy || 6), o.jy || 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0, life: 0, max: rnd(o.l0 || 0.35, o.l1 || 0.8), size: rnd(o.z0 || 2, o.z1 || 5), color: o.color || '#fff', shape: o.shape || 'c', drag: o.drag == null ? 0.9 : o.drag });
    }
    kick();
  };
  F.ring = function (x, y, color, r1, life, w) { F.items.push({ t: 'ring', x: x, y: y, r0: 6, r1: r1 || 120, life: 0, max: life || 0.45, color: color || '#fff', w: w || 4 }); kick(); };
  F.slash = function (x, y, ang, color, len, w) { F.items.push({ t: 'slash', x: x, y: y, ang: ang, len: len || 220, life: 0, max: 0.26, color: color || '#fff', w: w || 9 }); kick(); };
  F.bolt = function (x1, y1, x2, y2, color, w) {
    const pts = [[x1, y1]], n = 9; for (let i = 1; i < n; i++) { const t = i / n; pts.push([x1 + (x2 - x1) * t + rnd(-34, 34), y1 + (y2 - y1) * t + rnd(-8, 8)]); } pts.push([x2, y2]);
    F.items.push({ t: 'bolt', pts: pts, life: 0, max: 0.38, color: color || '#bfd0ff', w: w || 5 }); kick();
  };
  F.arc = function (x, y, r, a0, a1, color, w) { F.items.push({ t: 'arc', x: x, y: y, r: r, a0: a0, a1: a1, life: 0, max: 0.4, color: color, w: w || 8 }); kick(); };
  F.flash = function (color, a, dur) { F.flashes.push({ color: color || '#fff', a: a || 0.6, life: 0, max: dur || 0.25 }); kick(); };
  F.shard = function (x, y, color) { for (let i = 0; i < 9; i++) { const a = rnd(0, 6.28), s = rnd(120, 340); F.items.push({ t: 'p', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, g: 380, life: 0, max: rnd(0.5, 0.9), size: rnd(5, 11), color: color, shape: 'd', drag: 0.94, rot: rnd(0, 6) }); } kick(); };


  /* ---------- prerendered sprite VFX (offscreen canvases, cached per colour) ---------- */
  const SPR = {};
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function mkCres(col) {
    const c = mk(520, 220), g = c.getContext('2d');
    const path = (t) => { g.beginPath(); g.moveTo(14, 168); g.quadraticCurveTo(250, -70 + t, 506, 104); g.quadraticCurveTo(262, 40 + t * 1.2, 14, 168); g.closePath(); };
    g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; path(0); g.fill(); g.fill();
    g.shadowBlur = 12; g.shadowColor = '#fff'; g.fillStyle = '#fff'; g.save(); g.translate(0, 10); g.scale(1, .92); path(24); g.fill(); g.restore();
    return c;
  }
  function mkBurst(col) {
    const c = mk(320, 320), g = c.getContext('2d'); g.translate(160, 160);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 150); gr.addColorStop(0, '#fff'); gr.addColorStop(.07, '#fff'); gr.addColorStop(.2, col); gr.addColorStop(.55, col + '33'); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 150, 0, 6.283); g.fill();
    const n = 16; g.fillStyle = '#fff'; g.shadowColor = col; g.shadowBlur = 18;
    g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.283, r = i % 2 ? 26 : (i % 4 === 0 ? 150 : 96 + ((i * 37) % 40)); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    g.shadowBlur = 0; g.fillStyle = col; g.globalAlpha = .55; g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.283 + .1, r = i % 2 ? 20 : 120; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    return c;
  }
  function mkGlow(col) {
    const c = mk(256, 256), g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.25, col); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c;
  }
  function mkClaw(col) {
    const c = mk(420, 300), g = c.getContext('2d'); g.shadowColor = col; g.shadowBlur = 16;
    for (let i = 0; i < 3; i++) { const o = i * 70 - 60; g.fillStyle = i === 1 ? '#fff' : col; g.beginPath(); g.moveTo(40 + o * .3, 10 + (i * 30)); g.quadraticCurveTo(210 + o * .2, 140, 380 + o * .5, 280 - i * 8); g.quadraticCurveTo(230 + o * .2, 140, 40 + o * .3, 10 + (i * 30) + 10); g.fill(); }
    return c;
  }
  function mkFlare(col) {
    const c = mk(512, 128), g = c.getContext('2d'); const gr = g.createRadialGradient(256, 64, 0, 256, 64, 256); gr.addColorStop(0, '#fff'); gr.addColorStop(.2, col); gr.addColorStop(1, col + '00');
    g.save(); g.translate(256, 64); g.scale(1, .12); g.translate(-256, -64 / .12 * .12 - 0); g.restore();
    g.fillStyle = gr; g.beginPath(); g.ellipse(256, 64, 256, 16, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(256, 64, 70, 60, 0, 0, 6.283); g.fill(); return c;
  }
  const MAKERS = { cres: mkCres, burst: mkBurst, glow: mkGlow, claw: mkClaw, flare: mkFlare };
  function getSpr(name, col) { if (/^#[0-9a-f]{3}$/i.test(col)) col = '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3]; if (!/^#[0-9a-f]{6}$/i.test(col)) col = '#ffffff'; const k = name + col; return SPR[k] || (SPR[k] = MAKERS[name](col)); }
  /* o: {col, rot, s (scale), life, flip, grow, spin, w (width px)} */
  F.sprite = function (name, x, y, o) {
    o = o || {}; const img = getSpr(name, o.col || '#ffffff'), s = o.s || 1;
    F.items.push({ t: 'spr', img: img, x: x, y: y, rot: o.rot || 0, s: s, flip: o.flip ? -1 : 1, life: 0, max: o.life || 0.3, a: o.a == null ? 1 : o.a, grow: o.grow == null ? 0.5 : o.grow, spin: o.spin || 0, wipe: o.wipe, delay: o.delay || 0 });
    kick();
  };
  F.preload = function () { ['#ffffff', '#ffd9a0', '#ff8a3a', '#9fb4ff', '#7fe9ff', '#d6b8ff', '#78e8d0', '#ff62d8'].forEach((c) => { getSpr('cres', c); getSpr('burst', c); }); };
  /* impact: hit sprite combo scaled by power (0..2) */
  F.impact = function (x, y, o) {
    o = o || {}; const p = o.p || 1, col = o.col || '#ffd9a0', crit = !!o.crit;
    F.sprite('burst', x, y, { col: crit ? '#ffd24a' : col, s: (0.38 + 0.22 * p) * (crit ? 1.4 : 1), life: crit ? 0.34 : 0.26, grow: 0.7, rot: rnd(0, 6.28) });
    F.sprite('glow', x, y, { col: col, s: 0.7 + p * 0.3, life: 0.28, grow: 0.3, a: 0.45 });
    if (crit) { F.sprite('flare', x, y, { col: '#ffd24a', s: 1.2, life: 0.4, rot: 0, grow: 0.4, a: 0.8 }); F.sprite('flare', x, y, { col: '#fff', s: 0.9, a: 0.7, life: 0.35, rot: Math.PI / 2, grow: 0.4 }); }
  };

  /* ---------- named effects ---------- */
  const SPR_FX = {
    slash: ['cres', '#ffe9b0', 1, 0.6], slashBig: ['cres', '#ffb070', 1.5, 1], claw: ['claw', '#cfe0ff', 1, 0.7], hit: ['burst', '#fff1d0', 0.8, 0.5],
    thunder: ['burst', '#9fb4ff', 1.1, 0.8], thunderBig: ['burst', '#cfdcff', 1.7, 1.2], fire: ['glow', '#ff8a3a', 1.6, 0.7], fireBig: ['glow', '#ff6a2a', 2.6, 1.2],
    ice: ['burst', '#7fe9ff', 1.1, 0.7], iceBig: ['burst', '#aaf0ff', 1.8, 1.2], wind: ['cres', '#d6b8ff', 1.1, 0.7], windBig: ['cres', '#e8d4ff', 1.7, 1.2],
    water: ['cres', '#78e8d0', 1.1, 0.7], crush: ['burst', '#ff62d8', 2.2, 1.4]
  };
  F.play = function (kind, x, y, from) {
    const sp = SPR_FX[kind];
    if (sp) {
      const big = /Big$/.test(kind) || kind === 'crush';
      if (sp[0] === 'cres') { F.sprite('cres', x, y, { col: sp[1], s: sp[2], rot: rnd(-0.9, -0.5), life: 0.32, grow: 0.35 }); if (big) F.sprite('cres', x, y, { col: '#fff', s: sp[2] * 0.9, rot: rnd(0.3, 0.7), flip: 1, life: 0.34, grow: 0.3, delay: 0.07 }); F.sprite('burst', x, y, { col: sp[1], s: 0.3 + sp[3] * 0.25, life: 0.28, delay: 0.1 }); }
      else if (sp[0] === 'claw') { F.sprite('claw', x, y, { col: sp[1], s: 1, rot: rnd(-0.3, 0.1), life: 0.34, grow: 0.15 }); F.sprite('burst', x, y, { col: sp[1], s: 0.6, life: 0.26, delay: 0.1 }); }
      else if (sp[0] === 'glow') F.sprite('glow', x, y, { col: sp[1], s: sp[2] * 0.7, life: 0.5, grow: 0.8, a: 0.7 });
      else F.sprite('burst', x, y, { col: sp[1], s: sp[2] * 0.5, life: big ? 0.4 : 0.28, grow: 0.7, rot: rnd(0, 6.28) });
    }
    switch (kind) {
      case 'slash': F.slash(x, y, rnd(-0.9, -0.5), '#fff', 230); F.burst(x, y, { n: 10, color: '#ffe9b0', s1: 300 }); break;
      case 'slashBig': F.slash(x, y, -0.7, '#fff', 340, 14); F.slash(x, y, 0.5, '#ffb070', 300, 10); F.burst(x, y, { n: 26, color: '#ffd9a0', s1: 420 }); F.ring(x, y, '#ffd0a0', 150); F.flash('#fff', 0.35, 0.18); break;
      case 'claw': for (let i = -1; i <= 1; i++) F.slash(x + i * 22, y + i * 8, -0.8, '#e8f0ff', 200, 6); F.burst(x, y, { n: 10, color: '#cfe0ff' }); break;
      case 'hit': F.burst(x, y, { n: 12, color: '#fff', s1: 240 }); F.ring(x, y, '#fff', 60, 0.25, 3); break;
      case 'thunder': F.bolt(x + rnd(-40, 40), -20, x, y, '#cfdcff', 6); F.bolt(x + rnd(-60, 60), -20, x + rnd(-10, 10), y, '#8fa6ff', 3); F.burst(x, y, { n: 18, color: '#d8e4ff', s1: 340 }); F.ring(x, y, '#9fb4ff', 110); F.flash('#cfdcff', 0.4, 0.2); break;
      case 'thunderBig': for (let i = 0; i < 4; i++) setTimeout(() => F.bolt(x + rnd(-90, 90), -20, x + rnd(-40, 40), y + rnd(-20, 20), i % 2 ? '#fff' : '#9fb4ff', 8), i * 70); F.burst(x, y, { n: 40, color: '#dce6ff', s1: 480 }); F.ring(x, y, '#bcd0ff', 220, 0.6, 6); F.flash('#fff', 0.7, 0.35); break;
      case 'fire': F.burst(x, y + 20, { n: 26, color: '#ff8a3a', dir: -Math.PI / 2, spread: 1.0, s0: 80, s1: 320, g: -120, z0: 3, z1: 9, l1: 0.9 }); F.burst(x, y, { n: 10, color: '#ffd24a', s1: 200 }); F.ring(x, y, '#ff7a3a', 100); break;
      case 'fireBig': F.burst(x, y + 30, { n: 70, color: '#ff6a2a', dir: -Math.PI / 2, spread: 1.4, s0: 100, s1: 520, g: -160, z0: 4, z1: 14, l1: 1.1 }); F.burst(x, y, { n: 24, color: '#ffe27a', s1: 360 }); F.ring(x, y, '#ff8a3a', 230, 0.6, 7); F.flash('#ff7a3a', 0.45, 0.3); break;
      case 'ice': F.shard(x, y, '#aaf0ff'); F.burst(x, y, { n: 14, color: '#e8fcff', s1: 280 }); F.ring(x, y, '#7fe9ff', 100); break;
      case 'iceBig': for (let i = 0; i < 4; i++) F.shard(x + rnd(-60, 60), y + rnd(-30, 30), i % 2 ? '#d8faff' : '#7fe9ff'); F.ring(x, y, '#7fe9ff', 240, 0.6, 6); F.flash('#aaf0ff', 0.45, 0.3); break;
      case 'wind': F.arc(x, y, 90, -2.6, 0.2, '#e0c8ff', 8); F.arc(x, y, 60, -1.6, 1.2, '#fff', 4); F.burst(x, y, { n: 12, color: '#d6b8ff', s1: 300 }); break;
      case 'windBig': for (let i = 0; i < 3; i++) setTimeout(() => F.arc(x, y, 80 + i * 40, -2.8 + i * 0.4, 0.4 + i * 0.4, '#e8d4ff', 10), i * 80); F.burst(x, y, { n: 40, color: '#ddc4ff', s1: 480 }); F.flash('#e0c8ff', 0.35, 0.25); break;
      case 'water': F.burst(x, y, { n: 20, color: '#78e8d0', g: 420, dir: -Math.PI / 2, spread: 1.2, s0: 120, s1: 340 }); F.ring(x, y, '#58e6a0', 110); F.slash(x, y, -0.6, '#bff7ea', 240, 8); break;
      case 'heal': F.burst(x, y + 40, { n: 20, color: '#aaffc8', dir: -Math.PI / 2, spread: 0.7, s0: 40, s1: 140, g: -30, z0: 2, z1: 6, l0: 0.7, l1: 1.2 }); F.ring(x, y, '#aaffc8', 90, 0.6); break;
      case 'healBig': F.burst(x, y + 40, { n: 30, color: '#fff2b0', dir: -Math.PI / 2, spread: 0.8, s0: 40, s1: 180, g: -30, z0: 2, z1: 7, l0: 0.8, l1: 1.4 }); F.ring(x, y, '#ffe9a0', 130, 0.7); break;
      case 'bell': for (let i = 0; i < 3; i++) setTimeout(() => F.ring(x, y, '#ff9aea', 80 + i * 70, 0.6, 5), i * 120); F.burst(x, y, { n: 12, color: '#ffc0f4' }); break;
      case 'crush': F.ring(x, y, '#ff62d8', 420, 0.7, 12); F.burst(x, y, { n: 50, color: '#a06848', s0: 100, s1: 600, g: 500, z1: 12 }); F.flash('#ff62d8', 0.5, 0.35); break;
      case 'buff': F.burst(x, y + 30, { n: 14, color: '#ffe08a', dir: -Math.PI / 2, spread: 0.6, s1: 120, g: -40, z1: 5, l1: 1 }); break;
      case 'death': F.burst(x, y, { n: 40, color: '#ffffff', s1: 380, g: -30, l1: 1.2 }); F.burst(x, y, { n: 20, color: '#8a6aff', s1: 260, l1: 1.4 }); F.ring(x, y, '#fff', 150, 0.6); break;
      case 'sparkle': F.burst(x, y, { n: 24, color: '#ffe9a0', s1: 300, g: 100, l1: 1 }); break;
    }
  };

  /* ---------- DOM floaters ---------- */
  F.float = function (x, y, txt, cls) {
    if (!layer) return; cls = cls || ''; const e = document.createElement('div'); e.className = 'fl ' + cls;
    const n = parseInt(txt, 10), isDmg = /\bdmg\b/.test(cls), crit = /\bcrit\b/.test(cls);
    if (isDmg && n > 0) {
      const k = Math.max(0.85, Math.min(1.75, 0.85 + n / 420)); e.style.setProperty('--k', k.toFixed(2)); e.style.setProperty('--dx', Math.round(rnd(-46, 46)) + 'px'); e.style.setProperty('--rot', rnd(-9, 9).toFixed(1) + 'deg');
      e.innerHTML = (crit ? '<i class="fl-bg"></i><em>' + (window.I18N && I18N.lang === 'ja' ? '会心' : 'CRITICAL') + '</em>' : '') + '<span>' + txt + '</span>';
    } else if (/\bheal\b/.test(cls)) { e.style.setProperty('--dx', Math.round(rnd(-20, 20)) + 'px'); e.innerHTML = '<span>' + txt + '</span>'; }
    else e.textContent = txt;
    e.style.left = x + 'px'; e.style.top = y + 'px';
    layer.appendChild(e); setTimeout(() => { if (e.parentNode) e.parentNode.removeChild(e); }, 1500);
  };

  /* ---------- loop ---------- */
  function loop(now) {
    const dt = Math.min(0.05, (now - F.last) / 1000); F.last = now;
    cx.clearRect(0, 0, F.W, F.H); cx.globalCompositeOperation = 'lighter';
    const keep = [];
    for (const p of F.items) {
      p.life += dt; const k = p.life / p.max; if (k >= 1) continue; keep.push(p); const a = 1 - k;
      if (p.t === 'p') {
        p.vx *= Math.pow(p.drag, dt * 60); p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        cx.globalAlpha = Math.min(1, a * 1.4); cx.fillStyle = p.color;
        if (p.shape === 'd') { cx.save(); cx.translate(p.x, p.y); cx.rotate((p.rot || 0) + p.life * 6); cx.beginPath(); cx.moveTo(0, -p.size); cx.lineTo(p.size * 0.5, 0); cx.lineTo(0, p.size); cx.lineTo(-p.size * 0.5, 0); cx.fill(); cx.restore(); }
        else { cx.beginPath(); cx.arc(p.x, p.y, p.size * (0.5 + a * 0.6), 0, 6.283); cx.fill(); }
      } else if (p.t === 'spr') {
        if (p.delay > 0) { p.delay -= dt; p.life -= dt; keep[keep.length - 1] = p; continue; }
        const e = 1 - Math.pow(1 - Math.min(1, k * 2.6), 3), sc = p.s * (1 - p.grow * 0.5 + p.grow * e) * (k > 0.55 ? 1 - (k - 0.55) * 0.25 : 1);
        cx.save(); cx.globalAlpha = p.a * (k < 0.3 ? 1 : Math.max(0, 1 - (k - 0.3) / 0.7)); cx.translate(p.x, p.y); cx.rotate(p.rot + p.spin * p.life); cx.scale(sc * p.flip, sc);
        const w = p.img.width, h = p.img.height; if (p.img.width === 520) { const rv = Math.min(1, k * 4.5); cx.drawImage(p.img, 0, 0, w * rv, h, -w / 2, -h / 2, w * rv, h); } else cx.drawImage(p.img, -w / 2, -h / 2); cx.restore();
      } else if (p.t === 'ring') {
        const r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - k, 3)); cx.globalAlpha = a; cx.strokeStyle = p.color; cx.lineWidth = p.w * a + 1; cx.beginPath(); cx.arc(p.x, p.y, Math.max(0.1, r), 0, 6.283); cx.stroke();
      } else if (p.t === 'slash') {
        const e = Math.min(1, k * 3.2), fade = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6; const dx = Math.cos(p.ang) * p.len / 2, dy = Math.sin(p.ang) * p.len / 2;
        const x0 = p.x - dx + dx * 2 * Math.max(0, e - 0.5) * 0, x1 = p.x - dx + dx * 2 * e, y1 = p.y - dy + dy * 2 * e;
        cx.globalAlpha = fade; cx.strokeStyle = p.color; cx.lineCap = 'round';
        cx.lineWidth = p.w * fade; cx.beginPath(); cx.moveTo(p.x - dx, p.y - dy); cx.lineTo(x1, y1); cx.stroke();
        cx.lineWidth = p.w * fade * 0.35; cx.strokeStyle = '#fff'; cx.beginPath(); cx.moveTo(p.x - dx, p.y - dy); cx.lineTo(x1, y1); cx.stroke();
      } else if (p.t === 'bolt') {
        const fl = (Math.floor(p.life * 40) % 2) ? 1 : 0.6; cx.globalAlpha = a * fl; cx.strokeStyle = p.color; cx.lineJoin = 'round'; cx.lineWidth = p.w * (0.4 + a); cx.shadowColor = p.color; cx.shadowBlur = 18;
        cx.beginPath(); p.pts.forEach((q, i) => { i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); }); cx.stroke(); cx.lineWidth = 1.5; cx.strokeStyle = '#fff'; cx.stroke(); cx.shadowBlur = 0;
      } else if (p.t === 'arc') {
        const e = Math.min(1, k * 2.5); cx.globalAlpha = a; cx.strokeStyle = p.color; cx.lineWidth = p.w * a + 1; cx.lineCap = 'round'; cx.beginPath(); cx.arc(p.x, p.y, p.r, p.a0, p.a0 + (p.a1 - p.a0) * e); cx.stroke();
      }
    }
    F.items = keep;
    cx.globalCompositeOperation = 'source-over';
    const fk = [];
    for (const f of F.flashes) { f.life += dt; const k = f.life / f.max; if (k >= 1) continue; fk.push(f); cx.globalAlpha = f.a * (1 - k); cx.fillStyle = f.color; cx.fillRect(0, 0, F.W, F.H); }
    F.flashes = fk; cx.globalAlpha = 1;
    if (F.items.length || F.flashes.length) requestAnimationFrame(loop); else F.running = false;
  }
  window.FX = F;
})();
