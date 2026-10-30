/* stage25.js - 2.5D battle stage.
 * Painted portraits stay the art: each DOM card is a depth-sorted "standee" on a perspective ground plane.
 * Camera (zoom/pan/shake), parallax layers, fog, lanterns, rim/flash lighting, ambient particles, springs for lunge/recoil/knockback.
 * Everything is driven by ONE requestAnimationFrame loop using the rAF timestamp (virtual-clock friendly), with an FPS governor
 * that steps quality down (0 full -> 1 no blur/half particles -> 2 minimal) on slow devices. Force with ?fx=full|mid|low. */
(function () {
  'use strict';
  const S = { running: false, level: 0, frames: 0, fps: 60, units: [], props: [], speed: 1, fixed: false, lit: 0, lo: 0, trauma: 0, hold: 0, storm: false };
  const cam = { fx: 640, fy: 360, z: 1, tfx: 640, tfy: 360, tz: 1, rate: 5 };
  S.cam = cam;
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = (id) => document.getElementById(id);
  let world, W = 1280, H = 720, M = { x: 640, y: 360 }, last = 0, T = 0, port = false, C = null, bg, layerEls = [], acv, actx, parts = [], spr = {}, govN = 0, govAcc = 0, govWarm = 0, nextBolt = 0, drift = 8, lastLit = -1, lastLo = -1;
  const DA = 1.06, DE = 0.9;                       // parallax factor for ally row (closer) / enemy row (farther)
  const LAY = { wFar: { base: 1, ex: 0.07, ey: 0 }, wFogA: { base: 1, ex: 0.7, ey: 0.2 }, wGround: { base: 1, ex: 0.12, ey: 0 }, wFogB: { base: 1, ex: 0.7, ey: 0.2 }, wFogC: { base: 1, ex: 0.7, ey: 0.3 }, wFore: { base: 1, ex: 0.05, ey: 0.05 } };

  function cfg() {
    port = !!(window.UI && UI.port);
    return port ? { W: 720, H: 1280, aY: 826, aCx: 360, aStep: 172, eY: 540, eCx: 360, eStep: 225, slope: 0.0004, ring: [0.88, 1.06], aw: 169, ah: 226 }
      : { W: 1280, H: 720, aY: 656, aCx: 392, aStep: 164, eY: 392, eCx: 640, eStep: 235, slope: 0.0005, ring: [0.95, 1.16], aw: 158, ah: 206 };
  }
  const scAt = (y) => clamp(1 + (y - C.aY) * C.slope, 0.6, 1.25);
  function size(u) {
    if (u.side === 'a') return { w: C.aw, h: C.ah };
    if (u.boss) return port ? { w: 340, h: 450 } : { w: 270, h: 350 };
    return port ? { w: 210, h: 280 } : { w: 196, h: 262 };
  }
  /* projection of a design-space point through the camera at parallax depth d */
  function proj(x, y, d) {
    const zd = 1 + (cam.z - 1) * d, k = d * zd;
    return { x: M.x + (x - M.x) * zd - (S.fx - M.x) * k, y: M.y + (y - M.y) * zd - (S.fy - M.y) * k, zd: zd };
  }

  /* ---------------- units ---------------- */
  function mk(u) {
    const sz = size(u), h = (u.key || u.id || u.name || '').length * 2.399 + (S.units.length * 1.7);
    return { u: u, el: u.el, spr: u.el.querySelector('.c-spr'), sh: u.el.querySelector('.c-shadow'), side: u.side, w: sz.w, h: sz.h, boss: !!u.boss, bx: 0, by: 0, tx: 0, ty: 0, k: 1, placed: false,
      ox: 0, oy: 0, vx: 0, vy: 0, tox: 0, toy: 0, rot: 0, rv: 0, lift: 0, lv: 0, sq: 1, sqv: 0, pun: 0, punv: 0, tpun: 0, ph: h % 6.283, lunging: false, z: -1, px: 0, py: 0 };
  }
  S.add = function (u) {
    if (!C) C = cfg(); S.units = S.units.filter((s) => s.u !== u); S.units.push(mk(u));
  };
  S.clearSide = function (side) { S.units = S.units.filter((s) => s.side !== side); };
  const find = (u) => S.units.find((s) => s.u === u);
  S.layout = function () {
    C = cfg(); W = C.W; H = C.H; M = { x: W / 2, y: H / 2 };
    const live = S.units.filter((s) => s.el && s.el.isConnected && !s.el.classList.contains('gone'));
    const al = live.filter((s) => s.side === 'a'), en = live.filter((s) => s.side === 'e');
    const n = al.length;
    al.forEach((s, i) => {
      s.tx = C.aCx - (n - 1) * C.aStep / 2 + i * C.aStep; s.ty = C.aY + (n > 2 ? -17 * Math.sin(Math.PI * i / (n - 1)) : 0); s.k = 1;
    });
    const boss = en.find((s) => s.boss);
    if (boss) {
      boss.tx = C.eCx; boss.ty = C.eY - 12; boss.k = 1;
      en.filter((s) => s !== boss).forEach((s, i) => { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2); s.tx = C.eCx + side * ((boss.w * 0.9) / 2 + s.w * 0.8 / 2 - 6 + row * 70); s.ty = C.eY + 38; s.k = 0.82; });
    } else {
      const m = en.length, step = Math.min(C.eStep, (W - 80) / Math.max(1, m));
      en.forEach((s, i) => { s.tx = C.eCx - (m - 1) * step / 2 + i * step; s.ty = C.eY + (m === 3 && i === 1 ? -26 : 0); s.k = 1; });
    }
    live.forEach((s) => { s.w = size(s.u).w; s.h = size(s.u).h; if (!s.placed) { s.bx = s.tx; s.by = s.ty; s.placed = true; } });
    placeProps();
  };

  /* ---------------- props: ritual circles, stone lanterns, hanging lanterns ---------------- */
  function mkProp(cls, html, o) {
    const e = document.createElement('div'); e.className = 'prop ' + cls; e.innerHTML = html || ''; if (o.sl) e.style.setProperty('--sl', o.sl + 'px');
    world.insertBefore(e, $('cvAmb')); const p = Object.assign({ el: e, x: 0, y: 0, d: 1, s: 1, ay: 0.5, w: e.offsetWidth || 100, h: e.offsetHeight || 100 }, o); S.props.push(p); return p;
  }
  function buildProps() {
    S.props.forEach((p) => p.el.remove()); S.props = [];
    mkProp('ring e', '<div class="rr"></div><div class="rg"><i></i></div>', { id: 'ringE', w: 640, h: 640, ay: 0.5 });
    mkProp('ring a', '<div class="rr"></div><div class="rg"><i></i></div>', { id: 'ringA', w: 640, h: 640, ay: 0.5 });
    mkProp('toro', '', { id: 'toroL', w: 100, h: 220, ay: 1, d: 0.8 }); mkProp('toro', '', { id: 'toroR', w: 100, h: 220, ay: 1, d: 0.8 });
    mkProp('hl', '<div class="sw"><div class="str"></div><div class="lamp"></div></div>', { id: 'hlFarL', w: 80, h: 300, ay: 0, d: 0.55, sl: 70 });
    mkProp('hl', '<div class="sw"><div class="str"></div><div class="lamp"></div></div>', { id: 'hlFarR', w: 80, h: 300, ay: 0, d: 0.55, sl: 90 });
    mkProp('hl near', '<div class="sw"><div class="str"></div><div class="lamp"></div></div>', { id: 'hlNearL', w: 80, h: 300, ay: 0, d: 1.4, sl: 120 });
    mkProp('hl near', '<div class="sw"><div class="str"></div><div class="lamp"></div></div>', { id: 'hlNearR', w: 80, h: 300, ay: 0, d: 1.4, sl: 96 });
  }
  function placeProps() {
    const g = (id) => S.props.find((p) => p.id === id); if (!g('ringE')) return;
    const set = (id, x, y, s) => { const p = g(id); p.x = x; p.y = y; p.s = s; };
    set('ringE', C.eCx, C.eY + 4, C.ring[0]); g('ringE').d = DE; set('ringA', C.aCx, C.aY + 2, C.ring[1]); g('ringA').d = DA;
    if (port) { set('toroL', 62, 452, 0.82); set('toroR', 658, 452, 0.82); set('hlFarL', 190, 0, 0.7); set('hlFarR', 540, 0, 0.7); set('hlNearL', 34, 0, 1.2); set('hlNearR', 688, 0, 1.2); }
    else { set('toroL', 108, 350, 0.9); set('toroR', 1172, 350, 0.9); set('hlFarL', 340, 0, 0.72); set('hlFarR', 950, 0, 0.72); set('hlNearL', 66, 0, 1.2); set('hlNearR', 1214, 0, 1.2); }
    S.props.forEach((p) => { p.el.style.zIndex = p.id.indexOf('ring') === 0 ? 400 : (p.id.indexOf('toro') === 0 ? 500 : (p.id.indexOf('Near') > 0 ? 4600 : 600)); });
  }

  /* ---------------- camera / light / shake API ---------------- */
  const fast = () => !!window.__fast;
  function solveF(px, py, d, z, sx, sy) { const zd = 1 + (z - 1) * d, k = d * zd; return { x: M.x + ((px - M.x) * zd - (sx - M.x)) / k, y: M.y + ((py - M.y) * zd - (sy - M.y)) / k }; }
  function center(s) { return { x: s.bx + s.ox, y: s.by + s.oy - s.h * scAt(s.by + s.oy) * s.k * 0.5 }; }
  S.cameraTo = function (fx, fy, z, rate) { cam.tfx = clamp(fx, M.x - W * 0.42, M.x + W * 0.42); cam.tfy = clamp(fy, M.y - H * 0.32, M.y + H * 0.32); cam.tz = clamp(z, 1, 1.5); cam.rate = rate || 5; };
  S.reset = function () { cam.tfx = M.x; cam.tfy = M.y; cam.tz = 1; cam.rate = 3.2; };
  S.focus = function (u, z) {
    if (fast()) return; const s = find(u); if (!s) return; const p = center(s), d = s.side === 'a' ? DA : DE;
    const f = solveF(p.x, p.y, d, z || 1.3, M.x + (p.x - M.x) * 0.3, M.y + (p.y - M.y) * 0.3 + 12); S.cameraTo(f.x, f.y, z || 1.3, 5.5);
  };
  S.focusBetween = function (u, targets, z) {
    if (fast()) return; const s = find(u); if (!s) return; const ts = (targets || []).map(find).filter(Boolean); if (!ts.length) return S.focus(u, z);
    const a = center(s); let tx = 0, ty = 0; ts.forEach((t) => { const c = center(t); tx += c.x / ts.length; ty += c.y / ts.length; });
    const px = a.x * 0.45 + tx * 0.55, py = a.y * 0.45 + ty * 0.55; const f = solveF(px, py, 0.97, z || 1.2, M.x + (px - M.x) * 0.2, M.y + (py - M.y) * 0.2); S.cameraTo(f.x, f.y, z || 1.2, 4.5);
  };
  S.shake = function (a) { if (S.level >= 2) a *= 0.4; S.trauma = Math.min(1, S.trauma + a); };
  S.hitstop = function (sec) { if (!fast()) S.hold = Math.max(S.hold, sec); };
  const PULSE = { thunder: ['#bcd0ff', 0.5, 0.8], thunderBig: ['#e2ebff', 0.85, 1], fire: ['#ff8a3a', 0.35, 0.25], fireBig: ['#ff6a2a', 0.55, 0.4], ice: ['#9fefff', 0.35, 0.2], iceBig: ['#9fefff', 0.55, 0.3], wind: ['#d6b8ff', 0.28, 0.15], windBig: ['#d6b8ff', 0.45, 0.25], water: ['#58e6a0', 0.25, 0.1], heal: ['#aaffc8', 0.25, 0.08], healBig: ['#ffe9a0', 0.3, 0.1], crush: ['#ff62d8', 0.5, 0.3], bell: ['#ff9aea', 0.3, 0.12], slashBig: ['#fff', 0.3, 0.3], claw: ['#cfe0ff', 0.2, 0.15], slash: ['#fff', 0.18, 0.12], hit: ['#fff', 0.12, 0.08], sparkle: ['#ffe9a0', 0.2, 0.1] };
  S.pulse = function (kind) {
    const p = PULSE[kind]; if (!p) return; world && world.style.setProperty('--lc', p[0]); S.lo = Math.max(S.lo, p[1]); S.lit = Math.max(S.lit, S.level >= 2 ? 0 : p[2]);
    if (/thunder/.test(kind)) { setTimeout(() => { S.lo = Math.max(S.lo, p[1] * 0.7); S.lit = Math.max(S.lit, p[2] * 0.7); }, 110); }
  };
  S.lightning = function (a) { S.pulse(a > 0.7 ? 'thunderBig' : 'thunder'); };
  S.setSpeed = function (v) { S.speed = v || 1; };

  /* actor actions */
  S.act = function (u, sk, targets) {
    if (fast()) return; const s = find(u); if (!s) return;
    const foes = (targets || []).filter((t) => t !== u && t.side !== u.side).map(find).filter(Boolean);
    const big = !!(sk && (sk.ultimate || sk.big));
    if (foes.length) {
      let tx = 0, ty = 0; foes.forEach((t) => { tx += (t.bx + t.ox) / foes.length; ty += (t.by + t.oy) / foes.length; });
      const dx = tx - s.bx, dy = ty - s.by, dist = Math.hypot(dx, dy) || 1, f = foes.length > 1 ? 0.5 : (big ? 0.7 : 0.62), run = Math.min(dist * f, 330);
      s.tox = dx / dist * run; s.toy = dy / dist * run; s.tpun = big ? 0.16 : 0.1; s.lunging = true; s.vy -= (dy / dist) * 120; s.rv += (dx / dist) * 60;
      if (sk && sk.ultimate) S.focusBetween(u, foes.map((x) => x.u), 1.2); else if (big) S.focusBetween(u, foes.map((x) => x.u), 1.08);
    } else { s.lv += 360; s.sqv += 0.9; }
  };
  S.recover = function (u) { const s = find(u); if (s) { s.tox = 0; s.toy = 0; s.tpun = 0; s.lunging = false; } S.reset(); };
  S.hit = function (tg, att, power) {
    const s = find(tg); if (!s) return; const a = att && find(att); power = power || 240;
    let dx = 0, dy = tg.side === 'e' ? -1 : 1; if (a) { dx = s.bx - a.bx; dy = (s.by - a.by) * 0.9; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; }
    s.vx += dx * power * 1.4; s.vy += dy * power * 0.9; s.rv += (dx >= 0 ? 1 : -1) * power * 0.22; s.sqv -= power * 0.0016; s.lv += power * 0.35;
    s.punv -= power * 0.0007;
  };

  /* ---------------- ambient particles (embers, spirit wisps, near bokeh) ---------------- */
  function sprite(col) { const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'), r = g.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, col); r.addColorStop(0.35, col.replace(/[\d.]+\)$/, '.35)')); r.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = r; g.fillRect(0, 0, 48, 48); return c; }
  function initAmb() {
    acv = $('cvAmb'); actx = acv.getContext('2d'); spr.e = sprite('rgba(255,170,80,1)'); spr.w = sprite('rgba(150,180,255,1)'); spr.p = sprite('rgba(210,160,255,1)');
    parts = []; for (let i = 0; i < 46; i++) {
      const t = i % 5 === 0 ? 'w' : (i % 7 === 0 ? 'p' : 'e'), near = i > 38;
      parts.push({ t: t, x: rnd(0, 1280), y: rnd(0, 1280), z: near ? rnd(1.4, 1.9) : rnd(0.5, 1.2), r: near ? rnd(26, 52) : rnd(5, 13), a: near ? rnd(0.1, 0.2) : rnd(0.4, 0.85), vx: rnd(-6, 6), vy: t === 'e' ? rnd(-34, -10) : rnd(-8, 4), f: rnd(0.6, 2), ph: rnd(0, 6.28), tw: rnd(1.5, 3.5) });
    }
  }
  function drawAmb(dt) {
    const k = 0.5; if (acv.width !== Math.round(W * k)) { acv.width = Math.round(W * k); acv.height = Math.round(H * k); }
    actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, acv.width, acv.height); actx.globalCompositeOperation = 'lighter';
    const n = S.level >= 2 ? 0 : (S.level === 1 ? 18 : parts.length);
    for (let i = 0; i < n; i++) {
      const p = parts[i]; p.x += (p.vx + Math.sin(T * p.f + p.ph) * 9) * dt; p.y += p.vy * dt; if (p.y < -30) { p.y = H + 30; p.x = rnd(0, W); } if (p.x < -40) p.x = W + 40; if (p.x > W + 40) p.x = -40;
      const q = proj(p.x, p.y, p.z), r = p.r * q.zd * (0.7 + p.z * 0.3);
      actx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(T * p.tw + p.ph)) * (1 + S.lit * 0.8); actx.drawImage(spr[p.t], (q.x - r) * k, (q.y - r) * k, r * 2 * k, r * 2 * k);
    }
    actx.globalAlpha = 1; actx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- main loop ---------------- */
  function spr2(x, v, target, k, c, dt) { let n = Math.max(1, Math.ceil(dt / 0.012)); const h = dt / n; for (let i = 0; i < n; i++) { v += (k * (target - x) - c * v) * h; x += v * h; } return [x, v]; }
  function governor(dtr) {
    S.frames++; if (S.fixed) return; if (S.frames < 40 || dtr > 0.3) return;
    govAcc += dtr; govN++; if (govN >= 50) { const avg = govAcc / govN; S.fps = Math.round(1 / avg); govN = 0; govAcc = 0; if (avg > 0.034 && S.level < 2) setLevel(S.level + 1, true); }
  }
  function setLevel(l, resetWin) { S.level = l; if (world) { world.classList.remove('fx1', 'fx2'); if (l) world.classList.add('fx' + l); } if (bg) bg.classList.toggle('bgdof', l === 0); if (resetWin) { S.frames = 0; } drift = l >= 2 ? 0 : 8; }
  function frame(now) {
    if (!S.running) return;
    requestAnimationFrame(frame);
    const app = $('app'); if (app.dataset.screen !== 'battle') { stop(); return; }
    let dtr = (now - last) / 1000; last = now; if (!(dtr > 0) || dtr > 0.25) dtr = 1 / 60; T = now / 1000;
    if (window.UI && (!!UI.port !== port || UI.W !== W)) { S.layout(); }
    governor(dtr);
    if (S.hold > 0) S.hold -= dtr;
    const sim = Math.min(0.05, dtr) * (S.hold > 0 ? 0.1 : 1) * (1 + (S.speed - 1) * 0.6);
    /* camera */
    const a = 1 - Math.exp(-cam.rate * dtr); cam.fx += (cam.tfx - cam.fx) * a; cam.fy += (cam.tfy - cam.fy) * a; cam.z += (cam.tz - cam.z) * a;
    S.trauma = Math.max(0, S.trauma - dtr * 1.7); const tr = S.trauma * S.trauma * 18;
    S.fx = cam.fx + Math.sin(T * 0.23) * drift + Math.sin(T * 61) * tr + Math.sin(T * 37.3 + 1) * tr * 0.6;
    S.fy = cam.fy + Math.cos(T * 0.17) * drift * 0.5 + Math.sin(T * 53 + 2) * tr * 0.8;
    /* lighting */
    S.lit = Math.max(0, S.lit - dtr * 3.2); S.lo = Math.max(0, S.lo - dtr * 2.4);
    if (S.storm && T > nextBolt) { S.lightning(0.5); nextBolt = T + rnd(5, 11); }
    if (Math.abs(S.lit - lastLit) > 0.015 || (S.lit === 0 && lastLit !== 0)) { world.style.setProperty('--lit', S.lit.toFixed(2)); lastLit = S.lit; }
    if (Math.abs(S.lo - lastLo) > 0.015 || (S.lo === 0 && lastLo !== 0)) { world.style.setProperty('--lo', S.lo.toFixed(2)); lastLo = S.lo; }
    /* parallax layers */
    for (const L of layerEls) {
      const zd = 1 + (cam.z - 1) * L.d, k = L.d * zd, bs = zd * L.base, mx = (bs - 1) * W / 2 + L.ex * W, my = (bs - 1) * H / 2 + L.ey * H;
      const tx = clamp(-(S.fx - M.x) * k, -mx, mx), ty = clamp(-(S.fy - M.y) * k, -my, my); L.el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + bs.toFixed(4) + ')';
    }
    /* props */
    for (const p of S.props) { const q = proj(p.x, p.y, p.d), sc = p.s * q.zd; p.el.style.transform = 'translate3d(' + (q.x - p.w / 2).toFixed(1) + 'px,' + (q.y - p.h * p.ay).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')'; p.el.style.transformOrigin = '50% ' + (p.ay * 100) + '%'; }
    /* units */
    const sm = 1 - Math.exp(-6 * dtr);
    for (const s of S.units) {
      if (!s.el.isConnected) continue;
      const u = s.u, dead = !u.alive, active = s.el.classList.contains('active');
      s.bx += (s.tx - s.bx) * sm; s.by += (s.ty - s.by) * sm;
      let r;
      r = spr2(s.ox, s.vx, s.tox, 190, 21, sim); s.ox = r[0]; s.vx = r[1]; r = spr2(s.oy, s.vy, s.toy, 190, 21, sim); s.oy = r[0]; s.vy = r[1];
      r = spr2(s.rot, s.rv, dead ? 14 : 0, 130, 11, sim); s.rot = r[0]; s.rv = r[1];
      const liftT = dead ? -4 : (active ? 12 : 0) + (s.side === 'e' ? 5 + (s.boss ? 4 : 0) + Math.sin(T * 1.5 + s.ph) * (s.boss ? 7 : 4) : 0);
      r = spr2(s.lift, s.lv, liftT, 150, 15, sim); s.lift = r[0]; s.lv = r[1];
      r = spr2(s.sq, s.sqv, 1, 220, 15, sim); s.sq = r[0]; s.sqv = r[1];
      r = spr2(s.pun, s.punv, s.tpun, 200, 17, sim); s.pun = r[0]; s.punv = r[1];
      const fx = s.bx + s.ox, fy = s.by + s.oy, d = s.side === 'a' ? DA : DE, sc = scAt(fy) * s.k * (1 + s.pun) * (active ? 1.04 : 1);
      const q = proj(fx, fy, d), tsx = T * (s.boss ? 0.7 : 1), br = dead ? 0 : Math.sin(tsx * 2.1 + s.ph);
      s.px = q.x; s.py = q.y;
      const total = sc * q.zd;
      s.el.style.transform = 'translate3d(' + (q.x - s.w / 2).toFixed(1) + 'px,' + (q.y - s.h).toFixed(1) + 'px,0) scale(' + total.toFixed(4) + ')';
      const z = (s.side === 'a' ? 3000 : 1000) + Math.round(fy) + (s.lunging ? 1500 : 0); if (z !== s.z) { s.z = z; s.el.style.zIndex = z; }
      const sy = 1 + 0.017 * br + (s.sq - 1), sx = 1 - 0.008 * br - (s.sq - 1) * 0.6;
      const sway = dead ? 0 : Math.sin(tsx * 1.15 + s.ph * 1.7) * (s.boss ? 0.8 : 1.3), lean = clamp(s.vx * 0.011, -9, 9);
      const ry = clamp(-(q.x - M.x) / (W / 2), -1, 1) * 10 + Math.sin(tsx * 0.8 + s.ph) * 2.2 + (s.lunging ? clamp(s.ox * 0.05, -8, 8) : 0);
      s.spr.style.transform = 'translate3d(0,' + (-s.lift).toFixed(1) + 'px,0) rotate(' + (s.rot + sway + lean).toFixed(2) + 'deg) perspective(900px) rotateY(' + ry.toFixed(2) + 'deg) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
      const sh = clamp(1 - s.lift * 0.006 - Math.abs(s.oy) * 0.0006, 0.55, 1.05); s.sh.style.transform = 'scale(' + sh.toFixed(3) + ',' + (sh * (1 + s.pun * 0.5)).toFixed(3) + ')';
    }
    if (S.level < 2) drawAmb(Math.min(0.05, dtr));
  }
  function start() { if (S.running) return; S.running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() {
    S.running = false; if (bg) { bg.classList.remove('bgdof'); bg.style.transform = ''; }
  }
  /* battle is over: stop the 2.5D loop and wipe its canvases now, so the victory/chest screens do not keep running (and holding) a full battle renderer behind them */
  S.end = function () { stop(); try { if (actx) actx.clearRect(0, 0, acv.width, acv.height); } catch (e) {} };
  S.begin = function (stageDef) {
    world = $('world'); bg = $('bg'); C = cfg(); W = C.W; H = C.H; M = { x: W / 2, y: H / 2 };
    if (!S.props.length || !S.props[0].el.isConnected) buildProps();
    if (!parts.length) initAmb();
    const q = /[?&]fx=(\w+)/.exec(location.search); S.fixed = !!q || !!window.__noGov;
    S.units = []; S.trauma = 0; S.lit = 0; S.lo = 0; S.hold = 0; lastLit = lastLo = -1; S.frames = 0; govN = 0; govAcc = 0;
    cam.fx = cam.tfx = M.x; cam.fy = cam.tfy = M.y; cam.z = cam.tz = 1; S.fx = M.x; S.fy = M.y;
    layerEls = Object.keys(LAY).map((id) => ({ id: id, el: $(id), d: parseFloat($(id).dataset.d), base: LAY[id].base, ex: LAY[id].ex, ey: LAY[id].ey }));
    layerEls.push({ id: 'bg', el: bg, d: 0.15, base: 1.1, ex: 0, ey: 0 });
    setLevel(q ? ({ full: 0, mid: 1, low: 2 }[q[1]] || 0) : (S.fixed ? 0 : Math.max(S.level, HYlv())), false);
    S.storm = !!(stageDef && (stageDef.bg === 'bg_storm' || stageDef.ch === 2 || stageDef.musicBoss)); nextBolt = T + rnd(2.5, 5);
    start();
  };
  S.stats = function () {
    return { running: S.running, frames: S.frames, level: S.level, fps: S.fps, port: port, zoom: +cam.z.toFixed(3), trauma: +S.trauma.toFixed(2), lit: +S.lit.toFixed(2),
      units: S.units.map((s) => ({ side: s.side, name: s.u.name, x: Math.round(s.px), y: Math.round(s.py), ox: Math.round(s.ox), oy: Math.round(s.oy), z: s.z, alive: s.u.alive })),
      layers: layerEls.map((l) => l.el.style.transform), props: S.props.length };
  };
  /* iOS / lite devices start on the mid tier, safe mode on low; the fps governor can still step down further */
  function HYlv() { const h = window.HY || {}; return h.lite2 ? 2 : h.lite ? 1 : 0; }
  S.degrade = function () { if (S.level < 2) setLevel(2, true); };
  window.Stage = S;
})();
