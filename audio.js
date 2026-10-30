/* audio.js - fully procedural Web Audio: convolution reverb, Karplus-Strong koto/shamisen, shakuhachi breath voice, taiko/gong/bell voices,
   six sequenced BGMs (title / story / camp / map / battle / boss) and layered SFX. No audio files, nothing to license. */
(function () {
  let ctx = null, master = null, comp = null, sfxBus = null, musBus = null, duckG = null, rvSfx = null, rvMus = null, conv = null, noiseBuf = null;
  let curBus = null, muted = false, forceMuted = false, musicOn = true, mode = null, timer = null, nextT = 0, step = 0, bar = 0;
  const HIRA = [0, 2, 3, 7, 8], INSEN = [0, 1, 5, 7, 10];
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const deg = (i, base, sc) => { sc = sc || HIRA; const o = Math.floor(i / 5); return midi(base + sc[((i % 5) + 5) % 5] + 12 * o); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  let ran = false;
  function build(c) {
    ctx = c; ran = c.state === 'running';
    if (typeof c.startRendering !== 'function') c.onstatechange = () => { if (c.state === 'running') ran = true; else if (ran && c.state !== 'closed' && !document.hidden) { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } };
    master = ctx.createGain(); comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    const sh = ctx.createWaveShaper(), cv = new Float32Array(2048); for (let i = 0; i < 2048; i++) { const x = i / 1023.5 - 1; cv[i] = Math.tanh(x * 1.15) / Math.tanh(1.15); } sh.curve = cv; sh.oversample = 'none';
    master.connect(comp); comp.connect(sh); sh.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    duckG = ctx.createGain(); duckG.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(duckG);
    // procedural impulse response (dark, stereo, ~2.4s) -> convolution reverb
    const IRD = (window.HY && window.HY.lite) ? 1.3 : 2.4, sr = ctx.sampleRate, len = Math.floor(sr * IRD), ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / sr, k = 0.12 + 0.8 * Math.min(1, t / (IRD * 0.667)); lp += (Math.random() * 2 - 1 - lp) * (1 - k); d[i] = lp * Math.pow(1 - t / IRD, 2.2) * Math.exp(-t * 1.3) * (i < sr * 0.012 ? i / (sr * 0.012) : 1); } }
    conv = ctx.createConvolver(); conv.buffer = ir; const out = ctx.createGain(); out.gain.value = 0.55; conv.connect(out); out.connect(master);
    rvSfx = ctx.createGain(); rvSfx.gain.value = 1; rvSfx.connect(conv); rvMus = ctx.createGain(); rvMus.gain.value = 1; rvMus.connect(conv);
    const nl = sr * 2; noiseBuf = ctx.createBuffer(1, nl, sr); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    curBus = ctx.createGain(); curBus.connect(musBus);
    applyMute();
  }
  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { build(new AC()); } catch (e) { ctx = null; return false; }
    return true;
  }
  function applyMute() { if (master) master.gain.setTargetAtTime((muted || forceMuted) ? 0 : 1.35, ctx.currentTime, 0.02); }
  function musVol() { if (musBus) musBus.gain.setTargetAtTime(musicOn && mode ? 0.5 : 0, ctx.currentTime, 0.3); }
  function duck(t, depth, dur) { if (!duckG) return; const g = duckG.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(depth, t + 0.05); g.linearRampToValueAtTime(1, t + dur); }

  /* ---------- voices ---------- */
  const sendFor = (bus) => (bus === sfxBus || !bus ? rvSfx : rvMus);
  /* live one-shot voices; on lite devices extra voices are dropped so a combo storm cannot pile up hundreds of nodes */
  let live = 0; const VMAX = () => ((window.HY && window.HY.lite) ? 28 : 64);
  function gone(src, nodes) { live++; src.onended = () => { live--; try { for (let i = 0; i < nodes.length; i++) nodes[i].disconnect(); } catch (e) {} }; }
  function tone(f, t0, dur, type, vol, o) {
    if (live > VMAX()) return;
    o = o || {}; const os = ctx.createOscillator(), g = ctx.createGain(); os.type = type || 'sine'; os.frequency.setValueAtTime(f, t0);
    if (o.det) os.detune.value = o.det; if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + (o.sd || dur));
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + (o.a || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let n = os; if (o.lp) { const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; os.connect(f2); n = f2; }
    n.connect(g); const bus = o.bus || sfxBus; g.connect(bus); if (o.rv) { const s = ctx.createGain(); s.gain.value = o.rv; g.connect(s); s.connect(sendFor(bus)); }
    gone(os, [os, g]); os.start(t0); os.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, f0, f1, type, o) {
    if (live > VMAX()) return;
    o = o || {}; const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = rnd(0.9, 1.1);
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; if (o.q) f.Q.value = o.q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const g = ctx.createGain(); const a = o.a || 0.002; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); const bus = o.bus || sfxBus; g.connect(bus); if (o.rv) { const r = ctx.createGain(); r.gain.value = o.rv; g.connect(r); r.connect(sendFor(bus)); }
    gone(s, [s, f, g]); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  /* Karplus-Strong plucked string, rendered once per pitch & cached as a buffer */
  const ks = new Map();
  function ksBuf(f, kind) {
    const key = kind + Math.round(f * 2); let b = ks.get(key); if (b) return b;
    const sr = ctx.sampleRate, N = Math.max(4, Math.round(sr / f - 0.5)), len = Math.floor(sr * (kind === 'koto' ? 2.4 : kind === 'bass' ? 1.5 : 1.3));
    b = ctx.createBuffer(1, len, sr); const d = b.getChannelData(0), line = new Float32Array(N);
    const br = kind === 'koto' ? 0.5 : kind === 'bass' ? 0.7 : 0.15; let lp = 0;
    for (let i = 0; i < N; i++) { lp += ((Math.random() * 2 - 1) - lp) * (1 - br * 0.9); line[i] = lp * 2.2; }
    const pp = Math.floor(N * (kind === 'koto' ? 0.12 : 0.2)); for (let i = N - 1; i >= pp; i--) line[i] -= line[i - pp] * 0.6;
    const dec = kind === 'koto' ? 0.9988 : kind === 'bass' ? 0.996 : 0.9962, dmp = kind === 'koto' ? 0.5 : 0.5;
    let idx = 0, mx = 0.0001;
    for (let n = 0; n < len; n++) { const nx = idx + 1 === N ? 0 : idx + 1, y = line[idx]; d[n] = y; line[idx] = dec * (y * dmp + line[nx] * (1 - dmp)); idx = nx; if (Math.abs(y) > mx) mx = Math.abs(y); }
    const sc = 0.9 / mx; for (let n = 0; n < len; n++) d[n] *= sc;
    if (kind === 'shami') { const sw = Math.floor(sr * 0.03); for (let n = 0; n < sw; n++) d[n] += (Math.random() * 2 - 1) * 0.35 * (1 - n / sw); } // sawari buzz
    b._fa = sr / (N + 0.5); if (ks.size > 64) ks.delete(ks.keys().next().value); ks.set(key, b); return b;
  }
  function string(kind, t0, f, vol, o) {
    o = o || {}; const s = ctx.createBufferSource(); s.buffer = ksBuf(f, kind); s.playbackRate.value = f / s.buffer._fa;
    const g = ctx.createGain(); const rel = o.rel || (kind === 'koto' ? 1.8 : 0.9); g.gain.setValueAtTime(vol, t0); g.gain.setTargetAtTime(0.0001, t0 + (o.hold || 0.25), rel * 0.4);
    let n = s; if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; s.connect(fl); n = fl; }
    n.connect(g); const bus = o.bus || sfxBus; g.connect(bus); const rv = o.rv == null ? 0.35 : o.rv; if (rv) { const r = ctx.createGain(); r.gain.value = rv; g.connect(r); r.connect(sendFor(bus)); }
    s.start(t0); s.stop(t0 + Math.min(s.buffer.duration / s.playbackRate.value, 2.4));
  }
  const koto = (t, f, v, o) => string('koto', t, f, v, o), shami = (t, f, v, o) => string('shami', t, f, v, o), bassS = (t, f, v, o) => string('bass', t, f, v, o);
  function strum(t, freqs, v, o) { freqs.forEach((f, i) => shami(t + i * 0.018, f, v * (0.8 + 0.2 * (i / freqs.length)), o)); }
  function shaku(t0, f, dur, vol, o) {
    o = o || {}; const bus = o.bus || sfxBus, out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(4200, f * 5); lp.connect(out); out.connect(bus);
    out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.14, dur * 0.4)); out.gain.setValueAtTime(vol, t0 + Math.max(0.1, dur - 0.3)); out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const rv = ctx.createGain(); rv.gain.value = o.rv == null ? 0.7 : o.rv; out.connect(rv); rv.connect(sendFor(bus));
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.1; lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(f * 0.011, t0 + Math.min(dur * 0.8, 0.7)); lfo.connect(lg);
    [[1, 'sine', 1], [2, 'triangle', 0.22], [3, 'sine', 0.07]].forEach((h) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = h[1]; os.frequency.setValueAtTime(f * h[0] * (o.scoop ? 0.93 : 1), t0); if (o.scoop) os.frequency.exponentialRampToValueAtTime(f * h[0], t0 + 0.16); g.gain.value = h[2]; lg.connect(os.frequency); os.connect(g); g.connect(lp); os.start(t0); os.stop(t0 + dur + 0.05); });
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    // breath
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 1.7; bp.Q.value = 2.5; const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t0); ng.gain.exponentialRampToValueAtTime(vol * 0.9, t0 + 0.05); ng.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + 0.3); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t0, Math.random()); ns.stop(t0 + dur + 0.05);
  }
  function pad(t0, f, dur, vol, o) {
    o = o || {}; const bus = o.bus || sfxBus, out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(o.lp0 || 300, t0); lp.frequency.linearRampToValueAtTime(o.lp1 || 900, t0 + dur * 0.6); lp.connect(out); out.connect(bus);
    out.gain.setValueAtTime(0.0001, t0); out.gain.linearRampToValueAtTime(vol, t0 + Math.min(dur * 0.4, 2.2)); out.gain.setValueAtTime(vol, t0 + dur * 0.6); out.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    if (o.rv !== 0) { const r = ctx.createGain(); r.gain.value = o.rv || 0.5; out.connect(r); r.connect(sendFor(bus)); }
    [-9, 8, 0].forEach((dt, i) => { const os = ctx.createOscillator(); os.type = i === 2 ? 'triangle' : 'sawtooth'; os.frequency.value = f; os.detune.value = dt; const g = ctx.createGain(); g.gain.value = i === 2 ? 0.7 : 0.35; os.connect(g); g.connect(lp); os.start(t0); os.stop(t0 + dur + 0.05); });
  }
  function taiko(t0, vol, pitch, o) {
    o = o || {}; pitch = pitch || 90; const bus = o.bus || sfxBus, d = o.long ? 0.9 : 0.5;
    tone(pitch * 2.1, t0, d, 'sine', vol, { slide: pitch * 0.85, sd: 0.09, a: 0.002, bus: bus, rv: 0.22 });
    tone(pitch * 1.5, t0, 0.14, 'triangle', vol * 0.45, { slide: pitch, sd: 0.1, a: 0.002, bus: bus });
    noise(t0, 0.1, vol * 0.8, 1800, 300, 'bandpass', { bus: bus, q: 0.8, rv: 0.2 }); noise(t0, 0.025, vol * 0.4, 7000, 3000, 'highpass', { bus: bus });
    if (o.sub) tone(pitch * 0.5, t0, 0.8, 'sine', vol * 0.6, { slide: pitch * 0.32, a: 0.004, bus: bus });
  }
  function shime(t0, vol, bus) { tone(220, t0, 0.16, 'triangle', vol, { slide: 150, sd: 0.06, a: 0.002, bus: bus, rv: 0.15 }); noise(t0, 0.05, vol * 0.8, 3500, 900, 'bandpass', { bus: bus }); }
  function wood(t0, vol, f, bus) { tone(f || 1700, t0, 0.07, 'sine', vol, { slide: (f || 1700) * 0.7, a: 0.001, bus: bus }); noise(t0, 0.025, vol * 0.7, 4200, 1800, 'bandpass', { bus: bus, q: 2 }); }
  function bell(t0, f, vol, o) { o = o || {}; const dec = o.dec || 1.8; [[1, 1], [2.0, 0.5], [2.76, 0.4], [5.4, 0.22], [8.93, 0.12]].forEach((p, i) => tone(f * p[0], t0, dec / (i * 0.7 + 1) + 0.2, 'sine', vol * p[1], { a: 0.002, bus: o.bus, rv: 0.55, det: i * 3 })); }
  function gong(t0, f, vol, o) { o = o || {}; [1, 1.52, 2.31, 2.74, 3.9, 5.1, 6.7].forEach((m, i) => tone(f * m, t0, 3.4 / (1 + i * 0.35), 'sine', vol / (1 + i * 0.5), { a: 0.012 + i * 0.01, bus: o.bus, rv: 0.6, det: (i % 2 ? 7 : -7) })); noise(t0, 2.4, vol * 0.35, 3000, 200, 'bandpass', { a: 0.15, bus: o.bus, rv: 0.5, q: 0.6 }); }
  function chime(t0, f, vol, o) { tone(f, t0, 0.9, 'sine', vol, { a: 0.002, bus: o && o.bus, rv: 0.6 }); tone(f * 2.01, t0, 0.5, 'sine', vol * 0.4, { a: 0.002, bus: o && o.bus, rv: 0.6 }); tone(f * 3.99, t0, 0.25, 'sine', vol * 0.15, { a: 0.002, bus: o && o.bus }); }
  function whoosh(t0, dur, vol, up, o) { o = o || {}; noise(t0, dur, vol, up ? 300 : 7000, up ? 8000 : 300, 'bandpass', { a: dur * 0.5, q: 1.2, rv: 0.3, bus: o.bus }); }
  function riser(t0, dur, vol) { whoosh(t0, dur, vol, true); tone(110, t0, dur, 'sawtooth', vol * 0.12, { slide: 880, a: dur * 0.7, lp: 2200, rv: 0.3 }); }
  function boom(t0, vol, f) { f = f || 50; tone(f * 2.4, t0, 1.1, 'sine', vol, { slide: f * 0.8, sd: 0.25, a: 0.003, rv: 0.4 }); noise(t0, 0.6, vol * 0.9, 2500, 80, 'lowpass', { rv: 0.5 }); }
  const can = () => ensure() && ctx.state !== 'closed';
  const run = (fn) => () => { if (!can()) return; fn(ctx.currentTime); };
  const runA = (fn) => function () { if (!can()) return; fn(ctx.currentTime, arguments[0], arguments[1]); };

  const A = {
    /* iOS Safari reports 'interrupted' (calls, Siri, app switch) as well as 'suspended': resume from any non-running state; swallow the rejection when there is no gesture yet */
    /* non-gesture recovery (tab visible again, bfcache restore): only if audio has already run once, so it never creates a context or logs an autoplay warning before the first tap */
    wake() { if (ctx && ran && ctx.resume && typeof ctx.startRendering !== 'function' && ctx.state !== 'running' && ctx.state !== 'closed') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } },
    unlock() { if (!ensure() || !ctx.resume || typeof ctx.startRendering === 'function') return; if (ctx.state !== 'running' && ctx.state !== 'closed') { try { const p = ctx.resume(); if (p && p.then) p.then(() => { ran = true; }, () => {}); } catch (e) {} } else ran = true; },
    get muted() { return muted; }, setMuted(m) { muted = !!m; if (ctx) applyMute(); },
    get musicOn() { return musicOn; }, setMusicOn(m) { musicOn = !!m; if (ctx) musVol(); },
    setForceMuted(m) { forceMuted = !!m; if (ctx) applyMute(); },

    /* ---- UI ---- */
    tap: run((t) => { wood(t, 0.34, 1900, sfxBus); tone(520, t, 0.08, 'triangle', 0.09, { rv: 0.2 }); }),
    ok: run((t) => { wood(t, 0.22, 1500); koto(t + 0.02, midi(74), 0.32, { rv: 0.4 }); koto(t + 0.09, midi(81), 0.3, { rv: 0.5 }); chime(t + 0.09, midi(93), 0.04); }),
    back: run((t) => { wood(t, 0.18, 1100); koto(t + 0.02, midi(69), 0.26, { rv: 0.4 }); koto(t + 0.08, midi(62), 0.24, { rv: 0.4 }); }),
    text: run((t) => { tone(1500 + Math.random() * 300, t, 0.02, 'triangle', 0.018); }),
    turn: run((t) => { wood(t, 0.08, 1300); }),
    tab: run((t) => { wood(t, 0.16, 2100); koto(t + 0.01, midi(81), 0.18, { rv: 0.4 }); }),
    /* ---- combat ---- */
    slash: run((t) => { whoosh(t, 0.2, 0.42, false); noise(t + 0.05, 0.12, 0.38, 7000, 1500, 'bandpass', { q: 1.5, rv: 0.1 }); tone(1900, t + 0.04, 0.12, 'sawtooth', 0.04, { slide: 400, lp: 4000 }); }),
    claw: run((t) => { for (let i = 0; i < 3; i++) { noise(t + i * 0.045, 0.11, 0.32, 8000, 1500, 'bandpass', { q: 1.8 }); } }),
    hit: run((t) => { taiko(t, 0.6, 100); noise(t, 0.1, 0.35, 3200, 300, 'lowpass', { rv: 0.1 }); }),
    impact: runA((t, crit, pw) => {
      pw = Math.max(0.15, pw || 0.4);
      tone(190, t, 0.2, 'sine', 0.5 * (0.5 + pw * 0.6), { slide: 45, sd: 0.14, a: 0.002 }); noise(t, 0.07, 0.5, 5000, 600, 'bandpass', { q: 0.7 }); noise(t, 0.015, 0.35, 9000, 4000, 'highpass');
      if (crit) { tone(1568, t, 0.7, 'sine', 0.13, { a: 0.001, rv: 0.6 }); tone(2349, t + 0.02, 0.6, 'sine', 0.08, { rv: 0.6 }); tone(3136, t + 0.04, 0.5, 'triangle', 0.05, { rv: 0.6 }); }
    }),
    crit: run((t) => { taiko(t, 0.85, 75, { sub: true }); noise(t, 0.3, 0.55, 6500, 400, 'bandpass', { rv: 0.3 }); chime(t + 0.02, midi(96), 0.12); chime(t + 0.07, midi(103), 0.09); whoosh(t - 0.0, 0.25, 0.25, false); }),
    combo: runA((t, n) => { const k = Math.min(14, n | 0); koto(t, deg(k, 74, HIRA), 0.2, { rv: 0.4 }); if (k % 4 === 0) chime(t, midi(96 + (k >> 2)), 0.06); }),
    thunder: run((t) => { noise(t, 0.12, 0.9, 9000, 1500, 'highpass'); noise(t, 0.6, 0.8, 7000, 150, 'bandpass', { rv: 0.3 }); noise(t + 0.03, 1.4, 0.55, 700, 50, 'lowpass', { rv: 0.6 }); boom(t + 0.02, 0.7, 48); }),
    fire: run((t) => { noise(t, 0.7, 0.5, 600, 3800, 'bandpass', { a: 0.12, q: 0.9, rv: 0.2 }); noise(t + 0.1, 0.5, 0.35, 3000, 500, 'bandpass', { q: 1.5 }); tone(200, t, 0.5, 'sawtooth', 0.07, { slide: 600, lp: 1800 }); boom(t + 0.12, 0.3, 70); }),
    ice: run((t) => { [2093, 2637, 3136, 3951, 4699].forEach((f, i) => tone(f, t + i * 0.03, 0.55, 'sine', 0.1, { a: 0.001, rv: 0.6 })); noise(t, 0.15, 0.35, 10000, 3500, 'highpass'); noise(t + 0.02, 0.25, 0.2, 5000, 1500, 'bandpass', { q: 3 }); }),
    wind: run((t) => { whoosh(t, 0.55, 0.45, true); whoosh(t + 0.25, 0.5, 0.3, false); }),
    water: run((t) => { tone(620, t, 0.28, 'sine', 0.2, { slide: 140, a: 0.003, rv: 0.4 }); tone(900, t + 0.06, 0.2, 'sine', 0.13, { slide: 240, rv: 0.4 }); noise(t, 0.4, 0.3, 3500, 400, 'lowpass', { rv: 0.3 }); }),
    heal: run((t) => { [0, 2, 4, 7, 9].forEach((k, i) => koto(t + i * 0.065, deg(k, 74, HIRA), 0.22, { rv: 0.6, hold: 0.5 })); chime(t + 0.3, midi(100), 0.07); pad(t, midi(62), 1.2, 0.05, { bus: sfxBus }); }),
    buff: run((t) => { koto(t, midi(79), 0.26, { rv: 0.5 }); koto(t + 0.07, midi(86), 0.26, { rv: 0.5 }); chime(t + 0.1, midi(98), 0.07); whoosh(t, 0.3, 0.12, true); }),
    debuff: run((t) => { tone(420, t, 0.4, 'sawtooth', 0.1, { slide: 120, lp: 1200, rv: 0.3 }); tone(300, t + 0.05, 0.4, 'sawtooth', 0.08, { slide: 90, lp: 900 }); }),
    guard: run((t) => { tone(260, t, 0.16, 'square', 0.14, { slide: 120, lp: 1500 }); noise(t, 0.12, 0.45, 3500, 500, 'bandpass', { q: 1 }); chime(t + 0.01, midi(88), 0.07); }),
    bell: run((t) => bell(t, 523, 0.2)),
    bellBig: run((t) => { gong(t, 130, 0.22); bell(t + 0.1, 261, 0.3); bell(t + 0.2, 392, 0.2); }),
    warn: run((t) => { tone(170, t, 0.7, 'sawtooth', 0.16, { slide: 70, lp: 900, rv: 0.4 }); taiko(t, 0.6, 70, { sub: true }); taiko(t + 0.22, 0.6, 70); tone(880, t + 0.45, 0.25, 'square', 0.04, { lp: 1800 }); }),
    crush: run((t) => { taiko(t, 1, 52, { sub: true, long: true }); boom(t, 0.9, 40); noise(t, 0.9, 0.7, 2500, 60, 'lowpass', { rv: 0.5 }); whoosh(t - 0.0, 0.3, 0.3, false); }),
    die: run((t) => { tone(340, t, 0.7, 'sawtooth', 0.1, { slide: 55, lp: 1500, rv: 0.4 }); noise(t, 0.6, 0.35, 3000, 100, 'lowpass', { rv: 0.3 }); chime(t + 0.1, midi(81), 0.05); }),
    cutin: run((t) => { duck(t, 0.35, 1.6); whoosh(t, 0.3, 0.4, true); taiko(t + 0.12, 0.8, 72, { sub: true }); taiko(t + 0.3, 0.7, 92); strum(t + 0.3, [deg(0, 50, INSEN), deg(2, 50, INSEN), deg(3, 50, INSEN), deg(5, 50, INSEN)], 0.32, { rv: 0.4 }); noise(t + 0.3, 0.7, 0.2, 8000, 800, 'bandpass', { rv: 0.4 }); chime(t + 0.34, midi(93), 0.1); }),
    bossIntro: run((t) => { duck(t, 0.18, 3.0); gong(t, 65, 0.3); riser(t, 0.75, 0.5); for (let i = 0; i < 6; i++) taiko(t + 0.1 + i * (0.12 - i * 0.012), 0.35 + i * 0.07, 62 + i * 3); boom(t + 0.74, 0.7, 38); gong(t + 0.74, 98, 0.22); taiko(t + 0.74, 0.8, 50, { sub: true, long: true }); strum(t + 0.8, [deg(0, 38, INSEN), deg(1, 38, INSEN), deg(3, 38, INSEN)], 0.4); noise(t + 0.74, 1.4, 0.4, 5000, 300, 'bandpass', { rv: 0.6 }); }),
    win: run((t) => { duck(t, 0.4, 5); taiko(t, 0.8, 85, { sub: true }); taiko(t + 0.25, 0.6, 105); [0, 2, 3, 5, 7, 8].forEach((k, i) => { koto(t + 0.3 + i * 0.11, deg(k, 74, HIRA), 0.3, { rv: 0.5 }); }); strum(t + 1.0, [deg(0, 62), deg(2, 62), deg(4, 62), deg(5, 62)], 0.4, { rv: 0.6 }); bell(t + 0.9, 880, 0.2); shaku(t + 0.8, midi(81), 2.6, 0.14); pad(t + 0.4, midi(50), 3.2, 0.06, { lp0: 500, lp1: 1500 }); }),
    lose: run((t) => { duck(t, 0.3, 4); [9, 7, 5, 3, 0].forEach((k, i) => koto(t + i * 0.3, deg(k - 5, 62, HIRA), 0.3, { rv: 0.7 })); shaku(t + 0.3, midi(64), 3.2, 0.12, { scoop: true }); taiko(t, 0.7, 50, { sub: true, long: true }); bell(t + 1.2, 131, 0.25, { dec: 3.5 }); }),
    levelup: run((t) => { [0, 1, 2, 3, 4, 5, 7].forEach((k, i) => koto(t + i * 0.07, deg(k, 74, HIRA), 0.28, { rv: 0.5 })); chime(t + 0.5, midi(105), 0.12); bell(t + 0.45, 1047, 0.15); }),
    chest: run((t) => { taiko(t, 0.5, 100); [0, 2, 3, 4, 5, 7].forEach((k, i) => koto(t + 0.1 + i * 0.06, deg(k, 74, HIRA), 0.24, { rv: 0.5 })); }),
    gacha: run((t) => { bell(t, 330, 0.25); riser(t, 0.8, 0.3); }),
    rare: run((t) => { bell(t, 440, 0.3); bell(t + 0.15, 660, 0.25); bell(t + 0.3, 880, 0.25); taiko(t, 0.8, 80, { sub: true }); chime(t + 0.3, midi(100), 0.1); }),
    thunderStory: run((t) => { noise(t, 1.2, 0.9, 5000, 80, 'bandpass', { rv: 0.5 }); boom(t, 0.7, 45); taiko(t + 0.6, 0.8, 60, { sub: true }); taiko(t + 0.9, 0.8, 60); }),

    /* ---- treasure chest sequence ---- */
    csShake: runA((t, f) => { f = f || 0; for (let i = 0; i < 3; i++) { noise(t + i * 0.07, 0.07, 0.3 + f * 0.2, 1200 + f * 900, 400, 'bandpass', { q: 3 }); } tone(80 + f * 40, t, 0.2, 'sine', 0.35 + f * 0.2, { slide: 50 }); wood(t, 0.1, 900); }),
    csHint: runA((t, i, ti) => { const sc = [0, 2, 3, 5, 7, 8][((i | 0) + (ti | 0)) % 6]; chime(t, midi(81 + sc + (ti | 0) * 2), 0.1 + 0.03 * (ti | 0)); if ((ti | 0) >= 2) tone(midi(57 + sc), t, 0.3, 'triangle', 0.05, { rv: 0.5, lp: 1500 }); }),
    csMorph: runA((t, ti) => { riser(t, 0.55 + (ti | 0) * 0.1, 0.3 + (ti | 0) * 0.05); [0, 1, 2, 3].forEach((k) => chime(t + 0.1 + k * 0.08, midi(88 + k * 3), 0.05)); }),
    csBurst: runA((t, ti) => { ti = ti | 0; duck(t, 0.4, 2); boom(t, 0.5 + ti * 0.15, 55 - ti * 3); noise(t, 0.4, 0.5, 9000, 800, 'highpass', { rv: 0.4 }); whoosh(t, 0.5, 0.3, false); [0, 4, 7, 12].slice(0, 2 + ti).forEach((k, i) => bell(t + 0.04 + i * 0.05, midi(74 + k), 0.16)); if (ti >= 2) taiko(t, 0.7, 70, { sub: true }); if (ti >= 3) gong(t, 98, 0.35); }),
    csFanfare: runA((t, ti) => {
      ti = typeof ti === 'string' ? ({ wood: 0, bronze: 1, gold: 2, legend: 3 }[ti] || 0) : (ti | 0);
      const n = [3, 5, 7, 9][ti] || 3; for (let i = 0; i < n; i++) koto(t + 0.05 + i * 0.075, deg(i + (ti > 1 ? 1 : 0), 74, HIRA), 0.26, { rv: 0.55 });
      if (ti >= 1) { taiko(t, 0.7, 88, { sub: true }); bell(t + 0.1, midi(81), 0.16); }
      if (ti >= 2) { strum(t + 0.5, [deg(0, 62), deg(2, 62), deg(4, 62), deg(5, 62), deg(7, 62)], 0.42, { rv: 0.6 }); shaku(t + 0.4, midi(86), 2.2, 0.15); for (let i = 0; i < 5; i++) taiko(t + 0.1 + i * 0.09, 0.3 + i * 0.08, 90 + i * 2); }
      if (ti >= 3) { duck(t, 0.3, 6); gong(t, 110, 0.4); pad(t, midi(50), 4.2, 0.09, { lp0: 500, lp1: 2200 }); pad(t, midi(57), 4.2, 0.07, { lp0: 500, lp1: 2200 }); for (let i = 0; i < 12; i++) chime(t + 0.5 + i * 0.075, deg(i, 86), 0.07); shaku(t + 0.9, midi(93), 2.6, 0.12, { scoop: true }); boom(t, 0.8, 42); }
    }),
    csCard: runA((t, rank, i) => { rank = rank | 0; i = i | 0; const f = midi(81 + [0, 2, 3, 5, 7, 8][i % 6]); chime(t, f, 0.1 + rank * 0.05); koto(t, f / 2, 0.14, { rv: 0.4 }); if (rank >= 1) bell(t + 0.02, f, 0.1); if (rank >= 2) { chime(t + 0.06, f * 2, 0.1); noise(t, 0.3, 0.12, 9000, 3000, 'highpass', { rv: 0.4 }); } }),
    csStar: runA((t, k) => { k = k | 0; bell(t, midi(86 + k * 3), 0.2); koto(t, midi(74 + k * 3), 0.25); taiko(t, 0.35, 90 + k * 8); }),
    csCoin: runA((t, k) => { k = (k | 0) % 6; tone(2400 + k * 140, t, 0.12, 'square', 0.04, { slide: 3000 + k * 140, lp: 6000 }); tone(3200 + k * 140, t + 0.035, 0.18, 'sine', 0.08, { rv: 0.3 }); noise(t, 0.02, 0.15, 8000, 5000, 'highpass'); }),

    /* ---- music ---- */
    music(m) {
      if (!ensure()) return;
      if (m === mode) { musVol(); return; }
      const now = ctx.currentTime; if (curBus) { const old = curBus; old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + 0.35); setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 800); }
      curBus = ctx.createGain(); curBus.connect(musBus);
      mode = m; step = 0; bar = 0; nextT = now + 0.12;
      if (!timer) timer = setInterval(() => A._sched(), 100);
      musVol();
    },
    stopMusic() { mode = null; if (ctx) musVol(); },
    _sched(until) {
      if (!ctx || !mode) return; const M = MODES[mode] || MODES.map; const lim = until != null ? until : ctx.currentTime + 0.45;
      const s16 = 60 / M.bpm / 4;
      while (nextT < lim) {
        const s = step % 16; if (s === 0) bar = Math.floor(step / 16);
        M.play(bar, s, nextT, s16, curBus); nextT += s16; step++;
      }
    },
    _attach(c) { build(c); },
    _modes() { return Object.keys(MODES); },
    _set(m) { mode = m; step = 0; bar = 0; nextT = 0; curBus = ctx.createGain(); curBus.connect(musBus); musBus.gain.value = 0.5; }
  };

  /* ---------- BGM sequencers (16 steps per bar) ---------- */
  const P1 = [4, 2, 3, 0, 2, -1, -1, -1], P2 = [3, 4, 5, 4, 3, 2, 0, -1], P3 = [0, 2, 3, 2, 0, -1, -1, -1], P4 = [5, 4, 3, 2, 3, 0, -1, -1];
  const MODES = {
    title: { bpm: 54, play(b, s, t, d, bus) {
      const R = 50; if (s === 0 && b % 4 === 0) { pad(t, midi(R - 12), d * 64, 0.1, { bus: bus, lp0: 200, lp1: 700 }); pad(t, midi(R - 5), d * 64, 0.06, { bus: bus, lp0: 220, lp1: 800 }); }
      if (s === 0 && b % 4 === 1) noise(t, d * 28, 0.05, 300, 1400, 'bandpass', { bus: bus, a: d * 14, q: 0.8, rv: 0.6 });
      if (s % 4 === 0) { const arp = [0, 2, 4, 2, 3, 2, 1, 2]; const k = arp[((b % 2) * 4 + (s >> 2)) % 8] + (b % 4 >= 2 ? 1 : 0); if ((s >> 2) % 2 === 0 || b % 2) koto(t, deg(k, R + 12), 0.2, { bus: bus, rv: 0.5 }); }
      if (s === 0 && b % 4 === 2) { const ph = [P1, P2, P3, P4][(b >> 2) % 4]; let tt = t; ph.forEach((k, i) => { if (k >= 0) shaku(tt, deg(k, R + 12), d * 2 * (ph[i + 1] === -1 ? 4 : 2) * 1.7, 0.1, { bus: bus, scoop: i === 0 }); tt += d * 4; }); }
      if (s === 0 && b % 4 === 0) taiko(t, 0.38, 56, { bus: bus, sub: true, long: true }); if (s === 8 && b % 4 === 3) taiko(t, 0.18, 70, { bus: bus });
      if (s === 0 && b % 8 === 0) bell(t, midi(R + 24), 0.07, { bus: bus, dec: 3 });
    } },
    story: { bpm: 50, play(b, s, t, d, bus) {
      const R = 48; if (s === 0 && b % 4 === 0) { pad(t, midi(R - 12), d * 64, 0.09, { bus: bus, lp0: 180, lp1: 500 }); }
      if (s === 0 && b % 2 === 0) koto(t + rnd(0, 0.05), deg([0, 3, 2, 4][(b >> 1) % 4], R + 12), 0.17, { bus: bus, rv: 0.7 });
      if (s === 8 && b % 4 === 1) koto(t, deg(7, R + 12), 0.12, { bus: bus, rv: 0.8 });
      if (s === 0 && b % 8 === 3) bell(t, midi(R + 24), 0.05, { bus: bus, dec: 3 });
      if (s === 0 && b % 4 === 2) noise(t, d * 30, 0.04, 250, 1000, 'bandpass', { bus: bus, a: d * 14, rv: 0.7 });
    } },
    camp: { bpm: 66, play(b, s, t, d, bus) {
      const R = 53; if (s === 0 && b % 4 === 0) { pad(t, midi(R - 12), d * 64, 0.08, { bus: bus, lp0: 220, lp1: 800 }); pad(t, midi(R - 5), d * 64, 0.05, { bus: bus, lp0: 220, lp1: 800 }); }
      if (s % 2 === 0) { const arp = [0, 2, 4, 2, 3, 2, 1, 2]; const k = arp[(s >> 1) % 8] + (b % 4 === 3 ? 2 : (b % 4 === 2 ? 1 : 0)); koto(t, deg(k, R + 12), s % 8 === 0 ? 0.22 : 0.13, { bus: bus, rv: 0.45 }); }
      if (s === 0 && b % 4 === 1) shaku(t, deg([4, 3, 2, 0][(b >> 2) % 4], R + 12), d * 22, 0.08, { bus: bus, scoop: true });
      if (s === 8 && b % 8 === 7) bell(t, midi(R + 24), 0.06, { bus: bus, dec: 3 });
      if (s === 0 && b % 2 === 0) wood(t, 0.04, 900, bus);
    } },
    map: { bpm: 76, play(b, s, t, d, bus) {
      const R = 50; if (s === 0 && b % 4 === 0) { pad(t, midi(R - 12), d * 64, 0.08, { bus: bus, lp0: 220, lp1: 800 }); pad(t, midi(R - 7), d * 64, 0.05, { bus: bus, lp0: 220, lp1: 800 }); }
      if (s % 2 === 0) { const pat = [[0, 2, 4, 2, 3, 2, 1, 2], [0, 3, 4, 3, 2, 1, 2, 3], [2, 4, 5, 4, 3, 2, 1, 0], [0, 2, 3, 4, 3, 2, 1, 2]][b % 4]; koto(t, deg(pat[(s >> 1) % 8], R + 12), s % 8 === 0 ? 0.24 : 0.14, { bus: bus, rv: 0.45 }); }
      if (s === 0) bassS(t, deg(b % 4 === 3 ? 3 : 0, R - 12), 0.28, { bus: bus, rv: 0.2 });
      if (s === 8 && b % 2 === 1) wood(t, 0.08, 1500, bus); if (s === 4 || s === 12) shime(t, 0.04, bus);
      if (s === 0 && b % 4 === 2) { const ph = [P2, P4][(b >> 2) % 2]; let tt = t; ph.forEach((k, i) => { if (k >= 0) shaku(tt, deg(k, R + 12), d * 3.4, 0.08, { bus: bus }); tt += d * 2; }); }
      if (s === 0 && b % 8 === 0) taiko(t, 0.2, 58, { bus: bus, sub: true });
    } },
    battle: { bpm: 128, play(b, s, t, d, bus) {
      const R = 50, SC = INSEN, bb = b % 8;
      // drums
      if (s === 0) taiko(t, 0.5, 78, { bus: bus, sub: bb % 4 === 0 }); if (s === 8) taiko(t, 0.42, 78, { bus: bus }); if (s === 6 || s === 14) taiko(t, 0.22, 105, { bus: bus }); if (s === 10 && b % 2) taiko(t, 0.26, 92, { bus: bus });
      if (s === 4 || s === 12) shime(t, 0.1, bus); if (s % 2 === 0) noise(t, 0.04, s % 4 === 0 ? 0.09 : 0.05, 9000, 5000, 'highpass', { bus: bus });
      // bass
      if (s === 0 || s === 6 || s === 10) bassS(t, deg(bb >= 4 && bb < 6 ? 3 : 0, R - 12, SC), 0.34, { bus: bus, rv: 0.1 });
      // shamisen riffs
      const riffs = [[0, -1, 2, -1, 3, 2, -1, 1, 0, -1, 4, -1, 3, 2, 1, -1], [0, 0, 2, -1, 3, -1, 2, 0, 1, -1, 2, 3, 4, -1, 3, -1], [5, -1, 4, -1, 3, 2, 3, -1, 2, -1, 1, 0, 1, -1, 0, -1], [0, -1, 0, 2, 3, -1, 5, 4, 3, -1, 2, 3, 2, 1, 0, -1]];
      const rf = riffs[[0, 1, 0, 2, 0, 1, 0, 3][bb]][s]; if (rf >= 0) shami(t, deg(rf, R + 12, SC), 0.2 + (s % 4 === 0 ? 0.06 : 0), { bus: bus, rv: 0.2 });
      if (s === 0 && bb % 4 === 0) strum(t, [deg(0, R, SC), deg(2, R, SC), deg(3, R, SC), deg(5, R, SC)], 0.28, { bus: bus, rv: 0.3 });
      if (s === 0 && bb % 4 === 2) shaku(t, deg(bb === 2 ? 5 : 4, R + 12, SC), d * 12, 0.08, { bus: bus, scoop: true });
      if (s === 12 && bb === 7) { whoosh(t, d * 4, 0.12, true, { bus: bus }); }
      if (s === 0 && b % 16 === 0) pad(t, midi(R - 12), d * 16 * 8, 0.07, { bus: bus, lp0: 250, lp1: 900 });
    } },
    boss: { bpm: 144, play(b, s, t, d, bus) {
      const R = 46, SC = INSEN, bb = b % 8;
      if ([0, 3, 6, 8, 11, 14].includes(s)) taiko(t, s === 0 || s === 8 ? 0.62 : 0.34, s === 0 ? 62 : 80, { bus: bus, sub: s === 0 }); if (s === 4 || s === 12) taiko(t, 0.3, 110, { bus: bus }); if (s % 2 === 1 && bb >= 4) shime(t, 0.06, bus);
      if (s % 2 === 0) noise(t, 0.04, 0.06, 8000, 4000, 'highpass', { bus: bus });
      if (s % 2 === 0) { const pat = [0, 0, 1, 0, 3, 0, 2, 1][(s >> 1)]; shami(t, deg(pat + (bb % 4 === 3 ? 2 : 0), R + 12, SC), s % 4 === 0 ? 0.26 : 0.17, { bus: bus, rv: 0.15 }); }
      if (s === 0 || s === 3 || s === 8 || s === 11) bassS(t, deg(bb >= 4 && s > 7 ? 1 : 0, R - 12, SC), 0.38, { bus: bus, rv: 0.1 });
      if (s === 0 && b % 4 === 0) { gong(t, 87, 0.16, { bus: bus }); pad(t, midi(R - 12), d * 64, 0.09, { bus: bus, lp0: 250, lp1: 1200 }); pad(t, midi(R - 11), d * 64, 0.06, { bus: bus, lp0: 250, lp1: 1200 }); }
      if (s === 0 && b % 4 === 1) strum(t, [deg(0, R, SC), deg(1, R, SC), deg(3, R, SC)], 0.3, { bus: bus });
      if (s === 0 && b % 4 === 3) shaku(t, deg(4, R + 24, SC), d * 12, 0.07, { bus: bus, scoop: true });
      if (s === 0 && bb === 7) riser(t, d * 16, 0.2);
    } }
  };

  /* ---------- haptics layered onto key cues (UI.haptic respects the setting & throttles) ---------- */
  const HAP = { tap: 6, ok: 10, back: 6, tab: 8, crit: [16, 24, 36], impact: 0, guard: 14, thunder: [20, 20, 50], crush: [40, 30, 110], bellBig: [30, 30, 60], warn: [30, 40, 60], win: [50, 40, 120], lose: [120], levelup: [30, 30, 70], rare: [40, 40, 120], die: 24, cutin: [20, 30, 50], heal: 10 };
  Object.keys(HAP).forEach((n) => { if (!HAP[n]) return; const f = A[n]; A[n] = function () { try { if (window.UI && UI.haptic) UI.haptic(HAP[n]); } catch (e) {} return f.apply(A, arguments); }; });
  window.GameAudio = A;
})();
