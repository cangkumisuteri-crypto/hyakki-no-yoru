/* audio.js - procedural WebAudio SFX + tiny generative music (Japanese hirajoshi scale, taiko, shamisen-like plucks, bells). No audio files. */
(function () {
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null, verb = null;
  let muted = false, forceMuted = false, musicOn = true, mode = null, timer = null, nextT = 0, step = 0;
  const SC = [0, 2, 3, 7, 8]; // hirajoshi
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const deg = (i, base) => { const o = Math.floor(i / 5); return midi(base + SC[((i % 5) + 5) % 5] + 12 * o); };

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try {
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(master);
      const len = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // cheap reverb send
      verb = ctx.createDelay(1); verb.delayTime.value = 0.23; const fb = ctx.createGain(); fb.gain.value = 0.32; const lp = ctx.createBiquadFilter(); lp.frequency.value = 1800;
      verb.connect(lp); lp.connect(fb); fb.connect(verb); const wet = ctx.createGain(); wet.gain.value = 0.35; lp.connect(wet); wet.connect(master);
      applyMute();
    } catch (e) { ctx = null; return false; }
    return true;
  }
  function applyMute() { if (master) master.gain.setTargetAtTime((muted || forceMuted) ? 0 : 1, ctx.currentTime, 0.02); }
  function musVol() { if (musBus) musBus.gain.setTargetAtTime(musicOn && mode ? 0.55 : 0, ctx.currentTime, 0.3); }

  function tone(f, t0, dur, type, vol, o) {
    o = o || {}; const os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type || 'sine'; os.frequency.setValueAtTime(f, t0);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (o.a || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    os.connect(g); const bus = o.bus || sfxBus; g.connect(bus); if (o.send) g.connect(verb);
    os.start(t0); os.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, f0, f1, type, bus) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function taiko(t0, vol, pitch, bus) { tone(pitch || 90, t0, 0.35, 'sine', vol, { slide: (pitch || 90) * 0.45, bus: bus }); noise(t0, 0.09, vol * 0.6, 900, 120, 'lowpass', bus); }
  function bell(t0, f, vol, bus) { [1, 2.76, 5.4, 8.9].forEach((m, i) => tone(f * m, t0, 1.6 / (i + 1) + 0.2, 'sine', vol / (i * 1.6 + 1), { a: 0.002, bus: bus, send: true })); }
  function pluck(t0, f, vol, bus) { tone(f, t0, 0.45, 'sawtooth', vol * 0.5, { a: 0.003, bus: bus, send: true }); tone(f * 2.003, t0, 0.2, 'square', vol * 0.25, { a: 0.002, bus: bus }); }
  function can() { return ensure() && ctx.state !== 'closed'; }
  const run = (fn) => () => { if (!can()) return; fn(ctx.currentTime); };

  const A = {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); },
    get muted() { return muted; }, setMuted(m) { muted = !!m; if (ctx) applyMute(); },
    get musicOn() { return musicOn; }, setMusicOn(m) { musicOn = !!m; if (ctx) musVol(); },
    setForceMuted(m) { forceMuted = !!m; if (ctx) applyMute(); },
    tap: run((t) => tone(740, t, 0.07, 'triangle', 0.12)),
    ok: run((t) => { tone(587, t, 0.09, 'triangle', 0.14); tone(880, t + 0.07, 0.14, 'triangle', 0.14); }),
    back: run((t) => tone(440, t, 0.1, 'triangle', 0.12, { slide: 330 })),
    text: run((t) => tone(1100 + Math.random() * 200, t, 0.025, 'square', 0.025)),
    slash: run((t) => { noise(t, 0.16, 0.5, 6000, 900, 'bandpass'); tone(300, t, 0.1, 'sawtooth', 0.12, { slide: 80 }); }),
    claw: run((t) => { for (let i = 0; i < 3; i++) noise(t + i * 0.05, 0.1, 0.35, 7000, 1200, 'bandpass'); }),
    hit: run((t) => { taiko(t, 0.5, 110); noise(t, 0.12, 0.4, 3000, 200, 'lowpass'); }),
    crit: run((t) => { taiko(t, 0.7, 80); noise(t, 0.22, 0.6, 5000, 300, 'bandpass'); tone(1400, t, 0.3, 'triangle', 0.15, { slide: 500 }); }),
    thunder: run((t) => { noise(t, 0.5, 0.8, 8000, 150, 'bandpass'); noise(t + 0.02, 1.0, 0.5, 600, 60, 'lowpass'); tone(60, t, 0.7, 'sine', 0.5, { slide: 30 }); }),
    fire: run((t) => { noise(t, 0.5, 0.45, 1200, 3500, 'bandpass'); tone(220, t, 0.4, 'sawtooth', 0.08, { slide: 520 }); }),
    ice: run((t) => { [2093, 2637, 3136, 3951].forEach((f, i) => tone(f, t + i * 0.035, 0.4, 'sine', 0.1, { send: true })); noise(t, 0.12, 0.3, 9000, 3000, 'highpass'); }),
    wind: run((t) => { noise(t, 0.6, 0.4, 400, 3200, 'bandpass'); noise(t + 0.15, 0.5, 0.3, 3200, 500, 'bandpass'); }),
    water: run((t) => { tone(500, t, 0.3, 'sine', 0.2, { slide: 160 }); noise(t, 0.3, 0.25, 2500, 400, 'lowpass'); }),
    heal: run((t) => { [0, 2, 4, 7].forEach((k, i) => tone(deg(k, 72), t + i * 0.07, 0.5, 'triangle', 0.14, { send: true })); }),
    buff: run((t) => { tone(523, t, 0.15, 'triangle', 0.13); tone(784, t + 0.08, 0.25, 'triangle', 0.13); }),
    debuff: run((t) => { tone(400, t, 0.3, 'sawtooth', 0.1, { slide: 150 }); }),
    guard: run((t) => { tone(200, t, 0.12, 'square', 0.15, { slide: 120 }); noise(t, 0.08, 0.3, 2500, 500, 'bandpass'); }),
    bell: run((t) => bell(t, 523, 0.18)),
    bellBig: run((t) => { bell(t, 261, 0.3); bell(t + 0.12, 392, 0.2); }),
    warn: run((t) => { tone(160, t, 0.5, 'sawtooth', 0.18, { slide: 80 }); taiko(t, 0.6, 70); taiko(t + 0.25, 0.6, 70); }),
    crush: run((t) => { taiko(t, 0.9, 55); noise(t, 0.6, 0.8, 2000, 60, 'lowpass'); tone(48, t, 0.9, 'sine', 0.6, { slide: 28 }); }),
    die: run((t) => { tone(300, t, 0.5, 'sawtooth', 0.12, { slide: 60 }); noise(t, 0.5, 0.3, 2000, 100, 'lowpass'); }),
    cutin: run((t) => { taiko(t, 0.8, 70); taiko(t + 0.15, 0.7, 90); noise(t, 0.5, 0.35, 500, 7000, 'bandpass'); tone(300, t, 0.5, 'sawtooth', 0.1, { slide: 900 }); }),
    turn: run((t) => tone(660, t, 0.05, 'sine', 0.08)),
    win: run((t) => { taiko(t, 0.7, 90); [0, 2, 3, 5, 7].forEach((k, i) => tone(deg(k, 69), t + 0.2 + i * 0.12, 0.6, 'triangle', 0.17, { send: true })); bell(t + 0.2, 880, 0.18); }),
    lose: run((t) => { [4, 3, 1, 0].forEach((k, i) => tone(deg(k, 57), t + i * 0.28, 0.8, 'sawtooth', 0.1, { send: true })); taiko(t, 0.8, 50); }),
    levelup: run((t) => { [0, 1, 2, 3, 5].forEach((k, i) => tone(deg(k, 69), t + i * 0.07, 0.4, 'triangle', 0.16, { send: true })); }),
    chest: run((t) => { taiko(t, 0.5, 100); [0, 2, 3, 4, 5, 7].forEach((k, i) => tone(deg(k, 72), t + 0.1 + i * 0.06, 0.4, 'triangle', 0.14, { send: true })); }),
    gacha: run((t) => { bell(t, 330, 0.25); noise(t, 0.8, 0.3, 300, 5000, 'bandpass'); }),
    rare: run((t) => { bell(t, 440, 0.3); bell(t + 0.15, 660, 0.25); bell(t + 0.3, 880, 0.25); taiko(t, 0.8, 80); }),
    thunderStory: run((t) => { noise(t, 1.2, 0.9, 5000, 80, 'bandpass'); tone(50, t, 1.2, 'sine', 0.6, { slide: 25 }); taiko(t + 0.6, 0.9, 60); taiko(t + 0.9, 0.9, 60); }),

    /* ---- music ---- */
    music(m) {
      if (!ensure()) return;
      if (m === mode) { musVol(); return; }
      mode = m; step = 0; nextT = ctx.currentTime + 0.15;
      if (!timer) timer = setInterval(A._sched, 110);
      musVol();
    },
    stopMusic() { mode = null; if (ctx) musVol(); },
    _sched() {
      if (!ctx || !mode) return;
      const P = { title: { bpm: 62, root: 50 }, story: { bpm: 54, root: 48 }, camp: { bpm: 66, root: 52 }, battle: { bpm: 122, root: 50 }, boss: { bpm: 138, root: 46 } }[mode] || { bpm: 70, root: 50 };
      const spb = 60 / P.bpm / 2; // 8th notes
      while (nextT < ctx.currentTime + 0.4) {
        const s = step % 32, t = nextT, bus = musBus;
        // drone every 2 bars
        if (s === 0) { tone(midi(P.root - 12), t, spb * 30, 'sine', 0.16, { a: 0.8, bus: bus }); tone(midi(P.root), t, spb * 30, 'triangle', 0.05, { a: 1.2, bus: bus }); }
        if (mode === 'battle' || mode === 'boss') {
          if (s % 4 === 0) taiko(t, mode === 'boss' ? 0.5 : 0.38, mode === 'boss' ? 62 : 80, bus);
          if (s % 8 === 6) taiko(t, 0.3, 110, bus);
          if (mode === 'boss' && s % 16 === 0) bell(t, midi(P.root + 12), 0.1, bus);
          const mel = [0, -1, 2, -1, 3, 2, -1, 1, 0, -1, 4, -1, 3, 2, 1, -1];
          const m = mel[s % 16]; if (m >= 0 && s % 2 === 0) pluck(t, deg(m + (s >= 16 ? 1 : 0), P.root + 12), 0.1, bus);
          if (s % 2 === 1 && Math.random() < 0.25) pluck(t, deg(2 + (s % 3), P.root + 24), 0.05, bus);
        } else {
          const arp = [0, 2, 4, 2, 3, 1, 2, 0];
          if (s % 4 === 0) pluck(t, deg(arp[(s >> 2) % 8] + (s >= 16 ? 2 : 0), P.root + 12), mode === 'story' ? 0.07 : 0.09, bus);
          if (s % 16 === 8 && mode !== 'story') bell(t, deg(0, P.root + 24), 0.06, bus);
          if (mode === 'title' && s % 16 === 0) taiko(t, 0.3, 60, bus);
        }
        nextT += spb; step++;
      }
    },
  };
  window.GameAudio = A;
})();
