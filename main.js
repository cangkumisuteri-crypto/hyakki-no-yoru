/* main.js - story player, stage flow / results, boot. */
(function () {
  const D = window.DATA, S = window.State, A = window.GameAudio, UI = window.UI, FX = window.FX;
  const $ = (id) => document.getElementById(id);
  const esc = UI.esc;

  /* ---------- visual-novel player ---------- */
  const nameOf = (id) => {
    if (id === '?') return '？？？'; if (!id) return '';
    if (D.CHARS[id]) return L(D.CHARS[id].n); if (D.ENEMIES[id]) return L(D.ENEMIES[id].n); if (id === 'raijin') return T('雷神・鳴神', 'Raijin Narukami'); return id;
  };
  UI.playStory = function (id, done) {
    const sc = window.STORY[id]; if (!sc) { if (done) done(); return; }
    UI.show('story'); UI.setBg(sc.bg, 0.12); A.music(sc.music || 'story'); if (window.Ads) Ads.gameplayStop();
    let i = 0, Lk = null, Rk = null, silL = false, silR = false, typing = null, full = '', ended = false;
    const lines = sc.lines;
    const draw = (active) => {
      const mk = (k, sil, act) => k ? '<div class="vp' + (sil ? ' sil' : '') + (act ? ' act' : '') + '" style="background-image:url(' + ART(k) + ')"></div>' : '';
      $('vnL').innerHTML = mk(Lk, silL, active === 'L'); $('vnR').innerHTML = mk(Rk, silR, active === 'R');
    };
    const finish = () => { if (ended) return; ended = true; clearTimeout(typing); S.d.seen[id] = 1; S.save(); $('vnBox').onclick = null; $('vnSkip').onclick = null; document.removeEventListener('keydown', key); if (done) done(); };
    const key = (e) => { if (UI.screen === 'story' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); advance(); } };
    function fx(n) {
      if (n === 'shake') { const a = $('app'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); A.hit(); }
      if (n === 'flash') { FX.flash('#fff', 0.5, 0.35); A.tap(); }
      if (n === 'thunder') { FX.flash('#cfdcff', 0.8, 0.5); A.thunderStory(); const a = $('app'); a.classList.remove('shakeBig'); void a.offsetWidth; a.classList.add('shakeBig'); }
      if (n === 'fade') { const f = $('vnFlash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
    }
    function step() {
      if (i >= lines.length) return finish();
      const ln = lines[i++], o = ln[3] || {}, who = ln[0];
      if (o.bg) UI.setBg(o.bg, 0.12);
      if ('L' in o) { Lk = o.L; silL = false; } if ('R' in o) { Rk = o.R; silR = false; }
      if ('sil' in o) { if (o.sil === 'R') silR = true; else if (o.sil === 'L') silL = true; else { silL = silR = false; } }
      let act = null; if (who && who === Lk) act = 'L'; else if (who && who === Rk) act = 'R'; else if (who === '?') act = silR ? 'R' : 'L';
      draw(act); if (o.fx) fx(o.fx);
      $('vnName').textContent = nameOf(who); $('vnName').style.visibility = who ? 'visible' : 'hidden'; $('vnBox').classList.toggle('narr', !who);
      full = L([ln[1], ln[2]]); const el = $('vnText'); let n = 0; clearTimeout(typing);
      if (window.__fast) { el.textContent = full; n = full.length; typing = null; return; }
      el.textContent = ''; const tick = () => { n++; el.textContent = full.slice(0, n); if (n % 3 === 0) A.text(); if (n < full.length) typing = setTimeout(tick, 26); else typing = null; }; typing = setTimeout(tick, 60);
    }
    function advance() { if (typing) { clearTimeout(typing); typing = null; $('vnText').textContent = full; return; } A.tap(); step(); }
    $('vnBox').onclick = advance; $('vnL').onclick = $('vnR').onclick = advance; $('vnSkip').onclick = () => { A.back(); finish(); };
    document.addEventListener('keydown', key); $('vnSkip').style.display = S.d.seen[id] ? '' : 'none'; if (!S.d.seen[id]) $('vnSkip').style.display = '';
    step();
  };

  /* ---------- stage flow ---------- */
  UI.choosePath = function (next) {
    UI.modal({ cls: 'pathbox', title: T('無名の剣は…', 'Mumei\'s blade…'), html: '<div class="rbig" style="background-image:url(mumei.webp)"></div><p>' + T('戦い方を選ぼう。いつでも「仲間」画面で変えられる。', 'Choose how he fights. You can switch any time in the Party screen.') + '</p><div class="paths">' + ['oni', 'tiger'].map((p) => '<button class="path" data-p="' + p + '"><b>' + L(D.PATHS[p].n) + '</b><small>' + L(D.PATHS[p].d) + '</small></button>').join('') + '</div>', onOpen: (api) => {
      api.el.querySelectorAll('.path').forEach((b) => b.addEventListener('click', () => { A.ok(); S.d.chars.mumei.path = b.dataset.p; S.d.flags.pathChosen = true; S.save(); api.close(); next(); }));
    } });
  };
  UI.startStage = function (id) {
    const st = D.STAGES[id]; A.unlock();
    const launch = () => { UI.show('battle'); UI.setBg(st.bg, 0.4); $('app').classList.remove('shake', 'shakeBig'); window.Battle.start(id, { onEnd: UI.onBattleEnd }); };
    const go = () => { if (id === '1-1' && !S.d.flags.pathChosen) UI.choosePath(launch); else launch(); };
    if (st.pre && !S.d.seen[st.pre]) UI.playStory(st.pre, go); else go();
  };
  const SHARDS = { '1-3': { kappa: 5 }, '1-4': { yukihana: 5 }, '1-5': { karasuba: 5 } };
  UI.onBattleEnd = function (res) {
    FX.clear(); UI.closeAll(); const st = res.stage, id = res.id;
    if (res.retreat || !res.win) { S.d.winStreak = 0; S.save(); UI.hub('journey'); UI.toast(res.retreat ? T('撤退した', 'You retreated') : T('敗北… 準備を整えて再挑戦しよう', 'Defeated… prepare and try again')); return; }
    const first = !S.d.cleared[id]; S.d.winStreak++; const sb = Math.min(0.5, 0.05 * (S.d.winStreak - 1));
    const exp = Math.round(st.exp * (1 + (res.mealExp || 0)) * (1 + sb)), gold = Math.round(st.gold * (1 + sb) * (first ? 1 : 0.8));
    const before = {}; S.d.party.forEach((p) => { before[p] = { lv: S.d.chars[p].lv, exp: S.d.chars[p].exp }; });
    const rew = { gold: gold }; const extra = [];
    if (first) { Object.assign(rew, st.first); rew.item = st.drop; if (SHARDS[id]) rew.shard = SHARDS[id]; }
    else { if (Math.random() < 0.9) { const k = ['rice', 'herb', 'fish'][Math.floor(Math.random() * 3)]; rew[k] = 1 + Math.floor(Math.random() * 2); } if (Math.random() < 0.2) rew.item = D.SLOTS[Math.floor(Math.random() * 3)] + (Math.random() < 0.3 ? '_r' : '_n'); }
    const out = S.grant(rew); S.d.cleared[id] = 1; S.quest('win');
    S.d.party.forEach((p) => { S.addExp(p, exp); S.addBond(p, first ? 5 : 2); }); S.save(); UI.refreshRes();
    const lvlUp = S.d.party.some((p) => S.d.chars[p].lv > before[p].lv);
    if (lvlUp) A.levelup();
    const stars = UI.calcStars(res, S.d.party.length); S.d.stars = S.d.stars || {}; const prevS = S.d.stars[id] || (first ? 0 : 1); const newBest = stars > prevS; if (newBest) S.d.stars[id] = stars; S.save();
    const cont = () => afterResult(res, first);
    const ad = UI.adBtn(T('報酬 ×2', 'Double rewards'), () => { S.grant({ gold: gold }); S.d.party.forEach((p) => S.addExp(p, exp)); S.save(); UI.refreshRes(); UI.toast(T('報酬が2倍に!', 'Rewards doubled!')); cont(); });
    UI.victoryScreen({ res: res, id: id, st: st, out: out, first: first, exp: exp, before: before, stars: stars, newBest: newBest, cont: cont, ad: ad || [],
      streak: S.d.winStreak > 1 ? T(S.d.winStreak + '連勝ボーナス +' + Math.round(sb * 100) + '%', S.d.winStreak + '-win streak bonus +' + Math.round(sb * 100) + '%') : '' });
  };
  function afterResult(res, first) {
    const st = res.stage, steps = [];
    if (first && st.post && !S.d.seen[st.post]) steps.push((n) => UI.playStory(st.post, n));
    if (first && st.join && !S.d.chars[st.join].own) { S.d.chars[st.join].own = true; S.d.newRecruits = (S.d.newRecruits || []).concat([st.join]); }
    if (S.d.newRecruits && S.d.newRecruits.length) { const list = S.d.newRecruits; S.d.newRecruits = []; S.save(); list.forEach((rid) => steps.push((n) => { UI.show('hub'); UI.recruit(rid, n); })); }
    if (first && res.id === '1-5') steps.push((n) => UI.chapterEnd(n));
    const run = () => { const f = steps.shift(); if (f) f(run); else finalize(res); };
    run();
  }
  UI.recruit = function (id, next) {
    const def = D.CHARS[id]; if (S.d.party.length < 4 && !S.d.party.includes(id)) { S.d.party.push(id); S.save(); }
    UI.modal({ cls: 'recruit', title: T('仲間が加わった!', 'A companion joins!'), html: '<div class="rbig" style="background-image:url(' + ART(id) + ')"></div><b class="rn">' + esc(L(def.full)) + '</b><p class="quote">' + esc(L(def.quote)) + '</p>', btns: [{ t: 'OK', cls: 'pri', fn: () => { next(); } }], onOpen: () => A.rare() });
  };
  UI.chapterEnd = function (next) {
    UI.hub('journey'); A.music('title');
    UI.modal({ cls: 'chend', title: T('第一章 完', 'CHAPTER 1 COMPLETE'), html: '<div class="cliff" style="background-image:url(raijin.webp)"><div class="cliff-t"><small>' + T('第二章', 'CHAPTER 2') + '</small><b>' + L(D.CHAPTERS[1].n) + '</b></div></div><p>' + T('雷鳴が山を越えて響く。鎮守の荒神を鎮めた無名一行の前に、太鼓の音とともに雷神・鳴神が現れる…', 'Thunder rolls across the mountains. As drums echo, Raijin Narukami waits at the Thunder Pass for Mumei and his companions…') + '</p><p class="sm">' + T('続きは近日公開。それまで、仲間を育て、絆を深め、野営で力を蓄えよう!', 'To be continued! Until then, grow your party, deepen bonds, and rest at the campfire.') + '</p>', btns: [{ t: T('旅を続ける', 'Continue'), cls: 'pri', fn: () => next() }], onOpen: () => A.thunderStory() });
  };
  function finalize(res) {
    const go = () => { UI.hub('journey'); if (!UI.sessionPrompted) { UI.sessionPrompted = true; UI.entryQueue(); } };
    S.d.stats.wins % 2 === 0 && res.id !== '1-1' && window.Ads ? Ads.midgame().then(go) : go();
  }
  UI.entryQueue = function () {
    const steps = []; const rp = S.restPending();
    if (rp.mins >= 3 && Object.keys(S.d.cleared).length) steps.push(() => UI.restModal(true));
    if (!S.d.daily.claimed) steps.push(() => UI.loginModal(true));
    UI.afterWelcome = () => { const f = steps.shift(); if (f) f(); else UI.afterWelcome = null; }; UI.afterWelcome();
  };
  UI.begin = function (has) {
    if (!has) { UI.startStage('1-1'); return; }
    UI.sessionPrompted = true; UI.hub('journey'); UI.entryQueue();
  };

  /* ---------- boot ---------- */
  function runSplash() {
    const sp = $('splash'); if (!sp) return Promise.resolve();
    if (window.__fast || (/[?&]debug=1/.test(location.search) && !/[?&]splash=1/.test(location.search))) { sp.style.display = 'none'; return Promise.resolve(); }
    const bar = $('spBar'), land = innerWidth / innerHeight >= 1.05;
    const imgs = ['bg_title.webp', 'mumei_oni.webp', 'raijin.webp', land ? 'ui/map_land.webp' : 'ui/map_port.webp', 'ui/chest_wood.webp', 'ui/chest_gold.webp', 'ui/washi.png'];
    let done = 0; const total = imgs.length + 2; const tick = () => { done++; if (bar) bar.style.width = Math.round(done / total * 100) + '%'; };
    const ps = imgs.map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = () => { tick(); r(); }; i.src = u; }));
    [['400 40px HyBrush', '百鬼ノ夜'], ['600 20px HyMincho', '旅路']].forEach((f) => ps.push(Promise.resolve().then(() => document.fonts.load(f[0], f[1])).catch(() => {}).then(tick)));
    const cap = new Promise((r) => setTimeout(r, 6000)), min = new Promise((r) => setTimeout(r, 1700));
    return Promise.all([Promise.race([Promise.all(ps), cap]), min]).then(() => { if (bar) bar.style.width = '100%'; sp.classList.add('out'); setTimeout(() => { sp.style.display = 'none'; }, 950); });
  }
  async function boot() {
    const splashP = runSplash();
    S.load(); await Ads.init();
    I18N.set(I18N.detect(S.d.set.lang, Ads.locale()));
    UI.resize(); FX.init(); FX.resize(UI.W, UI.H, UI.scale);
    Ads.onAdStart = () => A.setForceMuted(true); Ads.onAdEnd = () => A.setForceMuted(Ads.portalMuted());
    A.setMuted(!S.d.set.sound); A.setMusicOn(S.d.set.music); A.setForceMuted(Ads.portalMuted()); Ads.onPortalSettings(() => A.setForceMuted(Ads.portalMuted()));
    S.newDayCheck(); S.save();
    $('btnSet').onclick = () => { A.tap(); UI.settings(); };
    $('btnLang').onclick = () => { A.tap(); UI.setLang(I18N.lang === 'ja' ? 'en' : 'ja'); };
    $('bAuto').onclick = () => { A.tap(); window.Battle.setAuto(!S.d.set.auto); };
    $('bSpd').onclick = () => { A.tap(); window.Battle.setSpeed(S.d.set.speed >= 3 ? 1 : S.d.set.speed + 1); };
    $('bRet').onclick = () => { A.tap(); UI.modal({ title: T('撤退する?', 'Retreat?'), html: '<p>' + T('この戦いの報酬は得られない。', 'You will forfeit this battle.') + '</p>', btns: [{ t: T('撤退', 'Retreat'), cls: 'pri', fn: () => window.Battle.retreat() }, { t: T('続ける', 'Stay'), cls: 'sub' }] }); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => document.addEventListener(e, () => A.unlock(), { passive: true }));
    document.addEventListener('keydown', (e) => { if (UI.screen === 'battle' && /^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('#bCmd .cmd')[+e.key - 1]; if (b) b.click(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) S.save(); else { if (S.newDayCheck() && UI.screen === 'hub') UI.hub(null, true); } });
    setInterval(() => { S.d.stats.playSec += 20; S.save(); }, 20000);
    await splashP; UI._booted = true;
    UI.title(); Ads.loadingFinished(); window.__ready = true;
    if (location.protocol !== 'file:' && 'serviceWorker' in navigator && !/[?&]nosw=1/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
    const qs = new URLSearchParams(location.search); if (qs.get('debug') === '1') window.__hy = { UI: UI, State: S, Battle: window.Battle, DATA: D, Ads: Ads, FX: FX, A: A };
  }
  window.__hy = { get UI() { return UI; }, State: S, Battle: window.Battle, DATA: D, Ads: window.Ads, FX: FX, A: A };
  boot();
})();
