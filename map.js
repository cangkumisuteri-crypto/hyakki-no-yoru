/* map.js - painted-scroll world map for the journey tab. */
(function () {
  const D = window.DATA, S = window.State, A = window.GameAudio, UI = window.UI;
  const $ = (id) => document.getElementById(id);
  const T = (ja, en) => (I18N.lang === 'ja' ? ja : en);
  const POS = {
    land: { '1-1': [0.14, 0.78], '1-2': [0.3, 0.5], '1-3': [0.5, 0.68], '1-4': [0.57, 0.37], '1-5': [0.73, 0.15] },
    port: { '1-1': [0.3, 0.89], '1-2': [0.6, 0.72], '1-3': [0.4, 0.56], '1-4': [0.52, 0.44], '1-5': [0.55, 0.2] }
  };
  const SIZE = { land: [1472, 828], port: [936, 1664] };

  function curve(pts) { // Catmull-Rom -> cubic bezier segments
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, k = 6;
      const c1 = [p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k], c2 = [p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k];
      segs.push('M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'C' + c1.map((v) => v.toFixed(1)).join(' ') + ' ' + c2.map((v) => v.toFixed(1)).join(' ') + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1));
    }
    return segs;
  }

  UI.renderMap = function (body) {
    const port = $('app').classList.contains('port'), ori = port ? 'port' : 'land', [W, H] = SIZE[ori];
    UI._mapOri = ori;
    const ch = D.CHAPTERS[UI.selCh - 1], E = UI.esc;
    S.d.flags = S.d.flags || {}; S.d.stars = S.d.stars || {};
    const banner = '<div class="wm-ban"><button class="arr" id="chPrev"' + (UI.selCh <= 1 ? ' disabled' : '') + '>◀</button><div class="cht"><small>' + T('第' + ch.id + '章', 'CHAPTER ' + ch.id) + '</small><h2>' + L(ch.n) + '</h2><p>' + L(ch.d) + '</p></div><button class="arr" id="chNext"' + (UI.selCh >= D.CHAPTERS.length ? ' disabled' : '') + '>▶</button></div>';
    const wisps = '<i class="wm-w w1"></i><i class="wm-w w2"></i><i class="wm-w w3"></i>';
    let h = '<div class="wm' + (ch.open ? '' : ' tz') + '">', cur = null, focus = null;
    if (ch.open) {
      const next = D.STAGE_ORDER.find((id) => !S.d.cleared[id]);
      const pts = D.STAGE_ORDER.map((id) => [POS[ori][id][0] * W, POS[ori][id][1] * H]);
      const segs = curve(pts); let svg = '';
      const seen = S.d.flags.mapSeg = S.d.flags.mapSeg || {}; let newSeg = false;
      segs.forEach((d, i) => {
        const on = !!S.d.cleared[D.STAGE_ORDER[i]], isNew = on && !seen[i];
        if (isNew) { seen[i] = 1; newSeg = true; }
        svg += '<path class="seg-b" d="' + d + '" pathLength="1"/>' + (on ? '<path class="seg-g' + (isNew ? ' draw' : '') + '" d="' + d + '" pathLength="1"/><path class="seg-f' + (isNew ? ' draw' : '') + '" d="' + d + '" pathLength="1"/>' : '');
      });
      if (newSeg) S.save();
      let nodes = '';
      D.STAGE_ORDER.forEach((id) => {
        const st = D.STAGES[id], cl = S.d.cleared[id], lk = !S.stageUnlocked(id), isCur = id === next, boss = !!st.boss;
        if (isCur) { cur = POS[ori][id]; const oi = D.STAGE_ORDER.indexOf(id), nx = D.STAGE_ORDER[Math.min(oi + 2, D.STAGE_ORDER.length - 1)]; focus = [(cur[0] + POS[ori][nx][0]) / 2, (cur[1] + POS[ori][nx][1]) / 2]; }
        const stars = cl ? (S.d.stars[id] || 1) : 0;
        nodes += '<div class="stage ' + (cl ? 'cl ' : '') + (lk ? 'lk ' : '') + (isCur ? 'cur ' : '') + (boss ? 'boss' : '') + '" data-id="' + id + '" style="left:' + (POS[ori][id][0] * 100).toFixed(2) + '%;top:' + (POS[ori][id][1] * 100).toFixed(2) + '%">' +
          (isCur ? '<i class="nflag"><svg viewBox="0 0 48 48"><use href="#i-flag"/></svg></i><i class="nring"></i>' : '') +
          '<div class="nd"><span class="sn">' + id + '</span>' + (boss ? '<svg class="nb" viewBox="0 0 48 48"><use href="#i-oni"/></svg>' : '') + (lk ? '<svg class="nl" viewBox="0 0 48 48"><use href="#i-lock"/></svg>' : '') + '</div>' +
          (cl ? '<div class="nst">' + UI.starsHtml(stars) + '</div>' : '') +
          '<div class="npl"><b>' + E(L(st.n)) + '</b>' + (boss ? '<em>BOSS</em>' : '') + '</div></div>';
      });
      h += '<div class="wm-scroll" id="wmScroll"><div class="wm-world" style="width:' + W + 'px;height:' + H + 'px;background-image:url(ui/map_' + ori + '.webp)">' + wisps + '<svg class="wm-path" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + svg + '</svg>' + nodes + '</div></div>';
    } else {
      h += '<div class="wm-scroll"><div class="wm-world" style="width:' + W + 'px;height:' + H + 'px;background-image:url(ui/map_' + ori + '.webp)"></div></div>' + wisps;
      h += '<div class="teaser" style="background-image:url(' + ART(ch.bg) + ')"><div class="tz-in"><div class="tz-boss" style="background-image:url(' + ART(ch.boss) + ')"></div><div class="tz-t"><b>COMING SOON</b><p>' + T('この先の物語は、夜明け前に。仲間を育て、絆を深めて待とう。', 'The story continues before dawn. Grow your party and deepen your bonds while you wait.') + '</p>' + (UI.selCh === 2 && S.d.cleared['1-5'] ? '<p class="cl">' + T('「次の山は、雷の峠か。」', '"The next peak is the Thunder Pass."') + '</p>' : '<p class="cl">' + T('第1章をクリアすると手がかりが…', 'Clear Chapter 1 to find clues...') + '</p>') + '</div></div></div>';
    }
    h += banner + '<div class="wm-vig"></div></div>';
    body.innerHTML = h;
    $('chPrev').onclick = () => { A.tap(); UI.selCh = Math.max(1, UI.selCh - 1); UI.hub(); };
    $('chNext').onclick = () => { A.tap(); UI.selCh = Math.min(D.CHAPTERS.length, UI.selCh + 1); UI.hub(); };
    const sc = $('wmScroll');
    if (sc) {
      const centre = () => {
        const ch2 = sc.clientHeight, Tt = 120, Bb = ch2 - 110, ids = D.STAGE_ORDER, ci = ids.findIndex((id) => !S.d.cleared[id]);
        const Y = (id) => POS[ori][id][1] * H + 100, X = (id) => POS[ori][id][0] * W;
        const cid = ids[ci < 0 ? ids.length - 1 : ci], nid = ids[Math.min(ids.length - 1, (ci < 0 ? ids.length - 1 : ci) + 1)], bid = ids[ids.length - 1];
        const mid = (Y(cid) + Y(bid)) / 2 - (Tt + Bb) / 2, lo = Y(cid) - (Bb - 110), hi = Y(nid) - (Tt + 60);
        sc.scrollTop = Math.max(0, hi < lo ? lo : Math.min(hi, Math.max(lo, mid)));
        sc.scrollLeft = Math.max(0, (X(cid) + X(nid)) / 2 - sc.clientWidth / 2);
      };
      centre(); requestAnimationFrame(centre);
      let dn = null, moved = false;
      sc.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; dn = { x: e.clientX, y: e.clientY, l: sc.scrollLeft, t: sc.scrollTop }; moved = false; });
      window.addEventListener('pointermove', UI._mapMove = (e) => { if (!dn || !document.body.contains(sc)) return; const k = 1 / (UI.scale || 1), dx = (e.clientX - dn.x) * k, dy = (e.clientY - dn.y) * k; if (Math.abs(dx) + Math.abs(dy) > 8) moved = true; if (moved) { sc.scrollLeft = dn.l - dx; sc.scrollTop = dn.t - dy; } });
      window.addEventListener('pointerup', () => { dn = null; });
      sc.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
      body.querySelectorAll('.stage').forEach((e) => e.addEventListener('click', () => {
        if (e.classList.contains('lk')) { UI.haptic(30); UI.toast(T('前のステージをクリアしよう', 'Clear the previous stage first')); return; }
        A.tap(); UI.stageModal(e.dataset.id);
      }));
    }
  };
  window.addEventListener('resize', () => { const b = $('hubBody'); if (b && b.classList.contains('map') && UI._mapOri && ((UI._mapOri === 'port') !== $('app').classList.contains('port'))) UI.hub(); });
})();
