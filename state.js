/* state.js - save data, stats, rewards, offline rest, daily login. */
(function () {
  const KEY = 'hyakkiNoYoru.save.v1';
  const D = window.DATA;
  const S = { d: null };
  const dayKey = (t) => { const x = new Date(t || Date.now()); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
  S.dayKey = dayKey;

  function fresh() {
    const chars = {};
    D.CHAR_ORDER.forEach((id) => { chars[id] = { own: !!D.CHARS[id].start, lv: 1, exp: 0, star: 0, shards: 0, bond: 0, eq: {}, seenBond: {} }; });
    chars.mumei.path = 'oni';
    const now = Date.now();
    return {
      v: VER, created: now, lastSeen: now, restAt: now, uid: 1,
      gold: 300, mag: 20, ing: { rice: 2, herb: 1, fish: 1 },
      chars: chars, items: [], party: ['mumei'], cleared: {}, seen: {}, tut: {}, flags: {},
      buff: null, chestAt: now, chestCount: 0, quests: null, daily: { last: null, day: 0, claimed: false, streak: 0 },
      stats: { battles: 0, wins: 0, ads: 0, cooks: 0, chests: 0, playSec: 0 },
      set: { sound: true, music: true, haptic: true, speed: 1, auto: false, lang: null },
      winStreak: 0, stars: {},
    };
  }

  /* ---------- save robustness ----------
   * Keys: KEY (primary), KEY_bak (rolling copy, <=1 per 20 s), KEY_bad / KEY_bad2 (corrupt data set aside, never auto-deleted),
   *       KEY_prev (copy of what an import / locked-reset replaced), KEY_pre<N> (copy taken before migrating from version N).
   * Rules: data we cannot understand (newer version, corrupt) is NEVER overwritten: newer => this session runs unsaved (S.locked);
   *        corrupt => raw text is copied to _bad first, then the rolling backup is tried. */
  const VER = 1;                         // current save format version (the `v` field)
  const BAK = KEY + '_bak', BAD = KEY + '_bad', BAD2 = KEY + '_bad2', PREV = KEY + '_prev';
  let lastBak = 0, lastJs = null, failStreak = false;
  /* migration chain: MIG[n] upgrades a version-n save object to version n+1 (mutate or return a new object).
     Add MIG[1] = (d) => { ...; return d; } when VER becomes 2. v0 = legacy saves that have no `v` field. */
  const MIG = { 0: (d) => d };
  S.VER = VER; S.status = 'ok'; S.locked = null;     // status: ok | recovered | lost | newer | newgame ; locked: null | 'newer' | 'tab'
  const ls = () => { try { return window.localStorage; } catch (e) { return null; } };
  const lget = (k) => { try { const l = ls(); return l ? l.getItem(k) : null; } catch (e) { return null; } };
  const lset = (k, v) => { try { const l = ls(); if (!l) return false; l.setItem(k, v); return true; } catch (e) { return false; } };
  const ldel = (k) => { try { const l = ls(); if (l) l.removeItem(k); } catch (e) {} };
  S.parse = function (raw) { // -> { d, from } | { err: 'parse' | 'shape' | 'newer', ver }
    let d; try { d = JSON.parse(raw); } catch (e) { return { err: 'parse' }; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return { err: 'shape' };
    let v = d.v; if (v === undefined && (d.chars || d.gold !== undefined || d.cleared)) v = 0;
    if (typeof v !== 'number' || !isFinite(v) || v < 0 || Math.floor(v) !== v) return { err: 'shape' };
    if (v > VER) return { err: 'newer', ver: v };
    const from = v;
    try { while (v < VER) { const m = MIG[v]; if (!m) return { err: 'shape' }; d = m(d) || d; v++; d.v = v; } } catch (e) { return { err: 'shape' }; }
    return { d: d, from: from };
  };
  const kind = (x) => (x === null ? 'null' : Array.isArray(x) ? 'array' : typeof x);
  function normalize(d) { // keep the player's data, only repair fields whose TYPE is unusable so boot never throws
    const f = fresh(), out = Object.assign(f, d);
    Object.keys(f).forEach((k) => { const fk = kind(fresh()[k]); if (fk !== 'null' && kind(out[k]) !== fk) out[k] = fresh()[k]; });
    if (!out.chars || typeof out.chars !== 'object') out.chars = {};
    D.CHAR_ORDER.forEach((id) => { const c = out.chars[id]; out.chars[id] = Object.assign({ own: false, lv: 1, exp: 0, star: 0, shards: 0, bond: 0, eq: {}, seenBond: {} }, c && typeof c === 'object' ? c : {}); const cc = out.chars[id]; if (!cc.eq || typeof cc.eq !== 'object') cc.eq = {}; if (!cc.seenBond || typeof cc.seenBond !== 'object') cc.seenBond = {}; });
    out.set = Object.assign(fresh().set, out.set); out.stats = Object.assign(fresh().stats, out.stats); out.daily = Object.assign(fresh().daily, out.daily);
    out.ing = Object.assign(fresh().ing, out.ing); out.party = out.party.filter((id) => D.CHARS[id]); if (!out.party.length) out.party = ['mumei'];
    if (out.buff && !(D.DISHES && D.DISHES[out.buff.dish])) out.buff = null;
    return out;
  }
  function setAside(raw) { // keep a copy of unreadable data, newest in _bad, previous one in _bad2
    if (!raw) return; const cur = lget(BAD); if (cur === raw) return; if (cur) lset(BAD2, cur); lset(BAD, raw);
  }
  S.load = function () {
    S.status = 'ok'; S.locked = null; S.migratedFrom = null;
    const raw = lget(KEY); let d = null, res = null;
    if (raw !== null) {
      res = S.parse(raw);
      if (res.d) d = res.d;
      else if (res.err === 'newer') { S.status = 'newer'; S.locked = 'newer'; S.foundVer = res.ver; }
      else { setAside(raw); S.status = 'lost'; }
    }
    if (!d && !S.locked) { // primary missing or corrupt: the rolling backup is the safety net
      const braw = lget(BAK);
      if (braw !== null) { const r2 = S.parse(braw); if (r2.d) { d = r2.d; res = r2; if (raw !== null) S.status = 'recovered'; } else if (r2.err === 'newer') { S.status = 'newer'; S.locked = 'newer'; S.foundVer = r2.ver; } }
    }
    if (d && res && res.from < VER) { S.migratedFrom = res.from; lset(KEY + '_pre' + res.from, raw !== null ? raw : lget(BAK)); }
    S.d = d ? normalize(d) : fresh();
    if (!d && !S.locked && S.status === 'ok') S.status = 'newgame';
    lastJs = null; return S.d;
  };
  /* session ids: every page load gets its own id. Each save stamps it in a side key just before the main write, so the storage handler can tell
     (a) its own writes and (b) the previous page of THIS tab (sessionStorage survives a reload; its pagehide save lands right after the new page loads)
     from a genuinely different tab. A duplicated tab inherits sessionStorage, hence the 3 s cutoff on rule (b). */
  const SIDK = KEY + '_sid', LOAD_T = Date.now();
  const mkSid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  let prevSid = null; S.sid = mkSid();
  try { prevSid = sessionStorage.getItem('hy_sid'); sessionStorage.setItem('hy_sid', S.sid); } catch (e) {}
  S.save = function () {
    if (S.locked) return false;
    let js; try { S.d.lastSeen = Date.now(); js = JSON.stringify(S.d); } catch (e) { return false; }
    const put = (withBak) => {
      const l = ls(); if (!l) throw new Error('nostorage');
      try { l.setItem(SIDK, S.sid); } catch (e) {}
      l.setItem(KEY, js); lastJs = js;
      const t = Date.now(); if (withBak && t - lastBak > 20000) { lastBak = t; try { l.setItem(BAK, js); } catch (e) {} }
    };
    let ok = true;
    try { put(true); } catch (e) {
      /* quota full: free the disposable copies (rolling backup + error note) and retry. Set-aside corrupt data (_bad/_bad2) and _prev/_pre* are never deleted. */
      try { ldel(BAK); ldel('hy_lasterr'); put(false); } catch (e2) { ok = false; }
    }
    if (ok) failStreak = false; else if (!failStreak) { failStreak = true; try { if (S.onSaveFail) S.onSaveFail(); } catch (e) {} }
    return ok;
  };
  /* another tab wrote the save: stop writing in this tab so a stale copy can never overwrite it */
  window.addEventListener('storage', (e) => {
    if (e.storageArea && window.localStorage && e.storageArea !== window.localStorage) return;
    if (e.key !== KEY && e.key !== null) return; if (e.newValue === lastJs || S.locked || !S.d) return;
    if (e.key === KEY) { let w = null; try { w = window.localStorage.getItem(SIDK); } catch (x) {}
      if (w && (w === S.sid || (w === prevSid && Date.now() - LOAD_T < 3000))) return; }
    S.locked = 'tab'; try { if (S.onLock) S.onLock('tab'); } catch (x) {}
  });
  S.reset = function () {
    if (S.locked) { const raw = lget(KEY) || lget(BAK); if (raw) lset(PREV, raw); } /* never destroy data we could not read: keep a copy */
    ldel(KEY); ldel(BAK); if (!S.locked && S.status !== 'lost') { ldel(BAD); ldel(BAD2); } /* set-aside corrupt data survives until the player has seen the warning */
    S.locked = null; S.load(); S.save();
  };
  /* ---- export / import ---- */
  S.exportJSON = function () { return JSON.stringify(S.d); };
  S.hasBad = () => !!lget(BAD);
  S.badRaw = () => lget(BAD) || '';
  S.importJSON = function (text) { // validates fully, keeps a copy of what it replaces, then writes. returns {ok} | {ok:false, err}
    text = String(text || '').trim(); if (!text) return { ok: false, err: 'empty' };
    const r = S.parse(text); if (!r.d) return { ok: false, err: r.err };
    const d = normalize(r.d); d.lastSeen = Date.now();
    const cur = lget(KEY); if (cur) lset(PREV, cur); else if (S.d && !S.locked) lset(PREV, JSON.stringify(S.d));
    let js; try { js = JSON.stringify(d); } catch (e) { return { ok: false, err: 'shape' }; }
    if (!lset(KEY, js)) { ldel(BAK); if (!lset(KEY, js)) return { ok: false, err: 'write' }; }
    lset(BAK, js); lastBak = Date.now(); S.locked = null; S.d = d; lastJs = js; return { ok: true };
  };
  S.isNew = () => !S.d.seen.c1s1pre && Object.keys(S.d.cleared).length === 0;

  /* ---------- items ---------- */
  S.makeItem = function (slot, rar) {
    const it = { uid: S.d.uid++, slot: slot, rar: rar, lv: 0, nm: Math.floor(Math.random() * 3) };
    S.d.items.push(it); return it;
  };
  S.itemFromCode = function (code) { // 'weapon_r'
    const at = String(code).split('@'), p = at[0].split('_'), it = S.makeItem(p[0], { n: 0, r: 1, sr: 2 }[p[1]]); // 'charm_sr@1' pins the name index
    if (at[1] != null && D.ITEM_NAMES[it.slot][it.rar][+at[1]]) it.nm = +at[1]; return it;
  };
  S.itemName = (it) => L(D.ITEM_NAMES[it.slot][it.rar][it.nm]);
  S.itemById = (uid) => S.d.items.find((i) => i.uid === uid);
  S.itemOwner = function (uid) { for (const id of D.CHAR_ORDER) { const e = S.d.chars[id].eq; for (const k in e) if (e[k] === uid) return id; } return null; };
  S.equip = function (cid, uid) {
    const it = S.itemById(uid); if (!it) return; const o = S.itemOwner(uid); if (o) delete S.d.chars[o].eq[it.slot];
    S.d.chars[cid].eq[it.slot] = uid; S.save();
  };
  S.unequip = function (cid, slot) { delete S.d.chars[cid].eq[slot]; S.save(); };
  S.upCost = (it) => 90 * (it.lv + 1) * (it.rar + 1);
  S.upgrade = function (uid) {
    const it = S.itemById(uid); if (!it || it.lv >= 5) return false; const c = S.upCost(it);
    if (S.d.gold < c) return false; S.d.gold -= c; it.lv++; S.save(); return true;
  };

  /* ---------- stats ---------- */
  S.bondLv = function (cid) { const b = S.d.chars[cid].bond; let l = 0; for (let i = 1; i < D.bondNeed.length; i++) if (b >= D.bondNeed[i]) l = i; return l; };
  S.baseStats = function (cid, lv, star) {
    const b = D.CHARS[cid].base, m = (1 + 0.115 * (lv - 1)) * (1 + 0.08 * star);
    return { hp: Math.round(b.hp * m), atk: Math.round(b.atk * m), def: Math.round(b.def * m), spd: b.spd, crit: D.CHARS[cid].crit };
  };
  S.stats = function (cid, withBuff) {
    const c = S.d.chars[cid], s = S.baseStats(cid, c.lv, c.star);
    for (const slot of D.SLOTS) {
      const it = c.eq[slot] && S.itemById(c.eq[slot]); if (!it) continue;
      const st = D.statOfItem(it); s.hp += st.hp || 0; s.atk += st.atk || 0; s.def += st.def || 0; s.crit += st.crit || 0; s.spd += st.spd || 0;
    }
    const bl = S.bondLv(cid); const bm = 1 + 0.03 * bl; s.hp = Math.round(s.hp * bm); s.atk = Math.round(s.atk * bm);
    if (withBuff && S.d.buff && S.d.buff.left > 0) {
      const b = D.DISHES[S.d.buff.dish].buff;
      if (b.hp) s.hp = Math.round(s.hp * (1 + b.hp)); if (b.atk) s.atk = Math.round(s.atk * (1 + b.atk)); if (b.crit) s.crit += b.crit;
    }
    s.crit = Math.min(0.75, s.crit); return s;
  };
  S.power = function (cid) { const s = S.stats(cid); return Math.round(s.hp / 4 + s.atk * 3 + s.def * 4 + s.spd / 2); };
  S.partyPower = () => S.d.party.reduce((a, id) => a + S.power(id), 0);

  /* ---------- exp / bond ---------- */
  S.addExp = function (cid, amt) {
    const c = S.d.chars[cid]; if (!c.own) return 0; let up = 0; const cap = D.levelCap(c.star);
    if (c.lv >= cap) return 0; c.exp += amt;
    while (c.lv < cap && c.exp >= D.expNeed(c.lv)) { c.exp -= D.expNeed(c.lv); c.lv++; up++; }
    if (c.lv >= cap) c.exp = 0; return up;
  };
  S.addBond = function (cid, n) { if (S.d.chars[cid].own && cid !== 'mumei') S.d.chars[cid].bond += n; };
  S.pendingBond = function (cid) { // unseen bond event available (levels 2 and 4)
    const bl = S.bondLv(cid), c = S.d.chars[cid];
    for (const lv of [2, 4]) if (bl >= lv && !c.seenBond[lv] && window.STORY['b_' + cid + '_' + lv]) return lv; return 0;
  };
  S.starUp = function (cid) {
    const c = S.d.chars[cid]; if (c.star >= D.MAX_STAR) return false; const need = D.starNeed[c.star];
    if (c.shards < need) return false; c.shards -= need; c.star++; S.save(); return true;
  };

  /* ---------- rewards ---------- */
  // rew: {gold,mag,rice,herb,fish,item:'weapon_r', shard:{id:n}}; returns display list
  S.grant = function (rew) {
    const out = [];
    if (rew.gold) { S.d.gold += rew.gold; out.push({ k: 'gold', n: rew.gold }); }
    if (rew.mag) { S.d.mag += rew.mag; out.push({ k: 'mag', n: rew.mag }); }
    ['rice', 'herb', 'fish'].forEach((k) => { if (rew[k]) { S.d.ing[k] += rew[k]; out.push({ k: k, n: rew[k] }); } });
    if (rew.item) { const it = S.itemFromCode(rew.item); out.push({ k: 'item', it: it }); }
    if (rew.shard) for (const id in rew.shard) { const c = S.d.chars[id]; c.shards += rew.shard[id]; out.push({ k: 'shard', id: id, n: rew.shard[id] }); }
    S.checkRecruit(); return out;
  };
  S.checkRecruit = function () {
    const got = [];
    D.CHAR_ORDER.forEach((id) => { const c = S.d.chars[id]; if (!c.own && c.shards >= 10) { c.own = true; c.shards -= 10; got.push(id); } });
    if (got.length) { S.d.newRecruits = (S.d.newRecruits || []).concat(got); } return got;
  };
  S.rollChest = function (bonus) {
    const r = Math.random(), rew = { gold: 180 + Math.floor(Math.random() * 220) };
    const pool = ['rice', 'herb', 'fish']; rew[pool[Math.floor(Math.random() * 3)]] = 1 + Math.floor(Math.random() * 3);
    const prog = S.furthest();
    if (r < 0.28) { const sl = D.SLOTS[Math.floor(Math.random() * 3)]; rew.item = sl + (Math.random() < (prog >= 4 ? 0.25 : 0.1) ? '_sr' : Math.random() < 0.5 ? '_r' : '_n'); }
    const sh = {}; const locked = D.CHAR_ORDER.filter((id) => !S.d.chars[id].own && id !== 'mumei');
    const owned = D.CHAR_ORDER.filter((id) => S.d.chars[id].own);
    if (r > 0.6 || bonus) { const pick = (locked.length && Math.random() < 0.65) ? locked[Math.floor(Math.random() * locked.length)] : owned[Math.floor(Math.random() * owned.length)]; sh[pick] = 1 + (bonus ? 2 : 1); rew.shard = sh; }
    if (Math.random() < 0.3) rew.mag = 3 + Math.floor(Math.random() * 5);
    return rew;
  };
  S.CHEST_MS = 30 * 60 * 1000;
  S.chestReady = () => Date.now() >= S.d.chestAt;
  S.furthest = function () { let n = 0; D.STAGE_ORDER.forEach((id, i) => { if (S.d.cleared[id]) n = i + 1; }); return n; };
  S.stageUnlocked = function (id) { const i = D.STAGE_ORDER.indexOf(id); if (i < 0) return false; return i === 0 || !!S.d.cleared[D.STAGE_ORDER[i - 1]]; };

  /* ---------- offline rest (campfire) ---------- */
  S.REST_CAP_MIN = 480;
  S.restPending = function () {
    const mins = Math.min(S.REST_CAP_MIN, Math.max(0, (Date.now() - S.d.restAt) / 60000)); const prog = Math.max(1, S.furthest());
    const o = { mins: Math.floor(mins), gold: Math.floor(mins * (4 + prog * 1.5)), exp: Math.floor(mins * (1.0 + prog * 0.35)), rice: 0, herb: 0, fish: 0 };
    const roll = Math.floor(mins / 20); const seed = Math.floor(S.d.restAt / 60000) % 7;
    o.rice = Math.floor(roll * 0.5) + (seed % 2); o.herb = Math.floor(roll * 0.4) + (seed % 3 === 0 ? 1 : 0); o.fish = Math.floor(roll * 0.3);
    if (mins < 5) { o.rice = o.herb = o.fish = 0; } o.full = mins >= S.REST_CAP_MIN; return o;
  };
  S.restClaim = function (mult) {
    mult = mult || 1; const p = S.restPending(); const levels = {};
    S.grant({ gold: p.gold * mult, rice: p.rice * mult, herb: p.herb * mult, fish: p.fish * mult });
    S.d.party.forEach((id) => { const u = S.addExp(id, p.exp * mult); if (u) levels[id] = u; });
    S.d.restAt = Date.now(); S.save(); return { p: p, mult: mult, levels: levels };
  };

  /* ---------- daily ---------- */
  S.newDayCheck = function () {
    const k = dayKey(), dly = S.d.daily; let isNewDay = false;
    if (dly.last !== k) {
      isNewDay = true; const y = dayKey(Date.now() - 86400000);
      dly.streak = dly.last === y ? dly.streak + 1 : (dly.last ? 1 : 1);
      if (dly.last && dly.last !== y) dly.streak = 1;
      dly.last = k; dly.claimed = false; dly.day = dly.day || 0;
      S.d.quests = {}; D.QUESTS.forEach((q) => { S.d.quests[q.id] = { n: 0, claimed: false }; });
    }
    if (!S.d.quests) { S.d.quests = {}; D.QUESTS.forEach((q) => { S.d.quests[q.id] = { n: 0, claimed: false }; }); }
    return isNewDay;
  };
  S.loginClaim = function (mult) {
    const dly = S.d.daily; if (dly.claimed) return null; const rew = Object.assign({}, D.LOGIN[dly.day % 7]); const out = [];
    for (let i = 0; i < (mult || 1); i++) { const r2 = Object.assign({}, rew); if (i > 0 && r2.item) delete r2.item; out.push.apply(out, S.grant(r2)); }
    dly.claimed = true; dly.day = (dly.day + 1) % 7; S.save(); return out;
  };
  S.quest = function (id, n) { const q = S.d.quests && S.d.quests[id]; if (!q) return; const g = D.QUESTS.find((x) => x.id === id).goal; q.n = Math.min(g, q.n + (n || 1)); };
  S.questClaim = function (id) {
    const q = S.d.quests[id], def = D.QUESTS.find((x) => x.id === id); if (!q || q.claimed || q.n < def.goal) return null; q.claimed = true;
    const out = S.grant(def.rew); S.save(); return out;
  };
  S.questsDone = () => D.QUESTS.filter((q) => S.d.quests[q.id].n >= q.goal && !S.d.quests[q.id].claimed).length;

  /* ---------- cooking ---------- */
  S.canCook = function (dish) { const n = D.DISHES[dish].need; for (const k in n) if (S.d.ing[k] < n[k]) return false; return true; };
  S.cook = function (dish) {
    if (!S.canCook(dish)) return false; const n = D.DISHES[dish].need; for (const k in n) S.d.ing[k] -= n[k];
    S.d.buff = { dish: dish, left: D.DISHES[dish].battles }; S.d.stats.cooks++; S.quest('cook'); S.save(); return true;
  };
  window.State = S;
})();
