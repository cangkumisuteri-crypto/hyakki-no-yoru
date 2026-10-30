/* chest.js - premium treasure-chest opening sequence + victory (reward reveal) screen.
   Presentation only: rewards are already granted to the save (S.grant) before these are called. */
(function () {
  const D = window.DATA, S = window.State, A = window.GameAudio, UI = window.UI;
  const $ = (id) => document.getElementById(id);
  const TIERS = ['wood', 'bronze', 'gold', 'legend'];
  const TC = { wood: ['#cfd8e6', '#ffffff'], bronze: ['#ff8a3c', '#ffe2b8'], gold: ['#ffd23a', '#fff7c8'], legend: ['#b86bff', '#f3e2ff'] };
  const AR = { wood: 640 / 468, bronze: 640 / 491, gold: 640 / 514, legend: 640 / 586 };
  const SPLIT = { wood: 0.37, bronze: 0.38, gold: 0.42, legend: 0.44 };
  const WORD = { wood: ['吉', 'FORTUNE', '木箱', 'WOODEN CHEST'], bronze: ['中吉', 'NICE!', '青銅の箱', 'BRONZE CHEST'], gold: ['大吉', 'GREAT!!', '黄金の箱', 'GOLDEN CHEST'], legend: ['神引き', 'LEGENDARY!!!', '伝説の箱', 'LEGENDARY CHEST'] };
  const T = (ja, en) => (window.I18N && I18N.lang === 'ja' ? ja : en);
  const call = (n, a, b) => { try { if (A && A[n]) A[n](a, b); } catch (e) {} };
  UI.TIERS = TIERS; UI.TIER_COLOR = TC;

  UI.tierOf = function (out, o) {
    o = o || {}; if (o.tier) return o.tier; let sc = 0;
    out.forEach((r) => {
      if (r.k === 'item') sc += r.it.rar === 2 ? 4 : r.it.rar === 1 ? 2 : 1;
      else if (r.k === 'shard') sc += 2;
      else if (r.k === 'mag') sc += r.n >= 50 ? 3 : r.n >= 20 ? 2 : 1;
      else if (r.k === 'gold') sc += r.n >= 1500 ? 2 : r.n >= 500 ? 1 : 0;
    });
    if (o.boss) sc += 3;
    return sc >= 7 ? 'legend' : sc >= 4 ? 'gold' : sc >= 2 ? 'bronze' : 'wood';
  };

  function cardOf(r, i) {
    const E = UI.esc; let cls = '', ic = '', nm = '', n = '', tag = '';
    if (r.k === 'item') { cls = 'r' + r.it.rar; ic = UI.ico(r.it.slot); nm = E(S.itemName(r.it)); n = ''; tag = D.RARITY[r.it.rar].n[I18N.lang === 'ja' ? 0 : 1]; }
    else if (r.k === 'shard') { cls = 'shard'; ic = '<span class="shchip" style="background-image:url(' + ART(r.id) + ')"></span>'; nm = E(L(D.CHARS[r.id].n)) + T('の欠片', ' shards'); n = '×' + r.n; }
    else { ic = UI.ico(r.k); nm = r.k === 'gold' ? T('小判', 'Gold') : r.k === 'mag' ? T('魂玉', 'Soul Gems') : L(D.ING[r.k]); n = '×' + r.n; }
    return '<div class="cs-card ' + cls + '" style="--i:' + i + '"' + '>' + (tag ? '<small>' + tag + '</small>' : '') + '<div class="ci">' + ic + '</div><b>' + nm + '</b>' + (n ? '<em>' + n + '</em>' : '') + '</div>';
  }
  const score = (r) => r.k === 'item' ? 10 + r.it.rar * 10 : r.k === 'shard' ? 15 : r.k === 'mag' ? 5 : r.k === 'gold' ? 1 : 2;
  const symOf = (r) => r.k === 'item' ? r.it.slot : r.k === 'shard' ? 'sparkle' : r.k === 'gold' ? 'koban' : r.k;

  UI.chestSequence = function (o) {
    const out = (o.out || []).slice().sort((a, b) => score(a) - score(b));
    const tier = UI.tierOf(out, o), ti = TIERS.indexOf(tier), col = TC[tier], fast = !!window.__fast;
    const wrap = document.createElement('div'); wrap.className = 'modal cs s-idle on' + (tier === 'legend' ? ' legend' : '') + (tier !== 'wood' ? ' hw' : '');
    const pulses = 2 + Math.min(ti, 2);
    wrap.style.setProperty('--tc', '#fff0c0'); wrap.style.setProperty('--tc2', '#ffffff'); wrap.style.setProperty('--pulses', pulses);
    const seamY = (480 / AR[tier]) * SPLIT[tier];
    const w = WORD[tier], ja = I18N.lang === 'ja';
    wrap.innerHTML = '<div class="cs-rays"></div>' +
      '<div class="cs-title">' + (o.title || T('宝箱', 'Spirit Chest')) + '<small>' + w[ja ? 2 : 3] + '</small></div>' +
      '<div class="cs-chest" style="--ar:' + AR[tier] + ';--f:' + (SPLIT[tier] * 100) + '%;--img:url(ui/chest_' + tier + '.webp);--wimg:url(ui/chest_wood.webp);--war:' + AR.wood + '">' +
        '<div class="cs-aura"></div><div class="cs-body"><div class="cs-inner"></div><div class="cs-base"></div><div class="cs-lid"></div>' + (tier !== 'wood' ? '<div class="cs-wood"></div>' : '') + '<div class="cs-seam"></div></div><div class="cs-beam"></div></div>' +
      '<div class="cs-fx" style="--sy:' + seamY + 'px"></div><div class="cs-ring"></div><div class="cs-flash"></div><div class="cs-flash m"></div>' +
      '<div class="cs-hint">' + T('タップして開ける', 'TAP TO OPEN') + '</div><div class="cs-skip" style="display:none">' + T('タップでスキップ', 'TAP TO SKIP') + '</div>' +
      '<div class="cs-stamp">' + w[0] + '<small>' + w[1] + '</small></div>' +
      '<div class="cs-cards">' + out.map(cardOf).join('') + '</div><div class="mbtns"></div>';
    $('modals').appendChild(wrap);
    const timers = []; let started = false, finished = false, closed = false;
    const at = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const st = (s) => { wrap.classList.remove('s-idle', 's-shake', 's-hint', 's-burst', 's-reveal'); wrap.classList.add(s); };
    const setCol = (t) => { wrap.style.setProperty('--tc', TC[t][0]); wrap.style.setProperty('--tc2', TC[t][1]); };

    const bb = wrap.querySelector('.mbtns');
    const api = { el: wrap, close() { closed = true; timers.forEach(clearTimeout); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } };
    (o.extra || []).filter(Boolean).forEach((b) => { const e = document.createElement('button'); e.className = 'btn ' + (b.cls || ''); e.innerHTML = b.t; e.onclick = (ev) => { ev.stopPropagation(); A.tap(); b.fn && b.fn(api, e); }; bb.appendChild(e); });
    const ok = document.createElement('button'); ok.className = 'btn pri'; ok.textContent = o.okText || 'OK';
    ok.onclick = (ev) => { ev.stopPropagation(); A.tap(); api.close(); if (o.onDone) o.onDone(); }; bb.appendChild(ok);
    bb.addEventListener('click', (e) => e.stopPropagation());

    let bursted = false;
    function burst() {
      if (bursted) return; bursted = true;
      const fx = wrap.querySelector('.cs-fx'); let h = '';
      const nS = tier === 'legend' ? 44 : tier === 'gold' ? 32 : 22;
      for (let i = 0; i < nS; i++) { const a = Math.random() * Math.PI * 2, d = 160 + Math.random() * 360, sz = 6 + Math.random() * 12; h += '<i class="cs-sp" style="--s:' + sz.toFixed(1) + 'px;--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d * 0.8 - 80).toFixed(0) + 'px;--d:' + (0.8 + Math.random() * 0.8).toFixed(2) + 's"></i>'; }
      const nf = Math.min(out.length, 7);
      for (let i = 0; i < nf; i++) { const r = out[out.length - 1 - i], a = (nf === 1 ? 0 : (i / (nf - 1) - 0.5) * 2) * 1.05; h += '<div class="cs-fly" style="--x:' + (Math.sin(a) * 320).toFixed(0) + 'px;--y:' + (-200 - Math.cos(a) * 140).toFixed(0) + 'px;--r:' + (Math.random() * 80 - 40).toFixed(0) + 'deg;--dl:' + (i * 0.07).toFixed(2) + 's"><svg viewBox="0 0 48 48"><use href="#i-' + symOf(r) + '"/></svg></div>'; }
      fx.innerHTML = h;
    }
    function reveal(instant) {
      if (finished) return; finished = true; timers.forEach(clearTimeout); timers.length = 0;
      setCol(tier); wrap.classList.add('morph'); if (instant) wrap.classList.add('skip'); st('s-reveal');
      wrap.querySelector('.cs-skip').style.display = 'none';
      if (!instant) { call('csFanfare', tier); UI.haptic(ti >= 2 ? [40, 30, 80, 30, 140] : [30, 20, 50]); const app = $('app'); if (ti >= 2) { app.classList.add('shake'); setTimeout(() => app.classList.remove('shake'), 520); } }
      else call('csFanfare', tier);
      out.forEach((r, i) => { if (!instant) at(150 + i * 170, () => { call('csCard', score(r) > 20 ? 2 : score(r) > 9 ? 1 : 0, i); UI.haptic(12); }); });
      const doneMs = instant ? 0 : 400 + out.length * 170 + 500;
      if (doneMs) at(doneMs, () => wrap.classList.add('done')); else wrap.classList.add('done');
    }
    function start() {
      if (started) return; started = true;
      if (fast) { burst(); reveal(true); return; }
      wrap.querySelector('.cs-skip').style.display = 'block';
      if (ti >= 2) wrap.classList.add('big');
      st('s-shake'); let t = 0; const per = 380;
      for (let k = 0; k < pulses; k++) at(k * per, () => { call('csShake', k / pulses); UI.haptic(22 + k * 10); });
      t = pulses * per;
      at(t, () => { st('s-hint'); });
      const seq = TIERS.slice(0, ti + 1); const step = ti === 0 ? 420 : 250;
      seq.forEach((tn, i) => at(t + 60 + i * step, () => { setCol(tn); call('csHint', i, ti); UI.haptic(10 + i * 8); }));
      const tm = t + 60 + seq.length * step + 140;
      at(tm, () => { wrap.classList.add('morph'); call('csMorph', ti); UI.haptic([30, 20, 60]); });
      const tb = tm + 520;
      at(tb, () => { burst(); st('s-burst'); call('csBurst', ti); UI.haptic([60, 30, 110]); const app = $('app'); app.classList.add(ti >= 3 ? 'shakeBig' : 'shake'); setTimeout(() => app.classList.remove('shake', 'shakeBig'), 560); });
      at(tb + 950, () => reveal(false));
    }
    wrap.addEventListener('click', () => { if (closed) return; if (!started) { A.tap(); start(); } else if (!finished) { burst(); reveal(true); } });
    if (fast) at(0, start); else if (o.auto) at(250, start);
    return api;
  };

  /* ---------- victory / reward reveal ---------- */
  function countUp(el, n, delay) {
    if (window.__fast) { el.textContent = n; return; }
    setTimeout(() => { const t0 = performance.now(), dur = Math.min(900, 300 + n * 1.2); const f = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }, delay);
  }
  UI.victoryScreen = function (c) {
    const E = UI.esc, out = c.out, basic = out.filter((r) => r.k !== 'item' && r.k !== 'shard'), special = out.filter((r) => r.k === 'item' || r.k === 'shard');
    const ja = I18N.lang === 'ja'; let i = 0, h = '';
    h += '<div class="vic-head"><div class="vic-rays"></div><div class="vic-t">' + T('勝 利', 'VICTORY') + '</div><div class="vic-sub">' + c.id + ' · ' + E(L(c.st.n)) + '</div></div>';
    h += '<div class="vic-st">' + UI.starsHtml(c.stars, true) + (c.newBest ? '<span class="vic-new">NEW</span>' : '') + '</div>';
    h += '<div class="vic-rows">' + basic.map((r) => '<div class="vt" style="--i:' + (i++) + '">' + UI.ico(r.k) + '<span data-n="' + r.n + '">0</span><small>' + (r.k === 'gold' ? T('小判', 'Gold') : r.k === 'mag' ? T('魂玉', 'Soul Gems') : L(D.ING[r.k])) + '</small></div>').join('') + '</div>';
    let tier = null;
    if (special.length) { tier = UI.tierOf(special, { boss: c.first && !!c.st.boss }); h += '<div class="vic-chest"><div class="vc" style="--i:' + (i++) + ';--tc:' + TC[tier][0] + ';--cimg:url(ui/chest_' + tier + '.webp)"><div class="cim"></div><span>' + T('タップで開封', 'TAP TO OPEN') + '</span></div></div>'; }
    h += '<div class="vic-exp">' + S.d.party.map((p, k) => { const b = c.before[p], ch = S.d.chars[p], up = ch.lv > b.lv; const pb = Math.min(100, Math.round(b.exp / D.expNeed(b.lv) * 100)), pa = up ? 100 : Math.min(100, Math.round(ch.exp / D.expNeed(ch.lv) * 100));
      return '<div class="vx' + (up ? ' up' : '') + '" style="--i:' + k + '"><span class="shchip" style="background-image:url(' + ART(p) + ')"></span><div><b>' + E(L(D.CHARS[p].n)) + '</b>Lv.' + b.lv + (up ? ' → <em style="color:#ffd23a;font-style:normal">' + ch.lv + '</em>' : '') + ' · +' + c.exp + ' EXP<div class="xb"><i style="--a:' + (window.__fast ? pa : pb) + '%" data-a="' + pa + '"></i></div></div></div>'; }).join('') + '</div>';
    if (c.streak) h += '<div class="streak" style="text-align:center">' + c.streak + '</div>';
    let pending = !!special.length, m, going = false;
    const openChest = (then) => { if (!pending) { then && then(); return; } pending = false; const vc = m.el.querySelector('.vc'); UI.chestSequence({ out: special, boss: c.first && !!c.st.boss, title: T('戦利品', 'Spoils of Battle'), onDone: () => { const ap = document.getElementById('app'); if (ap) ap.classList.add('postwin'); if (vc) { vc.classList.add('opened'); vc.querySelector('span').textContent = T('開封済み', 'OPENED'); } then && then(); } }); };
    const btns = [].concat(c.ad || [], [{ t: T('次へ', 'Continue'), cls: 'pri', fn: (api) => { if (pending) { openChest(); return false; } if (window.__fast) { c.cont(); return; } if (going) return false; going = true; const ap = document.getElementById('app'); if (ap) ap.classList.add('postwin'); api.close(); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(c.cont, 80))); return false; } }]);
    m = UI.modal({ cls: 'vic', html: h, btns: btns, onOpen: (api) => {
      api.el.querySelectorAll('.vt span[data-n]').forEach((e, k) => countUp(e, +e.dataset.n, 1100 + k * 220 + 150));
      const vc = api.el.querySelector('.vc'); if (vc) vc.onclick = () => { A.tap(); openChest(); };
      api.el.querySelectorAll('.vx .xb i').forEach((e) => { const a = e.dataset.a; if (window.__fast) return; setTimeout(() => { e.style.setProperty('--a', a + '%'); }, 60); });
      if (!window.__fast) { for (let k = 0; k < c.stars; k++) setTimeout(() => call('csStar', k), 700 + k * 250); for (let k = 0; k < basic.length; k++) setTimeout(() => call('csCoin', k), 1150 + k * 220); }
    } });
    return m;
  };
})();
