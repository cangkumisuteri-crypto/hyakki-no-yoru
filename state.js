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
      v: 1, created: now, lastSeen: now, restAt: now, uid: 1,
      gold: 300, mag: 20, ing: { rice: 2, herb: 1, fish: 1 },
      chars: chars, items: [], party: ['mumei'], cleared: {}, seen: {}, tut: {}, flags: {},
      buff: null, chestAt: now, chestCount: 0, quests: null, daily: { last: null, day: 0, claimed: false, streak: 0 },
      stats: { battles: 0, wins: 0, ads: 0, cooks: 0, chests: 0, playSec: 0 },
      set: { sound: true, music: true, speed: 1, auto: false, lang: null },
      winStreak: 0,
    };
  }

  S.load = function () {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    const f = fresh();
    if (d && d.v === 1) { // shallow-merge defaults so new fields never crash
      d = Object.assign(f, d);
      D.CHAR_ORDER.forEach((id) => { d.chars[id] = Object.assign({ own: false, lv: 1, exp: 0, star: 0, shards: 0, bond: 0, eq: {}, seenBond: {} }, d.chars[id] || {}); });
      d.set = Object.assign(f.set, d.set || {}); d.stats = Object.assign(f.stats, d.stats || {}); d.daily = Object.assign(f.daily, d.daily || {});
    } else d = f;
    S.d = d; return d;
  };
  S.save = function () { try { S.d.lastSeen = Date.now(); localStorage.setItem(KEY, JSON.stringify(S.d)); } catch (e) {} };
  S.reset = function () { try { localStorage.removeItem(KEY); } catch (e) {} S.load(); S.save(); };
  S.isNew = () => !S.d.seen.c1s1pre && Object.keys(S.d.cleared).length === 0;

  /* ---------- items ---------- */
  S.makeItem = function (slot, rar) {
    const it = { uid: S.d.uid++, slot: slot, rar: rar, lv: 0, nm: Math.floor(Math.random() * 3) };
    S.d.items.push(it); return it;
  };
  S.itemFromCode = function (code) { // 'weapon_r'
    const p = code.split('_'); return S.makeItem(p[0], { n: 0, r: 1, sr: 2 }[p[1]]);
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
