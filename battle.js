/* battle.js - turn-based speed-timeline battle engine + battle UI. */
(function () {
  const D = window.DATA, S = window.State, FX = window.FX, A = window.GameAudio;
  const $ = (id) => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const B = { on: false, speedMul: 1 };
  let U = { a: [], e: [] }, ki = 2, KI_MAX = 6, round = 0, waveIdx = 0, stage = null, speed = 1, auto = false, ended = false, revived = false, cur = null, opts = null, choose = null, tgtMode = null, tick = 0, stats = null, hintState = 0, summoned = false;
  const waitR = (ms) => new Promise((r) => setTimeout(r, window.__fast ? 1 : ms));
  const wait = (ms) => new Promise((r) => setTimeout(r, window.__fast ? 1 : ms / speed));
  B.setSpeed = function (v) { speed = v; if (window.Stage) Stage.setSpeed(v); S.d.set.speed = v; refreshTop(); };
  B.setAuto = function (v) { auto = v; S.d.set.auto = v; refreshTop(); if (v && choose) autoPlay(); };

  /* ---------- unit creation ---------- */
  function mkAlly(id, i) {
    const s = S.stats(id, true), c = S.d.chars[id], kit = id === 'mumei' ? D.KITS['mumei_' + (c.path || 'oni')] : D.KITS[id];
    return { side: 'a', i: i, id: id, name: L(D.CHARS[id].n), img: id, hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, ult: 0, ag: rnd(0, 120), st: [], kit: kit, alive: true, guard: false, shield: 0, col: D.CHARS[id].c };
  }
  function mkEnemy(key, lv, i) {
    const e = D.ENEMIES[key], m = 1 + 0.115 * (lv - 1), hm = e.boss ? 1.6 : 1.1, am = e.boss ? 1.45 : 1.25;
    return { side: 'e', i: i, key: key, name: L(e.n), img: e.img, hp: Math.round(e.base.hp * m * hm), maxHp: Math.round(e.base.hp * m * hm), atk: Math.round(e.base.atk * m * am), def: Math.round(e.base.def * m), spd: e.base.spd, crit: 0.05, ult: 0, ag: rnd(0, 200), st: [], alive: true, boss: !!e.boss, ai: e.ai, aiPtr: 0, charged: false, guard: false, shield: 0, col: e.c, expv: e.exp || 1, phase: 1 };
  }
  const alive = (side) => U[side].filter((u) => u.alive);
  const has = (u, t) => u.st.find((s) => s.t === t);
  const effSpd = (u) => { const b = has(u, 'spdUp'); return u.spd * (1 + (b ? b.val : 0)); };

  /* ---------- DOM cards ---------- */
  function cardHtml(u) {
    return '<div class="c-shadow"></div><div class="c-spr"><div class="c-img" style="background-image:url(' + ART(u.img) + ')"></div><div class="c-rim"></div></div>' +
      '<div class="c-plate"><div class="c-name">' + u.name + '</div><div class="c-hp"></div><div class="c-bar"><i class="hp"></i><i class="sh"></i></div>' +
      (u.side === 'a' ? '<div class="c-ult"><i></i></div><div class="c-ultlab">奥義</div>' : '') + '</div><div class="c-st"></div><div class="c-mark"></div>';
  }
  function buildCard(u, parent) {
    const el = document.createElement('div'); el.className = 'card ' + (u.side === 'a' ? 'ally' : 'enemy') + (u.boss ? ' boss' : ''); el.innerHTML = cardHtml(u);
    el.style.setProperty('--col', u.col); u.el = el; parent.appendChild(el);
    el.addEventListener('click', () => onCardTap(u)); updateCard(u); if (window.Stage) Stage.add(u); return el;
  }
  function updateCard(u) {
    const el = u.el; if (!el) return; const p = Math.max(0, u.hp / u.maxHp);
    el.querySelector('.hp').style.width = (p * 100) + '%'; el.querySelector('.hp').className = 'hp' + (p < 0.3 ? ' low' : '');
    el.querySelector('.sh').style.width = Math.min(100, (u.shield / u.maxHp) * 100) + '%';
    el.querySelector('.c-hp').textContent = Math.max(0, Math.ceil(u.hp)) + (u.side === 'a' ? '/' + u.maxHp : '');
    if (u.side === 'a') { el.querySelector('.c-ult i').style.width = u.ult + '%'; el.classList.toggle('ultrdy', u.ult >= 100 && u.alive); el.querySelector('.c-ultlab').textContent = u.ult >= 100 ? T('奥義!', 'ULT!') : T('奥義', 'ULT'); }
    el.classList.toggle('dead', !u.alive);
    el.querySelector('.c-st').innerHTML = u.st.map((s) => '<b style="background:' + D.STATUS[s.t].c + '" title="' + L(D.STATUS[s.t].n) + '">' + D.STATUS[s.t].i + '</b>').join('');
    el.querySelector('.c-mark').innerHTML = u.charged ? '<span>' + T('溜め!', 'CHARGE!') + '</span>' : '';
    el.classList.toggle('charged', !!u.charged);
  }
  function center(u) {
    const ar = $('app').getBoundingClientRect(), sc = ar.width / (window.UI ? UI.W : 1280), r = u.el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - ar.left) / sc, y: (r.top + r.height * 0.45 - ar.top) / sc };
  }
  const pop = (u, txt, cls, dy) => { const c = center(u); FX.float(c.x + rnd(-12, 12), c.y + (dy || 0), txt, cls); };
  function setKi(v) { ki = Math.max(0, Math.min(KI_MAX, v)); const el = $('bKi'); let h = '<span class="kl">' + T('妖気', 'YOKI') + '</span>'; for (let i = 0; i < KI_MAX; i++) h += '<i class="' + (i < ki ? 'on' : '') + '"></i>'; el.innerHTML = h; }
  function hint(t) { const h = $('bHint'); if (!t) { h.classList.remove('on'); return; } h.textContent = t; h.classList.add('on'); }
  function banner(txt, sub, cls) { const b = $('bBanner'); b.className = 'banner ' + (cls || ''); b.innerHTML = '<div class="b1">' + txt + '</div>' + (sub ? '<div class="b2">' + sub + '</div>' : ''); void b.offsetWidth; b.classList.add('on'); }
  function refreshTop() {
    $('bWave').textContent = (stage ? L(stage.n) : '') + '  ·  ' + T('第', 'Wave ') + (waveIdx + 1) + T('波', '') + '/' + (stage ? stage.waves.length : 1);
    $('bAuto').classList.toggle('on', auto); $('bAuto').textContent = auto ? 'AUTO ON' : 'AUTO';
    $('bSpd').textContent = '×' + speed;
  }

  /* ---------- timeline ---------- */
  function predict(n) {
    const sim = [].concat(U.a, U.e).filter((u) => u.alive).map((u) => ({ u: u, ag: u.ag, spd: effSpd(u) })), out = [];
    for (let k = 0; k < n; k++) {
      let best = null, bt = 1e9; sim.forEach((s) => { const t = (1000 - s.ag) / s.spd; if (t < bt - 1e-6 || (Math.abs(t - bt) < 1e-6 && s.spd > best.spd)) { bt = t; best = s; } });
      sim.forEach((s) => { s.ag += bt * s.spd; }); best.ag -= 1000; out.push(best.u);
    } return out;
  }
  function renderTimeline() {
    const list = predict(8);
    $('bTl').innerHTML = list.map((u, i) => '<div class="tl ' + (u.side === 'a' ? 'a' : 'e') + (i === 0 ? ' first' : '') + '" style="background-image:url(' + ART(u.img) + ')"></div>').join('');
  }

  /* ---------- status + damage ---------- */
  function addStatus(u, t, turns, val, self) {
    const ex = u.st.find((s) => s.t === t); const ns = { t: t, turns: turns, val: val || 0, nw: self };
    if (ex) { ex.turns = Math.max(ex.turns, turns); ex.val = Math.max(ex.val, ns.val); ex.nw = self || ex.nw; } else u.st.push(ns);
    updateCard(u);
  }
  function tryStatus(att, tg, d) {
    let ch = d.ch == null ? 1 : d.ch; if (tg.boss && D.STATUS[d.t].bad && ['stun', 'freeze', 'charm'].includes(d.t)) ch *= 0.25;
    if (Math.random() < ch) {
      addStatus(tg, d.t, d.turns, d.val ? Math.round(att.atk * d.val) : 0, tg === cur);
      pop(tg, L(D.STATUS[d.t].n), 'st ' + d.t, -40); if (D.STATUS[d.t].bad) A.debuff();
    }
  }
  function calcDmg(att, tg, mult, sk, crit) {
    const ab = has(att, 'atkUp'), db = has(tg, 'defUp');
    let atk = att.atk * (1 + (ab ? ab.val : 0)), def = tg.def * (1 + (db ? db.val : 0)) * (1 - ((sk && sk.pierce) || 0));
    let dmg = atk * mult * rnd(0.93, 1.07) * (1 - def / (def + 60)); if (crit) dmg *= 1.5; if (tg.guard) dmg *= 0.5;
    return Math.max(1, Math.round(dmg));
  }
  let combo = 0, comboT = null;
  function comboHit(att, tg) {
    const el = $('bCombo'); if (!el) return;
    if (!att || att.side !== 'a' || tg.side !== 'e') { if (att && att.side === 'e') comboReset(); return; }
    combo++; if (comboT) clearTimeout(comboT); comboT = setTimeout(comboReset, 2600 / Math.max(1, speed * 0.75));
    if (combo < 2) return;
    el.innerHTML = '<b>' + combo + '</b><small>' + T('連撃', 'HITS') + '</small>'; el.className = 'on' + (combo >= 8 ? ' c3' : combo >= 4 ? ' c2' : '');
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); if (A.combo) A.combo(combo);
  }
  function comboReset() { combo = 0; if (comboT) { clearTimeout(comboT); comboT = null; } const el = $('bCombo'); if (el) el.className = 'out'; }
  async function hurt(att, tg, dmg, crit, pw) {
    if (!tg.alive) return; let d = dmg;
    if (tg.shield > 0) { const ab = Math.min(tg.shield, d); tg.shield -= ab; d -= ab; if (ab) pop(tg, T('結界', 'BARRIER'), 'st shield', -30); }
    tg.hp -= d; updateCard(tg);
    pop(tg, '' + dmg, crit ? 'dmg crit' : (tg.guard ? 'dmg guard' : 'dmg'), crit ? -20 : 0);
    if (dmg > 0) { const cc = center(tg); FX.impact(cc.x, cc.y, { p: Math.min(2, dmg / Math.max(1, tg.maxHp * 0.16)), crit: crit, col: crit ? '#ffd24a' : '#ffd9a0' }); if (A.impact) A.impact(crit, Math.min(1, dmg / Math.max(1, tg.maxHp * 0.3))); }
    comboHit(att, tg);
    tg.el.classList.remove('hit'); void tg.el.offsetWidth; tg.el.classList.add('hit');
    if (window.Stage) { Stage.hit(tg, att, pw || (crit ? 400 : 250)); if (crit || pw > 380) Stage.hitstop(0.07); }
    if (tg.side === 'a') { tg.ult = Math.min(100, tg.ult + 9); updateCard(tg); }
    if (stats) { if (att && att.side === 'a') stats.dealt += dmg; else stats.taken += dmg; }
    if (tg.hp <= 0) await kill(tg);
  }
  async function kill(u) {
    u.hp = 0; u.alive = false; u.st = []; u.charged = false; updateCard(u); A.die(); const c = center(u); FX.play('death', c.x, c.y);
    u.el.classList.add('dying'); if (window.Stage) Stage.hit(u, cur && cur !== u ? cur : null, 520); await wait(450);
    if (u.side === 'e' && u.el && !u.boss) u.el.classList.add('gone');
  }
  function shake(big) { if (window.Stage) Stage.shake(big ? 0.85 : 0.45); }
  const sfx = { thunder: 'thunder', thunderBig: 'thunder', fire: 'fire', fireBig: 'fire', ice: 'ice', iceBig: 'ice', wind: 'wind', windBig: 'wind', water: 'water', claw: 'claw', slash: 'slash', slashBig: 'slash', hit: 'hit', bell: 'bell', crush: 'crush' };

  /* ---------- skill execution ---------- */
  function pickTargets(u, sk, target) {
    const foes = u.side === 'a' ? alive('e') : alive('a'), friends = alive(u.side === 'a' ? 'a' : 'e'), charmed = !!has(u, 'charm');
    const F = charmed ? friends.filter((x) => x !== u) : foes;
    switch (sk.tgt) {
      case 'enemy': return [target && target.alive && (charmed ? friends.includes(target) : foes.includes(target)) ? target : (F[Math.floor(Math.random() * F.length)] || foes[0])];
      case 'enemies': return F.length ? F : foes;
      case 'rand': return [];
      case 'ally': return [target && target.alive ? target : friends[0]];
      case 'allies': return friends;
      default: return [u];
    }
  }
  async function useSkill(u, sk, target) { try { await useSkill0(u, sk, target); } finally { if (window.Stage) Stage.recover(u); } }
  async function useSkill0(u, sk, target) {
    const isA = u.side === 'a'; const foes = isA ? alive('e') : alive('a');
    // cost / gain
    if (isA) {
      if (sk.cost) setKi(ki - sk.cost);
      if (sk.ki) setKi(ki + sk.ki); if (sk.kiGain) setKi(ki + sk.kiGain);
      if (sk.ultimate) u.ult = 0; else u.ult = Math.min(100, u.ult + (sk.ult || 0));
    }
    updateCard(u);
    const nameTxt = sk.n ? L(sk.n) : '';
    if (sk.ultimate) { if (window.Stage) Stage.focus(u, 1.3); await cutIn(u, sk); } else if (isA || sk.big || sk.charge || sk.summon) { banner(nameTxt, '', isA ? 'skill' : 'foe'); }
    if (sk.guard) { u.guard = true; u.el.classList.add('guarding'); A.guard(); pop(u, T('防御', 'GUARD'), 'st guard', -30); FX.play('buff', center(u).x, center(u).y); await wait(420); return; }
    if (sk.charge) { u.charged = true; updateCard(u); A.warn(); shake(false); hint(T('⚠ 荒神が力を溜めている! 次の一撃は「防御」で備えよう', '⚠ The Arakami is gathering power! Brace with GUARD!')); FX.flash('#ff62d8', 0.25, 0.4); await wait(900); hint(''); return; }
    if (sk.summon) { await summon(u, sk.summon); return; }
    const lunTs = sk.tgt === 'rand' ? null : pickTargets(u, sk, target);
    if (window.Stage) Stage.act(u, sk, lunTs || foes);
    await wait(150);
    // heals
    if (sk.heal) {
      const ts = lunTs || pickTargets(u, sk, target); A.heal();
      for (const t of ts) {
        if (!t.alive) continue; const amt = Math.round(u.atk * sk.heal + t.maxHp * 0.1); t.hp = Math.min(t.maxHp, t.hp + amt); updateCard(t);
        pop(t, '+' + amt, 'heal'); const c = center(t); FX.play(sk.fx || 'heal', c.x, c.y); if (window.Stage) Stage.pulse(sk.fx || 'heal');
        if (sk.cleanse) { t.st = t.st.filter((s) => !D.STATUS[s.t].bad); updateCard(t); }
        if (sk.shield) { t.shield += Math.round(t.maxHp * sk.shield); updateCard(t); }
        if (sk.allySt) sk.allySt.forEach((d) => { addStatus(t, d.t, d.turns, d.val, false); });
        if (stats) stats.heal += amt;
      }
      if (sk.allySt) { A.buff(); }
      await wait(560); return;
    }
    // damage
    const hits = sk.hits || [1]; const critUp = sk.critUp || 0;
    if (sk.fx && sfx[sk.fx]) A[sfx[sk.fx]]();
    let fixedTs = sk.tgt === 'rand' ? null : lunTs;
    for (let h = 0; h < hits.length; h++) {
      if (ended) break;
      let ts = fixedTs; if (!ts) { const pool = (has(u, 'charm') ? alive(u.side).filter((x) => x !== u) : (isA ? alive('e') : alive('a'))); ts = pool.length ? [pool[Math.floor(Math.random() * pool.length)]] : []; }
      ts = ts.filter((t) => t.alive); if (!ts.length) { if (fixedTs && fixedTs.length) { const pool = isA ? alive('e') : alive('a'); ts = pool.length ? [pool[0]] : []; } if (!ts.length) break; }
      if (h > 0 && sk.fx && sfx[sk.fx]) A[sfx[sk.fx]]();
      let anyCrit = false;
      for (const t of ts) {
        const crit = Math.random() < (u.crit + critUp), dmg = calcDmg(u, t, hits[h], sk, crit); if (crit) anyCrit = true;
        const c = center(t); FX.play(sk.fx || 'hit', c.x, c.y); if (crit) FX.flash('#fff', 0.25, 0.12); if (window.Stage) Stage.pulse(sk.fx || 'hit');
        await hurt(u, t, dmg, crit, sk.ultimate ? 520 : (sk.big ? 400 : 0));
        if (t.alive && h === hits.length - 1 && sk.st) sk.st.forEach((d) => tryStatus(u, t, d));
        if (u.side === 'a' && sk.pierce == null && false) {}
      }
      if (anyCrit) { A.crit(); shake(false); } else if (sk.ultimate || sk.big) shake(true);
      await wait(hits.length > 2 ? 170 : 260);
    }
    if (sk.big) shake(true);
    if (sk.selfHeal) { const a = Math.round(u.maxHp * sk.selfHeal); u.hp = Math.min(u.maxHp, u.hp + a); updateCard(u); pop(u, '+' + a, 'heal'); FX.play('heal', center(u).x, center(u).y); }
    if (sk.selfSt) sk.selfSt.forEach((d) => { addStatus(u, d.t, d.turns, d.val, true); pop(u, L(D.STATUS[d.t].n), 'st', -40); A.buff(); });
    if (sk.allySt && !sk.heal) { alive(u.side).forEach((a) => { addStatus(a, sk.allySt[0].t, sk.allySt[0].turns, sk.allySt[0].val, a === u); pop(a, L(D.STATUS[sk.allySt[0].t].n), 'st', -40); FX.play('buff', center(a).x, center(a).y); }); A.buff(); }
    await wait(180);
  }
  async function summon(u, key) {
    A.bellBig(); FX.flash('#ff62d8', 0.3, 0.4); let n = 0;
    while (alive('e').length < 3 && n < 2) { const e = mkEnemy(key, stage.lv, U.e.length); U.e.push(e); buildCard(e, $('bEn')); e.el.classList.add('spawn'); if (window.Stage) Stage.layout(); n++; await wait(300); }
    await wait(300);
  }
  async function cutIn(u, sk) {
    const ci = $('cutin'); ci.style.setProperty('--col', u.col);
    ci.innerHTML = '<div class="ci-bg"></div><div class="ci-lines"></div><div class="ci-port"><i style="background-image:url(' + ART(u.img) + ')"></i></div><div class="ci-txt"><small>' + u.name + '</small><b>' + L(sk.n) + '</b></div><div class="ci-fl"></div>';
    ci.classList.remove('on'); void ci.offsetWidth; ci.classList.add('on'); A.cutin(); FX.flash(u.col, 0.4, 0.3); hapt([20, 40, 40]);
    if (window.Stage) Stage.shake(0.5);
    await waitR(1250); ci.classList.remove('on'); await waitR(100);
  }
  function hapt(p) { if (window.UI && UI.haptic) UI.haptic(p); }
  async function bossIntro(e) {
    const bi = $('bossIn'); if (!bi) return;
    bi.style.setProperty('--col', e.col || '#ff62d8');
    bi.innerHTML = '<div class="bi-bg"></div><div class="bi-warn"><span>' + new Array(14).join('WARNING ▲ ') + '</span></div><div class="bi-warn b"><span>' + new Array(14).join('警告 ▼ ') + '</span></div><div class="bi-port"><i style="background-image:url(' + ART(e.img) + ')"></i></div><div class="bi-name"><small>' + T('鎮守の荒神', 'GUARDIAN GOD') + '</small><b>' + e.name + '</b></div><div class="bi-fl"></div>';
    bi.classList.remove('on'); void bi.offsetWidth; bi.classList.add('on');
    A.warn(); if (A.bossIntro) A.bossIntro(); hapt([40, 60, 40, 60, 120]); FX.flash('#ff62d8', 0.35, 0.5);
    await waitR(700); if (window.Stage) Stage.shake(0.9); FX.flash('#fff', 0.5, 0.15); hapt([60]);
    await waitR(1900); bi.classList.remove('on'); await waitR(120);
  }

  /* ---------- turn flow ---------- */
  function nextActor() {
    let best = null, bt = 1e9; [].concat(U.a, U.e).forEach((u) => { if (!u.alive) return; const t = (1000 - u.ag) / effSpd(u); if (t < bt - 1e-6 || (Math.abs(t - bt) < 1e-6 && effSpd(u) > effSpd(best))) { bt = t; best = u; } });
    [].concat(U.a, U.e).forEach((u) => { if (u.alive) u.ag += bt * effSpd(u); }); best.ag -= 1000; return best;
  }
  function checkEnd() {
    if (!alive('e').length) return 'win';
    if (!alive('a').length) return 'lose'; return null;
  }
  async function takeTurn(u) {
    cur = u; tick++; document.querySelectorAll('.card.active').forEach((e) => e.classList.remove('active')); u.el.classList.add('active'); renderTimeline();
    u.guard = false; if (u.el) u.el.classList.remove('guarding'); A.turn();
    const burn = has(u, 'burn'); if (burn) { await wait(200); pop(u, '' + burn.val, 'dmg burn'); u.hp -= burn.val; updateCard(u); FX.play('fire', center(u).x, center(u).y); if (u.hp <= 0) { await kill(u); cur = null; return; } await wait(350); }
    const lock = has(u, 'freeze') || has(u, 'stun');
    if (lock) { pop(u, L(lock.t === 'freeze' ? D.STATUS.freeze.n : D.STATUS.stun.n) + '…', 'st ' + lock.t); u.st = u.st.filter((s) => s.t !== 'freeze' && s.t !== 'stun'); updateCard(u); await wait(600); }
    else if (u.side === 'a') await playerTurn(u); else await enemyTurn(u);
    // end of turn: tick durations
    u.st.forEach((s) => { if (s.nw) s.nw = false; else s.turns--; }); u.st = u.st.filter((s) => s.turns > 0); if (u.alive) updateCard(u);
    u.el.classList.remove('active'); cur = null;
  }
  async function enemyTurn(u) {
    let sk, key;
    if (u.boss) {
      if (u.charged) { u.charged = false; updateCard(u); key = 'crush'; }
      else { const list = ((u.phase === 2 && D.ENEMIES[u.key].ai2) ? D.ENEMIES[u.key].ai2 : u.ai).filter((k) => k !== 'crush'); key = list[u.aiPtr % list.length]; u.aiPtr++; }
    } else key = u.ai[Math.floor(Math.random() * u.ai.length)];
    sk = D.ENEMY_SK[key]; await wait(250);
    if (key === 'crush') { A.crush(); }
    const tg = alive('a'); const target = tg[Math.floor(Math.random() * tg.length)];
    if (has(u, 'charm') && alive('e').length < 2 && sk.tgt !== 'self') { pop(u, T('魅了…', 'Charmed…'), 'st charm'); await wait(500); return; }
    await useSkill(u, Object.assign({}, sk), target);
    if (u.boss && u.phase === 1 && u.hp < u.maxHp * 0.5 && !summoned && u.alive) { u.phase = 2; summoned = true; u.atk = Math.round(u.atk * 1.15); A.bellBig(); shake(true); banner(T('荒神、激昂', 'THE ARAKAMI ENRAGES'), T('小鬼を呼び出した!', 'It calls forth imps!'), 'foe'); await wait(900); if (D.ENEMIES[u.key].ai.includes('summon') || true) await summon(u, 'kogaki'); }
  }
  function playerTurn(u) {
    return new Promise((res) => {
      choose = { u: u, res: res }; tgtMode = null; renderCmd(u); renderTutorial(u);
      if (auto) setTimeout(autoPlay, 350 / speed);
    });
  }

  /* ---------- player commands ---------- */
  function skillsOf(u) { return [D.SK[u.kit[0]], D.SK[u.kit[1]], D.SK[u.kit[2]], D.SK.guard]; }
  function renderCmd(u) {
    const sks = skillsOf(u), c = $('bCmd'); c.classList.remove('off');
    c.innerHTML = sks.map((sk, i) => {
      const ult = sk.ultimate, ok = ult ? u.ult >= 100 : ki >= (sk.cost || 0);
      const sub = ult ? ('奥義 ' + Math.floor(u.ult) + '%').replace('奥義', T('奥義', 'ULT')) : (sk.cost ? T('妖気 ', 'Yoki ') + sk.cost : (sk.guard ? T('妖気+1 奥義+20', '+1 Yoki +20 Ult') : T('妖気+1', '+1 Yoki')));
      return '<button class="cmd ' + (ult ? 'ult ' : '') + (i === 3 ? 'guard ' : '') + (ok ? '' : 'dis') + '" data-i="' + i + '"><b>' + L(sk.n) + '</b><small>' + sub + '</small><em>' + L(sk.d) + '</em></button>';
    }).join('');
    c.querySelectorAll('.cmd').forEach((b) => b.addEventListener('click', () => onCmd(+b.dataset.i)));
    document.querySelectorAll('.card').forEach((e) => e.classList.remove('tgt'));
  }
  function onCmd(i) {
    if (!choose || ended) return; const u = choose.u, sk = skillsOf(u)[i]; A.tap();
    const ult = sk.ultimate, ok = ult ? u.ult >= 100 : ki >= (sk.cost || 0);
    if (!ok) { hint(ult ? T('奥義ゲージが足りない(攻撃を受けても溜まる)', 'Ultimate gauge not full yet (it also fills when hit)') : T('妖気が足りない! 「斬撃」か「防御」で溜めよう', 'Not enough Yoki! Build it with Strike or Guard.')); setTimeout(() => hint(''), 1800); return; }
    if (tgtMode && tgtMode.i === i) { tgtMode = null; renderCmd(u); hint(''); return; }
    if (sk.tgt === 'enemy' || sk.tgt === 'ally') {
      const pool = sk.tgt === 'enemy' ? alive('e') : alive('a');
      if (sk.tgt === 'enemy' && pool.length === 1) return commit(sk, pool[0]);
      tgtMode = { i: i, sk: sk }; renderCmd(u); document.querySelectorAll('#bCmd .cmd')[i].classList.add('sel'); pool.forEach((t) => t.el.classList.add('tgt')); hint(sk.tgt === 'enemy' ? T('攻撃する敵をタップ', 'Tap an enemy to target') : T('回復する味方をタップ', 'Tap an ally to heal'));
    } else commit(sk, null);
  }
  function onCardTap(t) { if (!choose || !tgtMode || !t.alive) return; const ok = tgtMode.sk.tgt === 'enemy' ? t.side === 'e' : t.side === 'a'; if (!ok) return; commit(tgtMode.sk, t); }
  function commit(sk, target) {
    if (!choose) return; const c = choose; choose = null; tgtMode = null; hint('');
    document.querySelectorAll('.card').forEach((e) => e.classList.remove('tgt')); $('bCmd').classList.add('off');
    useSkill(c.u, sk, target).then(() => c.res());
  }
  function autoPick(u) {
    const sks = skillsOf(u), foes = alive('e'), friends = alive('a'); const boss = foes.find((f) => f.boss);
    if (boss && boss.charged && ki < 6) return { sk: D.SK.guard };
    if (u.ult >= 100) { const sk = sks[2]; return { sk: sk, target: sk.tgt === 'ally' ? friends[0] : foes.slice().sort((a, b) => b.hp - a.hp)[0] }; }
    const sk1 = sks[1];
    if (ki >= 2) {
      if (sk1.heal) { const w = friends.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; if (w.hp / w.maxHp < 0.6) return { sk: sk1, target: w }; }
      else { const tgt = foes.slice().sort((a, b) => a.hp - b.hp)[0]; return { sk: sk1, target: tgt }; }
    }
    const low = foes.slice().sort((a, b) => a.hp - b.hp)[0]; if (sks[1].heal && friends.some((f) => f.hp / f.maxHp < 0.5) && ki >= 2) return { sk: sk1, target: friends.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] };
    return { sk: sks[0], target: low };
  }
  function autoPlay() { if (!choose || !auto || ended) return; const u = choose.u, p = autoPick(u); commit(p.sk, p.target); }
  function renderTutorial(u) {
    if (!stage || !stage.tut || S.d.tut.battle) return; const key = hintState;
    if (round <= 1 && hintState === 0) { hint(T('「斬撃」をタップして、敵を選ぼう', 'Tap STRIKE, then pick an enemy.')); hintState = 1; }
    else if (hintState === 1 && ki >= 2) { hint(T('妖気が2たまった! 「雷刃/技」は強力。画面上の行動順も確認しよう', 'You have 2 Yoki! Skills hit harder. Watch the turn order bar too.')); hintState = 2; setTimeout(() => { if (hintState === 2) hint(''); }, 4500); }
    else if (hintState === 2 && u.ult >= 100) { hint(T('奥義ゲージが満タン! 奥義でとどめを!', 'Ultimate is ready! Finish them off!')); hintState = 3; }
  }

  /* ---------- wave / battle loop ---------- */
  function spawnWave() {
    const w = stage.waves[waveIdx]; const pe = $('bEn'); pe.innerHTML = ''; U.e = []; if (window.Stage) Stage.clearSide('e');
    pe.className = 'b-enemies n' + w.length + (w.some((k) => D.ENEMIES[k].boss) ? ' hasboss' : '');
    w.forEach((k, i) => { const e = mkEnemy(k, stage.lv, i); U.e.push(e); const el = buildCard(e, pe); el.classList.add('spawn'); });
    if (window.Stage) Stage.layout(); refreshTop(); renderTimeline();
  }
  async function loop() {
    let boss = stage.waves.some((w) => w.some((k) => D.ENEMIES[k].boss));
    A.music(stage.musicBoss ? 'boss' : 'battle');
    if (U.e.some((e) => e.boss)) await bossIntro(U.e.find((e) => e.boss)); else { banner(L(stage.n), T('第' + (waveIdx + 1) + '波', 'Wave ' + (waveIdx + 1)), 'wave'); await wait(1100); }
    while (!ended) {
      const r = checkEnd();
      if (r === 'win') {
        waveIdx++; if (waveIdx >= stage.waves.length) { await finish(true); return; }
        await wait(400); hint(''); spawnWave(); const isBoss = U.e.some((e) => e.boss);
        if (isBoss) { A.music('boss'); await bossIntro(U.e.find((e) => e.boss) || U.e[0]); }
        else { banner(T('第' + (waveIdx + 1) + '波', 'Wave ' + (waveIdx + 1)), '', 'wave'); await wait(1000); }
        continue;
      }
      if (r === 'lose') { await defeat(); if (ended) return; continue; }
      const u = nextActor(); if (u.side === 'a' && u === U.a[0]) round++;
      await takeTurn(u); await wait(120);
    }
  }
  async function defeat() {
    A.lose(); await wait(500);
    const choice = await window.UI.defeatModal(!revived);
    if (choice === 'revive') {
      revived = true; U.a.forEach((a) => { a.alive = true; a.hp = Math.round(a.maxHp * 0.5); a.st = []; a.ult = Math.max(a.ult, 50); a.el.classList.remove('dying', 'dead'); updateCard(a); FX.play('heal', center(a).x, center(a).y); });
      A.heal(); banner(T('復活!', 'REVIVED!'), '', 'wave'); await wait(900); return;
    }
    await finish(false);
  }
  async function finish(win) {
    if (ended) return; ended = true; hint(''); choose = null; $('bCmd').classList.add('off');
    if (win) { A.win(); banner(T('勝利', 'VICTORY'), '', 'win'); await wait(1300); }
    const mealExp = (S.d.buff && S.d.buff.left > 0 && D.DISHES[S.d.buff.dish].buff.exp) || 0;
    const res = { win: win, mealExp: mealExp, stage: stage, id: opts.id, rounds: round, survivors: alive('a').length, dealt: stats.dealt, taken: stats.taken };
    S.d.stats.battles++; if (win) S.d.stats.wins++;
    if (S.d.buff && S.d.buff.left > 0) { S.d.buff.left--; if (S.d.buff.left <= 0) S.d.buff = null; }
    if (stage.tut && win) S.d.tut.battle = true;
    B.on = false; if (window.Ads) Ads.gameplayStop(); S.save(); opts.onEnd(res);
  }

  B.start = function (id, o) {
    opts = Object.assign({ id: id }, o || {}); stage = D.STAGES[id]; ended = false; revived = false; round = 0; waveIdx = 0; summoned = false; hintState = 0; cur = null; choose = null; tgtMode = null;
    stats = { dealt: 0, taken: 0, heal: 0 }; speed = S.d.set.speed || 1; auto = !!S.d.set.auto; B.on = true;
    const ids = S.d.party.filter((id) => S.d.chars[id].own);
    U = { a: ids.map((id, i) => mkAlly(id, i)), e: [] };
    $('bg').style.backgroundImage = 'url(' + ART(stage.bg) + ')'; $('bEn').innerHTML = ''; $('bPa').innerHTML = ''; $('bCmd').innerHTML = ''; $('bCmd').classList.add('off'); $('bTl').innerHTML = '';
    FX.clear(); comboReset(); if (window.Stage) { Stage.begin(stage); Stage.setSpeed(speed); } U.a.forEach((a) => buildCard(a, $('bPa'))); $('bPa').className = 'b-party n' + U.a.length;
    const mealKi = S.d.buff && S.d.buff.left > 0 && D.DISHES[S.d.buff.dish].buff.ki || 0; KI_MAX = 6; setKi(2 + mealKi);
    spawnWave(); refreshTop(); if (window.Ads) Ads.gameplayStart();
    loop();
  };
  B.retreat = function () { if (!B.on || ended) return; ended = true; choose = null; B.on = false; hint(''); if (window.Ads) Ads.gameplayStop(); opts.onEnd({ win: false, retreat: true, stage: stage, id: opts.id }); };
  B.state = () => ({ on: B.on, ended: ended, round: round, ki: ki, wave: waveIdx, U: U, choosing: !!choose });
  B.autoPlayNow = autoPlay;
  B._U = () => U; B._ki = (n) => { if (n != null) ki = n; return ki; };
  window.Battle = B;
})();
