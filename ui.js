/* ui.js - screens, modals, hub tabs (journey / party / camp). Story + flow live in main.js. */
(function () {
  const D = window.DATA, S = window.State, A = window.GameAudio;
  const $ = (id) => document.getElementById(id);
  const UI = { W: 1280, H: 720, scale: 1, port: false, tab: 'journey', screen: 'title' };
  window.UI = UI;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  UI.esc = esc;

  /* ---------- layout ---------- */
  UI.resize = function () {
    const vw = window.innerWidth, vh = window.innerHeight, app = $('app');
    UI.port = vw / vh < 1.05; UI.W = UI.port ? 720 : 1280; UI.H = UI.port ? 1280 : 720;
    UI.scale = Math.min(vw / UI.W, vh / UI.H);
    app.style.width = UI.W + 'px'; app.style.height = UI.H + 'px';
    app.style.transform = 'translate(' + ((vw - UI.W * UI.scale) / 2) + 'px,' + ((vh - UI.H * UI.scale) / 2) + 'px) scale(' + UI.scale + ')';
    app.classList.toggle('port', UI.port); app.classList.toggle('land', !UI.port);
    app.style.setProperty('--t44', Math.ceil(44 / UI.scale) + 'px'); // 44 physical px (Apple HIG) expressed in design px, for tap targets
    UI.safeArea(vw, vh);
    if (window.FX) FX.resize(UI.W, UI.H, UI.scale);
  };
  /* notch / home-indicator insets -> design-space CSS vars (--sat/--sar/--sab/--sal) */
  UI.safeArea = function (vw, vh) {
    const app = $('app'); let pr = UI._sa;
    if (!pr) { pr = UI._sa = document.createElement('div'); pr.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.body.appendChild(pr); }
    const cs = getComputedStyle(pr); let t = parseFloat(cs.paddingTop) || 0, r = parseFloat(cs.paddingRight) || 0, b = parseFloat(cs.paddingBottom) || 0, l = parseFloat(cs.paddingLeft) || 0;
    const q = /[?&]sa=([\d.]+),([\d.]+),([\d.]+),([\d.]+)/.exec(location.search); if (q) { t = +q[1]; r = +q[2]; b = +q[3]; l = +q[4]; }
    const ox = (vw - UI.W * UI.scale) / 2, oy = (vh - UI.H * UI.scale) / 2, k = UI.scale || 1;
    const f = (v, o) => Math.max(0, Math.round((v - o) / k));
    app.style.setProperty('--sat', f(t, oy) + 'px'); app.style.setProperty('--sab', f(b, oy) + 'px'); app.style.setProperty('--sar', f(r, ox) + 'px'); app.style.setProperty('--sal', f(l, ox) + 'px');
  };
  UI.haptic = function (p) { try { if (S.d && S.d.set && S.d.set.haptic === false) return; const n = Date.now(); if (n - (UI._hz || 0) < 35) return; UI._hz = n; if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  UI.show = function (name) {
    const prev = UI.screen, w = $('wipe');
    if (w && prev !== name && UI._booted && !(window.HY && window.HY.lite) && !window.__fast && !/[?&]nowipe/.test(location.search)) { w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); clearTimeout(UI._wt); UI._wt = setTimeout(() => w.classList.remove('go'), 700); }
    $('app').classList.remove('postwin'); UI.screen = name; document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + name));
    $('app').dataset.screen = name;
    if (name === 'battle' || name === 'story') $('app').classList.add('immersive'); else $('app').classList.remove('immersive');
  };
  UI.setBg = function (img, dim) { $('bg').style.backgroundImage = img ? 'url(' + ART(img) + ')' : 'none'; $('bgShade').style.opacity = dim == null ? 0.55 : dim; };
  UI.toast = function (msg) { const t = $('toast'); t.textContent = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on'); clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.remove('on'), 2200); };

  /* ---------- icons / formatting ---------- */
  const ICO = { gold: 'koban', mag: 'mag', rice: 'rice', herb: 'herb', fish: 'fish', weapon: 'weapon', armor: 'armor', charm: 'charm' };
  const ico = (k) => '<span class="ib ' + k + '"><svg viewBox="0 0 48 48"><use href="#i-' + (ICO[k] || 'sparkle') + '"/></svg></span>';
  UI.svg = (n, cls) => '<svg class="' + (cls || 'i') + '" viewBox="0 0 48 48"><use href="#i-' + n + '"/></svg>';
  UI.starsHtml = (n, pop) => '<span class="stars' + (pop ? ' pop' : '') + '">' + [1, 2, 3].map((i) => '<svg class="' + (i <= n ? 'on' : 'off') + '" viewBox="0 0 48 48"><use href="#i-star"/></svg>').join('') + '</span>';
  UI.ico = ico;
  const ingName = (k) => L(D.ING[k]);
  UI.rewardHtml = function (list) {
    return '<div class="rwl">' + list.map((r) => {
      if (r.k === 'item') return '<div class="rw item r' + r.it.rar + '">' + ico(r.it.slot) + '<span>' + esc(S.itemName(r.it)) + '<small>' + D.RARITY[r.it.rar].n[0 + (I18N.lang === 'ja' ? 0 : 1)] + '</small></span></div>';
      if (r.k === 'shard') return '<div class="rw"><span class="shchip" style="background-image:url(' + ART(r.id) + ')"></span><span>' + esc(L(D.CHARS[r.id].n)) + ' ' + T('の欠片', 'shards') + ' ×' + r.n + '</span></div>';
      const nm = r.k === 'gold' ? T('小判', 'Gold') : r.k === 'mag' ? T('魂玉', 'Soul Gems') : ingName(r.k);
      return '<div class="rw">' + ico(r.k) + '<span>' + nm + ' ×' + r.n + '</span></div>';
    }).join('') + '</div>';
  };
  const needHtml = (n) => Object.keys(n).map((k) => '<span class="nd ' + (S.d.ing[k] >= n[k] ? 'ok' : 'no') + '">' + ico(k) + S.d.ing[k] + '/' + n[k] + '</span>').join('');

  /* ---------- modal ---------- */
  UI.modal = function (o) {
    const wrap = document.createElement('div'); wrap.className = 'modal'; const box = document.createElement('div'); box.className = 'mbox ' + (o.cls || '');
    box.innerHTML = (o.title ? '<h3>' + o.title + '</h3>' : '') + '<div class="mbody">' + (o.html || '') + '</div><div class="mbtns"></div>';
    wrap.appendChild(box); $('modals').appendChild(wrap);
    const api = { el: box, close() { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } };
    const bb = box.querySelector('.mbtns');
    (o.btns || []).forEach((b) => {
      const e = document.createElement('button'); e.className = 'btn ' + (b.cls || ''); e.innerHTML = b.t; if (b.id) e.id = b.id;
      e.addEventListener('click', () => { A.tap(); if (b.disabled && b.disabled()) return; const r = b.fn ? b.fn(api, e) : undefined; if (r !== false) api.close(); }); bb.appendChild(e);
    });
    if (!o.btns || !o.btns.length) bb.remove();
    requestAnimationFrame(() => wrap.classList.add('on')); if (o.onOpen) o.onOpen(api);
    return api;
  };
  UI.closeAll = () => { $('modals').innerHTML = ''; };
  UI.modalP = (o) => new Promise((res) => { // o.btns fn results via res(value)
    const btns = (o.btns || []).map((b) => Object.assign({}, b, { fn: (api, e) => { const r = b.fn ? b.fn(api, e) : undefined; if (r !== false) res(b.v); return r; } }));
    UI.modal(Object.assign({}, o, { btns: btns }));
  });

  /* rewarded-ad button helper: returns a modal button spec, or null when ads are unavailable on this host */
  UI.adBtn = function (label, onReward, cls) {
    if (!window.Ads || Ads.provider === 'none') return null;
    return { t: '<span class="adtag">AD</span>' + label, cls: 'ad ' + (cls || ''), fn: (api, e) => {
      if (!Ads.rewardedAvailable()) { UI.toast(T('広告の準備中… あと', 'Ad cooling down… ') + Ads.rewardedCooldownLeft() + T('秒', 's')); return false; }
      e.disabled = true; Ads.rewarded().then((ok) => { e.disabled = false; if (ok) { S.d.stats.ads++; api.close(); onReward(); } else UI.toast(T('広告を再生できませんでした', 'No ad available right now')); }); return false;
    } };
  };
  const compact = (arr) => arr.filter(Boolean);

  /* ---------- top bar ---------- */
  UI.refreshRes = function () {
    [['rGold', S.d.gold, 'rsGold'], ['rMag', S.d.mag, 'rsMag']].forEach((a) => { const e = $(a[0]), v = String(a[1]); if (e.textContent !== v) { const had = e.textContent !== '0' && e.textContent !== ''; e.textContent = v; if (had && UI.screen === 'hub') { const p = $(a[2]); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } } });
  };

  /* ---------- hub ---------- */
  UI.hub = function (tab, keepScroll) {
    if (tab) UI.tab = tab; UI.show('hub'); UI.refreshRes();
    const body = $('hubBody'), sc = keepScroll ? body.scrollTop : 0;
    const bgs = { journey: ['bg_forest', 0.55], party: ['bg_camp', 0.7], camp: ['bg_camp', 0.5] }[UI.tab]; UI.setBg(bgs[0], bgs[1]);
    body.classList.toggle('map', UI.tab === 'journey');
    ({ journey: (b) => (UI.renderMap || renderJourney)(b), party: renderParty, camp: renderCamp })[UI.tab](body);
    body.scrollTop = sc; renderNav();
    A.music(UI.tab === 'camp' || UI.tab === 'party' ? 'camp' : 'map');
  };
  function renderNav() {
    const badge = { journey: 0, party: D.CHAR_ORDER.filter((id) => S.d.chars[id].own && S.pendingBond(id)).length, camp: (S.chestReady() ? 1 : 0) + (S.d.quests ? S.questsDone() : 0) + (S.d.daily.claimed ? 0 : 1) + (S.restPending().mins >= 30 ? 1 : 0) };
    const tabs = [['journey', '旅路', 'Journey', 'torii'], ['party', '仲間', 'Party', 'oni'], ['camp', '野営', 'Camp', 'fire']];
    $('nav').innerHTML = tabs.map((t) => '<button class="nv ' + (UI.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '"><span class="ni"><svg viewBox="0 0 48 48"><use href="#i-' + t[3] + '"/></svg>' + (badge[t[0]] ? '<i class="dot"></i>' : '') + '</span><b>' + T(t[1], t[2]) + '</b></button>').join('');
    $('nav').querySelectorAll('.nv').forEach((b) => b.addEventListener('click', () => { if (b.dataset.t === UI.tab) { UI.haptic(6); return; } A.tap(); UI.hub(b.dataset.t); }));
  }

  /* ----- Journey ----- */
  UI.selCh = 1;
  UI._enemyList = (st) => enemyList(st);
  function enemyList(st) { const m = {}; st.waves.forEach((w) => w.forEach((k) => { m[k] = (m[k] || 0) + 1; })); return Object.keys(m).map((k) => L(D.ENEMIES[k].n) + '×' + m[k]).join(' / '); }
  function renderJourney(body) {
    const ch = D.CHAPTERS[UI.selCh - 1];
    let h = '<div class="chhead"><button class="arr" id="chPrev"' + (UI.selCh <= 1 ? ' disabled' : '') + '>◀</button><div class="cht"><small>' + T('第' + ch.id + '章', 'CHAPTER ' + ch.id) + '</small><h2>' + L(ch.n) + '</h2><p>' + L(ch.d) + '</p></div><button class="arr" id="chNext"' + (UI.selCh >= D.CHAPTERS.length ? ' disabled' : '') + '>▶</button></div>';
    if (ch.open) {
      h += '<div class="stages">';
      const chIds = D.STAGE_ORDER.filter((id) => D.STAGES[id].ch === ch.id), next = chIds.find((id) => !S.d.cleared[id]);
      chIds.forEach((id) => {
        const st = D.STAGES[id], cl = S.d.cleared[id], lk = !S.stageUnlocked(id), cur = id === next;
        const boss = !!st.boss;
        h += '<div class="stage ' + (cl ? 'cl ' : '') + (lk ? 'lk ' : '') + (cur ? 'cur ' : '') + (boss ? 'boss' : '') + '" data-id="' + id + '"><div class="sn">' + id + '</div><div class="si"><b>' + L(st.n) + (boss ? ' <em>BOSS</em>' : '') + '</b><small>' + T('推奨Lv.', 'Rec. Lv.') + st.rec + '　' + esc(enemyList(st)) + '</small></div><div class="sr">' + (lk ? '🔒'.replace('🔒', T('未開放', 'Locked')) : cl ? T('済', 'Clear') : T('出陣', 'Go')) + '</div></div>';
      });
      h += '</div>';
    } else {
      const bossImg = ch.boss;
      h += '<div class="teaser" style="background-image:url(' + ART(ch.bg) + ')"><div class="tz-in"><div class="tz-boss" style="background-image:url(' + ART(bossImg) + ')"></div><div class="tz-t"><b>COMING SOON</b><p>' + T('この先の物語は、夜明け前に。仲間を育て、絆を深めて待とう。', 'The story continues before dawn. Grow your party and deepen your bonds while you wait.') + '</p>' + '<p class="cl">' + T('第' + (ch.id - 1) + '章をクリアすると手がかりが…', 'Clear Chapter ' + (ch.id - 1) + ' to find clues...') + '</p>' + '</div></div></div>';
    }
    body.innerHTML = h;
    $('chPrev').onclick = () => { A.tap(); UI.selCh = Math.max(1, UI.selCh - 1); UI.hub(); };
    $('chNext').onclick = () => { A.tap(); UI.selCh = Math.min(D.CHAPTERS.length, UI.selCh + 1); UI.hub(); };
    body.querySelectorAll('.stage').forEach((e) => e.addEventListener('click', () => { if (e.classList.contains('lk')) { UI.toast(T('前のステージをクリアしよう', 'Clear the previous stage first')); return; } A.tap(); UI.stageModal(e.dataset.id); }));
  }
  UI.stageModal = function (id) {
    const st = D.STAGES[id], first = !S.d.cleared[id];
    const ids = S.d.party.filter((x) => S.d.chars[x].own);
    const fr = []; if (first) { const f = st.first; ['mag', 'rice', 'herb', 'fish'].forEach((k) => { if (f[k]) fr.push(ico(k) + (k === 'mag' ? T('魂玉', 'Soul Gem') : ingName(k)) + '×' + f[k]); }); fr.push(ico(st.drop.split('_')[0]) + T('装備', 'Gear')); }
    const eny = []; st.waves.forEach((w) => w.forEach((k) => { if (!eny.includes(k)) eny.push(k); }));
    const stars = (S.d.stars && S.d.stars[id]) || (S.d.cleared[id] ? 1 : 0), lim = UI.roundLimit(id);
    const goals = '<div class="sgoal"><div>' + UI.starsHtml(1) + T('勝利する', 'Win the battle') + '</div><div>' + UI.starsHtml(2) + T('全員が生き残る', 'Everyone survives') + '</div><div>' + UI.starsHtml(3) + T(lim + 'ラウンド以内にクリア', 'Clear within ' + lim + ' rounds') + '</div></div>';
    const pw = S.partyPower(), meal = S.d.buff && S.d.buff.left > 0 ? D.DISHES[S.d.buff.dish] : null;
    UI.modal({ cls: 'stagebox', title: id + '　' + L(st.n),
      html: '<div style="text-align:center">' + UI.starsHtml(stars) + '</div><div class="enrow">' + eny.map((k) => '<div class="enchip' + (D.ENEMIES[k].boss ? ' boss' : '') + '" style="background-image:url(' + ART(D.ENEMIES[k].img) + ')"><b>' + esc(L(D.ENEMIES[k].n)) + '</b></div>').join('') + '</div>' +
        '<div class="kv"><span>' + T('推奨Lv.', 'Rec. Lv.') + '</span><b>' + st.rec + '</b><span>' + T('戦力', 'Power') + '</span><b>' + pw + '</b></div>' +
        '<div class="kv"><span>' + T('報酬', 'Rewards') + '</span><b>' + ico('gold') + st.gold + ' / EXP ' + st.exp + '</b></div>' +
        (first ? '<div class="kv wide"><span>' + T('初回', 'First clear') + '</span><b>' + fr.join(' ') + '</b></div>' : '') +
        '<div class="pm">' + ids.map((x) => '<div class="pchip" style="background-image:url(' + ART(x) + ')"><i>Lv' + S.d.chars[x].lv + '</i></div>').join('') + '</div>' +
        goals + '<div class="meal">' + (meal ? T('料理効果: ', 'Meal: ') + L(meal.n) + ' (' + S.d.buff.left + T('戦', ' battles') + ')' : T('料理効果なし — 野営で料理を作ろう', 'No meal buff — cook at the camp')) + '</div>',
      btns: [{ t: T('出陣', 'Fight!'), cls: 'pri', fn: () => { UI.startStage(id); } }, { t: T('編成', 'Party'), fn: () => { UI.hub('party'); } }, { t: T('閉じる', 'Close'), cls: 'sub' }] });
  };

  UI.roundLimit = function (id) { const st = D.STAGES[id]; return 3 + 2 * st.waves.length; };
  UI.calcStars = function (res, partySize) { if (!res.win) return 0; let n = 1; if (res.survivors >= partySize) { n = 2; if (res.rounds <= UI.roundLimit(res.id)) n = 3; } return n; };

  /* ----- Party ----- */
  UI.sel = 'mumei';
  const statLine = (s) => '<div class="stats"><span><em>HP</em>' + s.hp + '</span><span><em>ATK</em>' + s.atk + '</span><span><em>DEF</em>' + s.def + '</span><span><em>SPD</em>' + s.spd + '</span><span><em>CRIT</em>' + Math.round(s.crit * 100) + '%</span></div>';
  function renderParty(body) {
    const cid = UI.sel, c = S.d.chars[cid], def = D.CHARS[cid], own = c.own;
    let h = '<div class="roster">' + D.CHAR_ORDER.map((id) => { const cc = S.d.chars[id]; return '<div class="rchip ' + (id === cid ? 'sel ' : '') + (cc.own ? '' : 'lk ') + (S.d.party.includes(id) ? 'inp' : '') + '" data-id="' + id + '" style="background-image:url(' + ART(id) + ')"><i>' + (cc.own ? 'Lv' + cc.lv : cc.shards + '/10') + '</i>' + (S.d.party.includes(id) ? '<u>' + T('編成', 'IN') + '</u>' : '') + (cc.own && S.pendingBond(id) ? '<s></s>' : '') + '</div>'; }).join('') + '</div>';
    h += '<div class="pdetail"><div class="pbig ' + (own ? '' : 'lk') + '" style="background-image:url(' + ART(cid) + ')"><div class="pn"><small>' + L(def.role) + '</small><b>' + L(def.full) + '</b></div></div><div class="pinfo">';
    if (!own) {
      h += '<div class="panel"><h4>' + L(def.n) + '</h4><p class="quote">' + esc(L(def.quote)) + '</p><p>' + T('宝箱や戦闘の報酬で「欠片」を10個集めると仲間になる。', 'Collect 10 shards from chests and stage rewards to recruit.') + '</p><div class="bar"><i style="width:' + c.shards * 10 + '%"></i></div><p>' + c.shards + ' / 10</p></div>';
    } else {
      const s = S.stats(cid), need = D.expNeed(c.lv), cap = D.levelCap(c.star), bl = S.bondLv(cid), bn = D.bondNeed[bl + 1], pend = S.pendingBond(cid);
      h += '<div class="panel"><div class="lvrow"><b>Lv.' + c.lv + (c.lv >= cap ? ' MAX' : '') + '</b><span>' + '★'.repeat(c.star) + '☆'.repeat(D.MAX_STAR - c.star) + '</span><span class="pw">' + T('戦力 ', 'PWR ') + S.power(cid) + '</span></div><div class="bar exp"><i style="width:' + (c.lv >= cap ? 100 : (c.exp / need * 100)) + '%"></i></div>' + statLine(s) + '<p class="quote">' + esc(L(def.quote)) + '</p></div>';
      h += '<div class="panel"><h4>' + T('スキル', 'Skills') + '</h4>' + (cid === 'mumei' ? '<div class="paths">' + ['oni', 'tiger'].map((p) => '<button class="path ' + (c.path === p ? 'on' : '') + '" data-p="' + p + '"><b>' + L(D.PATHS[p].n) + '</b><small>' + L(D.PATHS[p].d) + '</small></button>').join('') + '</div>' : '');
      (cid === 'mumei' ? D.KITS['mumei_' + c.path] : D.KITS[cid]).forEach((k) => { const sk = D.SK[k]; h += '<div class="skrow ' + (sk.ultimate ? 'ult' : '') + '"><b>' + L(sk.n) + '</b><small>' + L(sk.d) + '</small></div>'; });
      h += '</div><div class="panel"><h4>' + T('装備', 'Equipment') + '</h4><div class="eqrow">' + D.SLOTS.map((sl) => { const it = c.eq[sl] && S.itemById(c.eq[sl]); return '<button class="eq ' + (it ? 'r' + it.rar : '') + '" data-s="' + sl + '">' + ico(sl) + '<b>' + (it ? esc(S.itemName(it)) + (it.lv ? ' +' + it.lv : '') : L(D.SLOT_N[sl])) + '</b><small>' + (it ? eqStat(it) : T('なし', 'Empty')) + '</small></button>'; }).join('') + '</div></div>';
      h += '<div class="panel"><h4>' + T('絆', 'Bond') + (cid === 'mumei' ? '' : '  Lv.' + bl) + '</h4>' + (cid === 'mumei' ? '<p>' + T('主人公。仲間との絆が強いほど、パーティーが強くなる。', 'The protagonist. Bonds with companions strengthen the whole party.') + '</p>' : '<div class="hearts">' + [1, 2, 3, 4].map((i) => '<i class="' + (bl >= i ? 'on' : '') + '">♥</i>').join('') + '</div><div class="bar bond"><i style="width:' + (bl >= 4 ? 100 : Math.min(100, (c.bond - D.bondNeed[bl]) / (bn - D.bondNeed[bl]) * 100)) + '%"></i></div><p class="sm">' + T('戦闘・会話・好物の料理で絆が深まる。絆Lv.2/4で絆イベント。ステータス+3%/Lv', 'Fight, talk, and cook favorites to grow bonds. Events at Bond Lv.2 and 4. +3% stats per Lv.') + '</p>' + (pend ? '<button class="btn pri" id="btnBond">♥ ' + T('絆イベントを見る', 'Watch Bond Event') + '</button>' : '')) + '</div>';
      const sn = c.star < D.MAX_STAR ? D.starNeed[c.star] : 0;
      h += '<div class="panel btnrow">' + (c.star < D.MAX_STAR ? '<button class="btn" id="btnStar" ' + (c.shards >= sn ? '' : 'disabled') + '>' + T('覚醒 ', 'Awaken ') + c.shards + '/' + sn + ' ' + T('欠片', 'shards') + '</button>' : '<span class="sm">' + T('覚醒MAX', 'Awakening MAX') + '</span>') +
        (c.lv < cap ? '<button class="btn" id="btnTrain">' + T('修行 ', 'Train ') + ico('gold') + trainCost(c) + '</button>' : '') +
        (S.d.party.includes(cid) ? (S.d.party.length > 1 ? '<button class="btn sub" id="btnPty">' + T('編成から外す', 'Remove from party') + '</button>' : '') : '<button class="btn pri" id="btnPty">' + T('編成に加える', 'Add to party') + '</button>') + '</div>';
    }
    h += '</div></div>'; body.innerHTML = h;
    body.querySelectorAll('.rchip').forEach((e) => e.addEventListener('click', () => { A.tap(); UI.sel = e.dataset.id; UI.hub(null, false); }));
    body.querySelectorAll('.path').forEach((e) => e.addEventListener('click', () => { A.ok(); S.d.chars.mumei.path = e.dataset.p; S.save(); UI.hub(null, true); }));
    body.querySelectorAll('.eq').forEach((e) => e.addEventListener('click', () => { A.tap(); UI.equipModal(cid, e.dataset.s); }));
    const g = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    g('btnBond', () => { const lv = S.pendingBond(cid); A.ok(); UI.playStory('b_' + cid + '_' + lv, function () { c.seenBond[lv] = true; const out = S.grant({ mag: 12, rice: 2, herb: 1 }); S.save(); UI.modal({ title: T('絆イベント完了', 'Bond event complete'), html: UI.rewardHtml(out), btns: [{ t: 'OK', cls: 'pri', fn: () => { UI.hub(null, true); } }] }); }); });
    g('btnStar', () => { if (S.starUp(cid)) { A.rare(); UI.toast(L(D.CHARS[cid].n) + T(' が覚醒した!', ' awakened!')); UI.hub(null, true); } });
    g('btnTrain', () => { const cost = trainCost(c); if (S.d.gold < cost) { UI.toast(T('小判が足りない', 'Not enough gold')); return; } S.d.gold -= cost; const up = S.addExp(cid, 40 + c.lv * 10); S.save(); A.levelup(); UI.toast(up ? 'Level up! Lv.' + c.lv : '+EXP'); UI.hub(null, true); });
    g('btnPty', () => { if (S.d.party.includes(cid)) S.d.party = S.d.party.filter((x) => x !== cid); else { if (S.d.party.length >= 4) { UI.toast(T('編成は4人まで。誰かを外そう', 'Party is full (4). Remove someone first.')); return; } S.d.party.push(cid); } S.save(); A.ok(); UI.hub(null, true); });
  }
  const trainCost = (c) => 60 + c.lv * 45;
  const eqStat = (it) => { const s = D.statOfItem(it), p = []; if (s.atk) p.push('ATK+' + s.atk); if (s.hp) p.push('HP+' + s.hp); if (s.def) p.push('DEF+' + s.def); if (s.crit) p.push(T('会心+', 'Crit+') + Math.round(s.crit * 100) + '%'); if (s.spd) p.push('SPD+' + s.spd); return p.join(' '); };
  UI.equipModal = function (cid, slot) {
    const c = S.d.chars[cid], items = S.d.items.filter((i) => i.slot === slot).sort((a, b) => b.rar - a.rar || b.lv - a.lv);
    const html = '<div class="eqlist">' + (items.length ? items.map((it) => { const ow = S.itemOwner(it.uid); return '<div class="eqi r' + it.rar + '" data-u="' + it.uid + '">' + ico(slot) + '<div class="eqt"><b>' + esc(S.itemName(it)) + (it.lv ? ' +' + it.lv : '') + ' <em>' + D.RARITY[it.rar].n[I18N.lang === 'ja' ? 0 : 1] + '</em></b><small>' + eqStat(it) + (ow && ow !== cid ? ' · ' + L(D.CHARS[ow].n) : ow === cid ? ' · ' + T('装備中', 'Equipped') : '') + '</small></div><div class="eqb"><button class="btn sm" data-a="eq">' + (c.eq[slot] === it.uid ? T('外す', 'Off') : T('装備', 'Equip')) + '</button>' + (it.lv < 5 ? '<button class="btn sm" data-a="up">' + T('強化 ', 'Up ') + S.upCost(it) + '</button>' : '<span class="sm">MAX</span>') + '</div></div>'; }).join('') : '<p>' + T('この種類の装備はまだ無い。戦闘や宝箱で手に入る。', 'No gear of this type yet. Find it in battles and chests.') + '</p>') + '</div>';
    const m = UI.modal({ cls: 'eqbox', title: L(D.SLOT_N[slot]), html: html, btns: [{ t: T('閉じる', 'Close'), cls: 'sub', fn: () => { UI.hub(null, true); } }] });
    m.el.querySelectorAll('.eqi button').forEach((b) => b.addEventListener('click', () => {
      const uid = +b.closest('.eqi').dataset.u; A.tap();
      if (b.dataset.a === 'eq') { if (c.eq[slot] === uid) S.unequip(cid, slot); else S.equip(cid, uid); A.ok(); m.close(); UI.equipModal(cid, slot); }
      else { if (S.upgrade(uid)) { A.levelup(); UI.refreshRes(); m.close(); UI.equipModal(cid, slot); } else UI.toast(T('小判が足りない', 'Not enough gold')); }
    }));
  };

  /* ----- Camp ----- */
  const fmtT = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); };
  function renderCamp(body) {
    const rp = S.restPending(), chestReady = S.chestReady(), meal = S.d.buff && S.d.buff.left > 0 ? D.DISHES[S.d.buff.dish] : null;
    let h = '<div class="campgrid">';
    h += '<div class="panel camp rest"><h4>' + T('焚き火', 'Campfire') + '</h4><p class="sm">' + T('休んでいる間も、仲間は力を蓄える(最大8時間)', 'Your party rests and gathers strength while you are away (up to 8h).') + '</p><div class="restrow">' + ico('gold') + rp.gold + ' <span class="exp">EXP ' + rp.exp + '</span> ' + (rp.rice ? ico('rice') + rp.rice : '') + (rp.herb ? ico('herb') + rp.herb : '') + (rp.fish ? ico('fish') + rp.fish : '') + '</div><div class="bar"><i style="width:' + (rp.mins / S.REST_CAP_MIN * 100) + '%"></i></div><small>' + rp.mins + T('分 / 480分', ' / 480 min') + (rp.full ? T('（満タン!）', ' (FULL!)') : '') + '</small><div class="btnrow"><button class="btn pri" id="btnRest" ' + (rp.mins < 1 ? 'disabled' : '') + '>' + T('受け取る', 'Collect') + '</button></div></div>';
    h += '<div class="panel camp chest"><h4>' + T('宝箱', 'Spirit Chest') + '</h4><div class="chestg ' + (chestReady ? 'rdy' : '') + '" style="--cimg:url(ui/chest_gold.webp);--gl:rgba(255,206,60,.75)"><div class="cimg"></div></div><p class="sm" id="chestT">' + (chestReady ? T('開けられる!', 'Ready to open!') : T('次の宝箱まで ', 'Next chest in ') + fmtT(S.d.chestAt - Date.now())) + '</p><div class="btnrow"><button class="btn pri" id="btnChest" ' + (chestReady ? '' : 'disabled') + '>' + T('開ける', 'Open') + '</button>' + (chestReady ? '' : '<button class="btn" id="btnChestGem">' + ico('mag') + '8 ' + T('今すぐ', 'Now') + '</button>') + '</div></div>';
    h += '<div class="panel camp cook"><h4>' + T('料理', 'Cooking') + '</h4><div class="ings">' + ['rice', 'herb', 'fish'].map((k) => ico(k) + '<b>' + S.d.ing[k] + '</b>').join(' ') + '</div>' + (meal ? '<div class="mealnow">' + T('効果中: ', 'Active: ') + '<b>' + L(meal.n) + '</b> — ' + L(meal.d) + ' [' + S.d.buff.left + ']</div>' : '<p class="sm">' + T('料理で戦いを有利に。好物を振る舞うと絆も深まる', 'Meals boost your fights. Serving favorites deepens bonds.') + '</p>') + '<div class="dishes">' + Object.keys(D.DISHES).map((k) => { const d = D.DISHES[k]; return '<div class="dish ' + (S.canCook(k) ? '' : 'no') + '" data-k="' + k + '"><b>' + L(d.n) + '</b><small>' + L(d.d) + '</small><div class="needs">' + needHtml(d.need) + '</div><div class="favs">' + d.fav.filter((f) => S.d.chars[f].own).map((f) => '<i style="background-image:url(' + ART(f) + ')"></i>').join('') + '</div></div>'; }).join('') + '</div></div>';
    const talked = S.d.talked && S.d.talked.day === S.dayKey() ? S.d.talked.ids : [];
    h += '<div class="panel camp talk"><h4>' + T('語らい', 'Campfire Talk') + '</h4><p class="sm">' + T('1日1回、仲間と話して絆を深めよう (+4)', 'Talk to each companion once a day to grow your bond (+4).') + '</p><div class="talkrow">' + D.CHAR_ORDER.filter((id) => S.d.chars[id].own).map((id) => '<div class="tk ' + (talked.includes(id) ? 'done' : '') + '" data-id="' + id + '" style="background-image:url(' + ART(id) + ')"><i>' + (talked.includes(id) ? '✓' : '♥') + '</i></div>').join('') + '</div></div>';
    h += '<div class="panel camp daily"><h4>' + T('日課', 'Daily') + '</h4><button class="btn ' + (S.d.daily.claimed ? '' : 'pri') + '" id="btnLogin">' + T('ログインボーナス', 'Login Calendar') + (S.d.daily.claimed ? ' ✓' : ' !') + '</button><small class="sm">' + T('連続ログイン ', 'Streak: ') + S.d.daily.streak + T('日', ' days') + '</small>' +
      D.QUESTS.map((q) => { const st = S.d.quests[q.id]; return '<div class="quest ' + (st.claimed ? 'done' : st.n >= q.goal ? 'rdy' : '') + '" data-id="' + q.id + '"><span>' + L(q.n) + '</span><em>' + st.n + '/' + q.goal + '</em><b>' + (st.claimed ? '✓' : st.n >= q.goal ? T('受取', 'Claim') : '') + '</b></div>'; }).join('') + '</div>';
    h += '</div>'; body.innerHTML = h;
    const g = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    g('btnRest', () => UI.restModal(false));
    g('btnChest', () => UI.openChest());
    g('btnChestGem', () => { if (S.d.mag < 8) { UI.toast(T('魂玉が足りない', 'Not enough Soul Gems')); return; } S.d.mag -= 8; S.d.chestAt = Date.now(); UI.openChest(); });
    g('btnLogin', () => UI.loginModal());
    body.querySelectorAll('.dish').forEach((e) => e.addEventListener('click', () => UI.cookModal(e.dataset.k)));
    body.querySelectorAll('.tk').forEach((e) => e.addEventListener('click', () => UI.talk(e.dataset.id)));
    body.querySelectorAll('.quest.rdy').forEach((e) => e.addEventListener('click', () => { const out = S.questClaim(e.dataset.id); if (out) { S.save && S.save(); UI.refreshRes(); A.ok(); UI.chestSequence({ out: out, title: T('日課達成', 'Quest complete'), onDone: () => UI.hub(null, true) }); } }));
    clearInterval(UI._chestIv);
    if (!chestReady) UI._chestIv = setInterval(() => { if (UI.tab !== 'camp' || UI.screen !== 'hub') { clearInterval(UI._chestIv); return; } if (S.chestReady()) { clearInterval(UI._chestIv); UI.hub(null, true); return; } const e = $('chestT'); if (e) e.textContent = T('次の宝箱まで ', 'Next chest in ') + fmtT(S.d.chestAt - Date.now()); }, 1000);
  }
  UI.restModal = function (welcome) {
    const p = S.restPending();
    const claim = (mult) => () => { const r = S.restClaim(mult); A.chest(); UI.refreshRes(); const lv = Object.keys(r.levels).map((id) => L(D.CHARS[id].n) + ' Lv↑').join(', ');
      UI.modal({ title: T('受け取り完了' + (mult > 1 ? ' ×2' : ''), 'Collected' + (mult > 1 ? ' ×2' : '')), html: UI.rewardHtml(compact([{ k: 'gold', n: p.gold * mult }, p.rice && { k: 'rice', n: p.rice * mult }, p.herb && { k: 'herb', n: p.herb * mult }, p.fish && { k: 'fish', n: p.fish * mult }])) + '<p>EXP +' + p.exp * mult + (lv ? '<br>' + lv : '') + '</p>', btns: [{ t: 'OK', cls: 'pri', fn: () => { if (UI.tab) UI.hub(null, true); UI.afterWelcome && UI.afterWelcome(); } }] }); };
    UI.modal({ cls: 'welcome', title: welcome ? T('おかえりなさい', 'Welcome back') : T('焚き火の恵み', 'Campfire rewards'),
      html: '<p>' + T('仲間たちは ', 'Your party rested for ') + p.mins + T('分 休んでいた。', ' minutes.') + '</p>' + UI.rewardHtml(compact([{ k: 'gold', n: p.gold }, p.rice && { k: 'rice', n: p.rice }, p.herb && { k: 'herb', n: p.herb }, p.fish && { k: 'fish', n: p.fish }])) + '<p>EXP +' + p.exp + T('(全員)', ' (each)') + '</p>',
      btns: compact([{ t: T('受け取る', 'Collect'), cls: 'pri', fn: (api) => { api.close(); claim(1)(); return false; } }, UI.adBtn(T('×2で受け取る', 'Collect ×2'), claim(2))]) });
  };
  UI.openChest = function () {
    if (!S.chestReady()) return; S.d.chestAt = Date.now() + S.CHEST_MS; S.d.stats.chests++; S.quest('chest');
    const run = (rew, again) => {
      const out = S.grant(rew); S.save(); UI.refreshRes();
      UI.chestSequence({ out: out, title: T('宝箱', 'Spirit Chest'), onDone: () => UI.afterRewardFlow(),
        extra: again ? [] : [UI.adBtn(T('もう1つ開ける', 'Open another'), () => run(S.rollChest(true), true))] });
    };
    run(S.rollChest(false), false);
  };
  UI.afterRewardFlow = function () { UI.hub(null, true); if (S.d.newRecruits && S.d.newRecruits.length) UI.recruitModals(); };
  UI.recruitModals = function () {
    const list = S.d.newRecruits || []; S.d.newRecruits = []; S.save();
    list.forEach((id) => { const def = D.CHARS[id]; UI.modal({ cls: 'recruit', title: T('仲間が加わった!', 'A companion joins!'), html: '<div class="rbig" style="background-image:url(' + ART(id) + ')"></div><b class="rn">' + esc(L(def.full)) + '</b><p class="quote">' + esc(L(def.quote)) + '</p>', btns: [{ t: 'OK', cls: 'pri', fn: () => { if (S.d.party.length < 4 && !S.d.party.includes(id)) { S.d.party.push(id); S.save(); } if (UI.screen === 'hub') UI.hub(null, true); } }], onOpen: () => A.rare() }); });
  };
  UI.cookModal = function (k) {
    const d = D.DISHES[k]; if (!S.canCook(k)) { UI.toast(T('材料が足りない。野営や戦闘で集めよう', 'Missing ingredients. Collect more from rest and battles.')); return; }
    const favs = d.fav.filter((f) => S.d.chars[f].own);
    UI.modal({ title: L(d.n), html: '<p>' + L(d.d) + '</p><div class="needs">' + needHtml(d.need) + '</div><p class="sm">' + T('好物の仲間: ', 'Favorites: ') + (favs.map((f) => L(D.CHARS[f].n)).join(', ') || '—') + T(' (絆+6)', ' (+6 bond)') + '</p>', btns: compact([
      { t: T('作る', 'Cook'), cls: 'pri', fn: () => { S.cook(k); favs.forEach((f) => S.addBond(f, 6)); S.save(); A.chest(); UI.hub(null, true); UI.toast(L(d.n) + T(' を作った!', ' is ready!')); } },
      { t: T('やめる', 'Cancel'), cls: 'sub' }]) });
  };
  UI.talk = function (id) {
    const today = S.dayKey(); if (!S.d.talked || S.d.talked.day !== today) S.d.talked = { day: today, ids: [] };
    const lines = window.STORY.TALK[id], ln = lines[Math.floor(Math.random() * lines.length)], first = !S.d.talked.ids.includes(id), def = D.CHARS[id];
    if (first) { S.d.talked.ids.push(id); S.addBond(id, 4); S.quest('talk'); S.save(); A.ok(); }
    UI.modal({ cls: 'talkbox', title: L(def.n), html: '<div class="rbig sm" style="background-image:url(' + ART(id) + ')"></div><p class="quote big">「' + esc(L(ln)) + '」</p>' + (first ? '<p class="sm bondup">♥ ' + T('絆 +4', 'Bond +4') + '</p>' : '<p class="sm">' + T('今日はもう話した', 'Already talked today') + '</p>'), btns: [{ t: 'OK', cls: 'pri', fn: () => UI.hub(null, true) }] });
  };
  UI.loginModal = function (auto) {
    const dly = S.d.daily, cur = dly.day % 7;
    const cells = D.LOGIN.map((r, i) => '<div class="lg ' + (i < cur || (i === cur && dly.claimed) ? 'got' : '') + (i === cur ? ' today' : '') + '"><small>' + T('Day ', 'Day ') + (i + 1) + '</small>' + Object.keys(r).map((k) => (k === 'item' ? ico(r[k].split('_')[0]) + '<em>' + r[k].split('_')[1].toUpperCase() + '</em>' : ico(k) + '<em>' + r[k] + '</em>')).join('') + '</div>').join('');
    const claim = (mult) => () => { const day = S.d.daily.day % 7, out = S.loginClaim(mult); if (!out) return; UI.refreshRes(); UI.chestSequence({ out: out, tier: day === 6 ? 'legend' : day === 2 || day === 5 ? 'gold' : undefined, title: T('ログインボーナス', 'Daily Login') + (mult > 1 ? ' ×2' : ''), onDone: () => { if (UI.screen === 'hub') UI.hub(null, true); UI.afterWelcome && UI.afterWelcome(); } }); };
    UI.modal({ cls: 'login', title: T('ログインボーナス', 'Daily Login') + '  ·  ' + T(dly.streak + '日連続', dly.streak + '-day streak'), html: '<div class="lgrid">' + cells + '</div>',
      btns: dly.claimed ? [{ t: T('閉じる', 'Close'), cls: 'sub', fn: () => { UI.afterWelcome && UI.afterWelcome(); } }] : compact([{ t: T('受け取る', 'Claim'), cls: 'pri', fn: (api) => { api.close(); claim(1)(); return false; } }, UI.adBtn(T('×2で受け取る', 'Claim ×2'), claim(2))]) });
  };

  /* ---------- settings ---------- */
  UI.settings = function () {
    const set = S.d.set; const row = (id, label, on) => '<div class="srow"><span>' + label + '</span><button class="tg ' + (on ? 'on' : '') + '" id="' + id + '">' + (on ? 'ON' : 'OFF') + '</button></div>';
    const m = UI.modal({ title: T('設定', 'Settings'), html: row('sSnd', T('効果音', 'Sound FX'), set.sound) + row('sMus', T('音楽', 'Music'), set.music) + row('sHap', T('振動', 'Haptics'), set.haptic !== false) +
      '<div class="srow"><span>' + T('言語', 'Language') + '</span><span><button class="tg ' + (I18N.lang === 'ja' ? 'on' : '') + '" id="sJa">日本語</button> <button class="tg ' + (I18N.lang === 'en' ? 'on' : '') + '" id="sEn">English</button></span></div>' +
      '<div class="srow"><span>' + T('セーブデータ', 'Save data') + '</span><button class="btn sm sub" id="sReset">' + T('削除', 'Delete') + '</button></div><div class="srow"><span>' + T('バックアップ', 'Backup') + '</span><button class="btn sm sub" id="sIO">' + T('書き出し / 読み込み', 'Export / Import') + '</button></div>' + (UI.isStandalone() ? '' : '<p class="sm a2hs" id="sA2">' + T('📱 iPhone: Safariの共有ボタン →「ホーム画面に追加」で起動すると、保存データがSafariに消されにくくなります。念のため、ときどき「書き出し」でバックアップしてください。', '📱 iPhone: tap Safari\'s Share button → "Add to Home Screen" so Safari is less likely to evict your save. Export a backup now and then to be safe.') + '</p>') + '<p class="sm">' + T('進行はこのブラウザに自動保存されます。', 'Progress is saved automatically in this browser.') + '</p><p class="sm ver">HYAKKI NO YORU v1.0</p>', btns: [{ t: T('閉じる', 'Close'), cls: 'pri' }] });
    const q = (id) => m.el.querySelector('#' + id);
    q('sSnd').onclick = () => { set.sound = !set.sound; A.setMuted(!set.sound); S.save(); m.close(); UI.settings(); };
    q('sMus').onclick = () => { set.music = !set.music; A.setMusicOn(set.music); S.save(); m.close(); UI.settings(); };
    q('sHap').onclick = () => { set.haptic = set.haptic === false; S.save(); if (set.haptic) UI.haptic(30); m.close(); UI.settings(); };
    q('sJa').onclick = () => { UI.setLang('ja'); m.close(); UI.settings(); }; q('sEn').onclick = () => { UI.setLang('en'); m.close(); UI.settings(); };
    q('sIO').onclick = () => { m.close(); UI.saveIO(); };
    q('sReset').onclick = () => { UI.modal({ title: T('本当に削除する?', 'Delete everything?'), html: '<p>' + T('全てのデータが消えます。', 'All progress will be erased.') + '</p>', btns: [{ t: T('削除する', 'Delete'), cls: 'pri', fn: () => { S.reset(); location.reload(); } }, { t: T('やめる', 'Cancel'), cls: 'sub' }] }); };
  };
  /* ---------- save backup: export / import, boot warnings, multi-tab lock ---------- */
  UI.isStandalone = function () { try { return !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); } catch (e) { return false; } };
  UI.saveIO = function () {
    const ta = (id, ro, ph) => '<textarea class="iota" id="' + id + '" ' + (ro ? 'readonly ' : '') + 'rows="4" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="' + (ph || '') + '"></textarea>';
    const m = UI.modal({ cls: 'saveio', title: T('バックアップ', 'Backup'), html:
      '<p class="sm">' + T('① 書き出し: コピーするかファイルに保存して、メモ等に残しておきます。', '1) Export: copy it or save it as a file and keep it somewhere safe.') + '</p>' + ta('ioOut', true) +
      '<div class="iobtns"><button class="btn sm pri" id="ioCopy">' + T('コピー', 'Copy') + '</button><button class="btn sm sub" id="ioDl">' + T('ファイル保存', 'Save file') + '</button>' + (S.hasBad() ? '<button class="btn sm sub" id="ioBad">' + T('壊れたデータ', 'Damaged data') + '</button>' : '') + '</div>' +
      '<p class="sm">' + T('② 読み込み: 貼り付けるか、ファイルを選びます。今のデータは「読み込み」前に退避されます。', '2) Import: paste it or pick a file. Your current data is set aside before it is replaced.') + '</p>' + ta('ioIn', false, T('ここに貼り付け', 'Paste here')) +
      '<div class="iobtns"><input type="file" id="ioFile" accept=".json,application/json,text/plain"><button class="btn sm pri" id="ioGo">' + T('読み込む', 'Import') + '</button></div><p class="sm" id="ioMsg"></p>',
      btns: [{ t: T('閉じる', 'Close'), cls: 'sub' }] });
    const q = (id) => m.el.querySelector('#' + id), msg = (t) => { q('ioMsg').textContent = t; };
    const out = q('ioOut'); out.value = S.locked ? '' : S.exportJSON(); if (S.locked) msg(T('このセッションは保存されていません(書き出し不可)。', 'This session is not being saved (nothing to export).'));
    out.onfocus = () => { try { out.select(); } catch (e) {} };
    q('ioCopy').onclick = () => { out.value = S.exportJSON(); out.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} try { if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(() => msg(T('コピーしました', 'Copied')), () => {}); } catch (e) {} msg(ok ? T('コピーしました', 'Copied') : T('選択しました。長押しでコピーしてください', 'Selected. Long-press to copy')); };
    q('ioDl').onclick = () => { try { const b = new Blob([S.exportJSON()], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'hyakki-save-' + S.dayKey().replace(/-/g, '') + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 4000); msg(T('保存しました', 'Saved')); } catch (e) { msg(T('保存できません。コピーを使ってください', 'Could not save a file. Use Copy')); } };
    if (q('ioBad')) q('ioBad').onclick = () => { out.value = S.badRaw(); out.select(); msg(T('壊れたデータを表示しました(コピーして保管できます)', 'Showing the damaged data (copy it to keep it)')); };
    q('ioFile').onchange = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { q('ioIn').value = String(r.result || ''); msg(T('ファイルを読み込みました。「読み込む」を押してください', 'File loaded. Press Import')); }; r.onerror = () => msg(T('ファイルを読めません', 'Could not read the file')); r.readAsText(f); };
    q('ioGo').onclick = () => {
      const txt = q('ioIn').value; const chk = S.parse(String(txt || '').trim()); const E = { empty: T('空です', 'Empty'), parse: T('JSONとして読めません', 'Not valid JSON'), shape: T('セーブデータの形式が違います', 'Not a valid save'), newer: T('新しいバージョンのデータです。ゲームを更新してください', 'Save is from a newer version; update the game') };
      if (!chk.d) { msg(E[chk.err] || E.shape); return; }
      UI.modal({ title: T('読み込む?', 'Import this save?'), html: '<p>' + T('今のデータは置き換えられます(退避は残ります)。', 'Your current data will be replaced (a copy is kept aside).') + '</p>', btns: [{ t: T('読み込む', 'Import'), cls: 'pri', fn: () => { const r = S.importJSON(txt); if (r.ok) { location.reload(); return; } msg(r.err === 'write' ? T('保存領域に書き込めません', 'Storage is full or unavailable') : (E[r.err] || E.shape)); } }, { t: T('やめる', 'Cancel'), cls: 'sub' }] });
    };
  };
  /* shown once after the title appears when the loader had to do something other than a plain load */
  UI.saveNotice = function () {
    if (S.status === 'newer') {
      UI.modal({ cls: 'savewarn', title: T('保存を停止しています', 'Saving is paused'), html: '<p>' + T('このセーブデータは、より新しいバージョンのゲームで作られています(v' + S.foundVer + ')。データを守るため、このセッションでは上書き保存しません。ページを更新して最新版を読み込んでください。', 'This save was made by a newer version of the game (v' + S.foundVer + '). To protect it, nothing will be saved in this session. Reload to get the latest version.') + '</p>', btns: [{ t: T('再読み込み', 'Reload'), cls: 'pri', fn: () => { location.reload(); return false; } }, { t: T('このまま遊ぶ(保存なし)', 'Play without saving'), cls: 'sub' }] });
    } else if (S.status === 'lost') {
      UI.modal({ cls: 'savewarn', title: T('セーブデータを読めませんでした', 'Save could not be read'), html: '<p>' + T('保存データが壊れていました。壊れたデータは消さずに退避してあります(設定 → バックアップ →「壊れたデータ」)。新しいデータで始まります。', 'Your save data was damaged. It has been kept aside and not deleted (Settings → Backup → "Damaged data"). A new game will start.') + '</p>', btns: [{ t: 'OK', cls: 'pri' }] });
    } else if (S.status === 'recovered') {
      UI.toast(T('保存データが壊れていたため、バックアップから復元しました', 'Save was damaged; restored from the automatic backup'));
    } else if (S.migratedFrom != null && S.migratedFrom < S.VER) {
      UI.toast(T('セーブデータを新形式に更新しました', 'Save data upgraded to the new format'));
    }
  };
  UI.lockNotice = function () {
    UI.modal({ cls: 'savewarn', title: T('別のタブで更新されました', 'Updated in another tab'), html: '<p>' + T('このゲームは別のタブ/ウィンドウでも開かれ、セーブが更新されました。古いデータで上書きしないよう、このタブの保存を停止しました。再読み込みしてください。', 'The game is open in another tab or window and its save changed. Saving is paused here so older data cannot overwrite it. Please reload.') + '</p>', btns: [{ t: T('再読み込み', 'Reload'), cls: 'pri', fn: () => { location.reload(); return false; } }] });
  };
  UI.setLang = function (l) { I18N.set(l); S.d.set.lang = l; S.save(); if (UI.screen === 'hub') UI.hub(null, true); else if (UI.screen === 'title') UI.title(); };

  /* ---------- title ---------- */
  UI.title = function () {
    UI.show('title'); UI.setBg('bg_title', 0.2); A.music('title');
    const has = !S.isNew(); $('tSub').textContent = T('— 夜は、まだ明けない —', '— The night is not yet over —');
    $('titleBtns').innerHTML = (has ? '<button class="btn big pri" id="tCont">' + T('つづきから', 'Continue') + '</button><button class="btn big sub" id="tNew">' + T('はじめから', 'New Game') + '</button>' : '<button class="btn big pri" id="tCont">' + T('はじめる', 'Begin') + '</button>');
    $('titleFoot').innerHTML = '<button class="lang ' + (I18N.lang === 'ja' ? 'on' : '') + '" id="tJa">日本語</button><button class="lang ' + (I18N.lang === 'en' ? 'on' : '') + '" id="tEn">English</button><span>' + T('音が出ます', 'Sound on') + ' ♪</span>';
    $('tCont').onclick = () => { A.unlock(); A.ok(); UI.begin(has); };
    if ($('tNew')) $('tNew').onclick = () => { A.unlock(); UI.modal({ title: T('はじめから?', 'Start over?'), html: '<p>' + T('今のデータは消えます。', 'Your current save will be erased.') + '</p>', btns: [{ t: T('はじめから', 'Start over'), cls: 'pri', fn: () => { S.reset(); I18N.set(I18N.lang); S.d.set.lang = I18N.lang; S.save(); UI.begin(false); } }, { t: T('やめる', 'Cancel'), cls: 'sub' }] }); };
    $('tJa').onclick = () => UI.setLang('ja'); $('tEn').onclick = () => UI.setLang('en');
    /* buttons fade in over ~2.8 s: ignore taps until they are fully visible */
    ['titleBtns', 'titleFoot'].forEach((id) => { const e = $(id); clearTimeout(e._pe); const an = getComputedStyle(e).animationName; if (an && an !== 'none') { e.style.pointerEvents = 'none'; e._pe = setTimeout(() => { e.style.pointerEvents = ''; }, 2900); } else e.style.pointerEvents = ''; });
    const em = $('embers'); if (!em.children.length) for (let i = 0; i < 26; i++) { const d = document.createElement('i'); d.style.left = (Math.random() * 100) + '%'; d.style.animationDelay = (-Math.random() * 12) + 's'; d.style.animationDuration = (7 + Math.random() * 8) + 's'; d.style.setProperty('--sz', (2 + Math.random() * 5) + 'px'); em.appendChild(d); }
  };
  UI.defeatModal = function (canRevive) {
    return UI.modalP({ cls: 'defeat', title: T('全滅…', 'Defeated…'), html: '<p>' + T('このままでは勝てない。装備を強化したり、料理を作ったり、修行してみよう。', 'Too strong for now. Try upgrading gear, cooking a meal, or training your party.') + '</p>',
      btns: compact([canRevive && (function () { const ab = UI.adBtn(T('復活する', 'Revive'), () => {}); return ab ? { t: ab.t, cls: ab.cls, v: 'revive', fn: (api, e) => { if (!Ads.rewardedAvailable()) { UI.toast(T('広告の準備中…', 'Ad cooling down…')); return false; } e.disabled = true; Ads.rewarded().then((ok) => { e.disabled = false; if (ok) { S.d.stats.ads++; api.close(); UI._defRes('revive'); } else UI.toast(T('広告を再生できませんでした', 'No ad available right now')); }); return false; } } : null; })(),
        canRevive && S.d.mag >= 5 && { t: ico('mag') + '5 ' + T('で復活', 'Revive'), cls: 'pri', v: 'revive', fn: () => { S.d.mag -= 5; S.save(); } }, { t: T('撤退', 'Retreat'), cls: 'sub', v: 'giveup' }]) });
  };
  // ad revive resolves the promise created in modalP: patch to route through a holder
  const _mp = UI.modalP; UI.modalP = (o) => new Promise((res) => { UI._defRes = res; _mp(o).then(res); });

  /* iOS Safari: innerWidth/innerHeight lag behind rotation and toolbar collapse. Recompute on every signal, coalesced to one per frame, plus delayed passes after rotation.
     (innerHeight is used on purpose: unlike visualViewport.height it does not shrink when the on-screen keyboard opens for the import box.) */
  let rzq = 0; const rz = () => { if (rzq) return; rzq = requestAnimationFrame(() => { rzq = 0; UI.resize(); }); };
  window.addEventListener('resize', rz);
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', rz); }
  const rot = () => { rz(); setTimeout(() => UI.resize(), 120); setTimeout(() => UI.resize(), 450); };
  window.addEventListener('orientationchange', rot); window.addEventListener('pageshow', rz);
  if (window.screen && screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', rot);
})();
