/* data.js - all game content (characters, skills, enemies, stages, items, dishes). Text is [ja, en]. */
(function () {
  const D = {};
  D.VERSION = 1;

  /* ---------- characters ---------- */
  D.CHARS = {
    mumei:      { n: ['無名', 'Mumei'], full: ['無名の武者', 'Mumei, the Nameless Blade'], role: ['剣士', 'Swordsman'], elem: 'thunder', c: '#8fa6ff', base: { hp: 130, atk: 25, def: 11, spd: 100 }, crit: 0.08, start: true,
                  quote: ['斬るか、守るか。道は二つ、刃は一つ', 'Cut or protect. Two paths, one blade.'] },
    tamamo:     { n: ['玉藻', 'Tamamo'], full: ['九尾の狐・玉藻', 'Tamamo, the Nine-Tailed Fox'], role: ['妖術師', 'Sorceress'], elem: 'fire', c: '#ff6a7a', base: { hp: 95, atk: 28, def: 7, spd: 108 }, crit: 0.1,
                  quote: ['ふふ…化かし合いなら、負けないわ', 'Heh... in a game of tricks, I never lose.'] },
    shuramaru:  { n: ['修羅丸', 'Shuramaru'], full: ['三面鬼・修羅丸', 'Shuramaru, Three-Faced Oni'], role: ['剣鬼', 'Blade Oni'], elem: 'blade', c: '#ff9a3d', base: { hp: 165, atk: 22, def: 14, spd: 95 }, crit: 0.08,
                  quote: ['三つの面で、貴様を見ている', 'With three faces, I watch you.'] },
    oboro:      { n: ['朧', 'Oboro'], full: ['式神・朧', 'Oboro, the Shikigami'], role: ['癒し手', 'Healer'], elem: 'holy', c: '#d9d2ff', base: { hp: 105, atk: 15, def: 9, spd: 104 }, crit: 0.05,
                  quote: ['ご主人様、お札の用意はできております', 'Master, the charms are ready.'] },
    karasuba:   { n: ['鴉羽', 'Karasuba'], full: ['烏天狗・鴉羽', 'Karasuba, Crow Tengu'], role: ['疾風', 'Windblade'], elem: 'wind', c: '#c58bff', base: { hp: 105, atk: 25, def: 8, spd: 122 }, crit: 0.12,
                  quote: ['風を読め。それが勝負だ', 'Read the wind. That decides the fight.'] },
    yukihana:   { n: ['雪華', 'Yukihana'], full: ['雪女・雪華', 'Yukihana, Snow Maiden'], role: ['氷術師', 'Frost Mage'], elem: 'ice', c: '#7fe9ff', base: { hp: 100, atk: 27, def: 8, spd: 102 }, crit: 0.08,
                  quote: ['静かに…すべて、凍らせてあげる', 'Quietly... I will freeze it all.'] },
    kappa:      { n: ['川之助', 'Kawanosuke'], full: ['河童浪人・川之助', 'Kawanosuke, Kappa Ronin'], role: ['守りの剣客', 'Guardian Blade'], elem: 'water', c: '#58e6a0', base: { hp: 145, atk: 22, def: 13, spd: 98 }, crit: 0.08,
                  quote: ['きゅうりは大事だが…義は、もっと大事だ', 'Cucumbers matter... but honor matters more.'] },
  };
  D.CHAR_ORDER = ['mumei', 'tamamo', 'shuramaru', 'oboro', 'karasuba', 'yukihana', 'kappa'];

  /* ---------- skills ---------- */
  // tgt: enemy | enemies | rand | ally | allies | self
  // hits: damage multipliers; heal: ATK multiplier; st: statuses [{t,ch,turns,val}]; self/allySt: statuses to self / allies
  D.SK = {
    strike:    { n: ['斬撃', 'Strike'], d: ['敵1体を攻撃。妖気+1', 'Hit one enemy. +1 Yoki'], cost: 0, tgt: 'enemy', hits: [1.0], ki: 1, ult: 14 },
    guard:     { n: ['防御', 'Guard'], d: ['次の被ダメージ半減。妖気+1、奥義+20', 'Halve damage until your next turn. +1 Yoki, +20 Ult'], cost: 0, tgt: 'self', guard: true, ki: 1, ult: 20 },
    // Mumei (Oni path)
    raijin_zan:  { n: ['雷刃', 'Thunder Edge'], d: ['雷の斬撃(威力200%)。30%で気絶', 'Lightning slash (200%). 30% stun'], cost: 2, tgt: 'enemy', hits: [2.0], fx: 'thunder', st: [{ t: 'stun', ch: 0.3, turns: 1 }], ult: 16 },
    onijin_dan:  { n: ['鬼神断', 'Demon-God Cleave'], d: ['【奥義】全体に雷撃(220%)。50%で気絶', '[Ultimate] Thunder on all (220%). 50% stun'], tgt: 'enemies', hits: [2.2], fx: 'thunderBig', st: [{ t: 'stun', ch: 0.5, turns: 1 }], ultimate: true },
    // Mumei (Tiger path)
    kosou:       { n: ['虎爪連撃', 'Tiger Claw Flurry'], d: ['3連撃(80%x3)。会心率+20%', 'Triple hit (80%x3). +20% crit'], cost: 2, tgt: 'enemy', hits: [0.8, 0.8, 0.8], fx: 'claw', critUp: 0.2, ult: 16 },
    byakko:      { n: ['白虎乱舞', 'White Tiger Frenzy'], d: ['【奥義】5連撃(90%x5)', '[Ultimate] Five hits (90% x5)'], tgt: 'enemy', hits: [0.9, 0.9, 0.9, 0.9, 0.9], fx: 'claw', ultimate: true },
    // Tamamo
    kitsunebi_s: { n: ['狐火', 'Foxfire'], d: ['全体に炎(110%)。70%で火傷', 'Fire on all (110%). 70% burn'], cost: 2, tgt: 'enemies', hits: [1.1], fx: 'fire', st: [{ t: 'burn', ch: 0.7, turns: 3, val: 0.35 }], ult: 14 },
    kyubi:       { n: ['九尾幻惑', 'Nine-Tail Illusion'], d: ['【奥義】全体に大炎(190%)。60%で魅了', '[Ultimate] Great fire on all (190%). 60% charm'], tgt: 'enemies', hits: [1.9], fx: 'fireBig', st: [{ t: 'charm', ch: 0.6, turns: 1 }, { t: 'burn', ch: 1, turns: 3, val: 0.4 }], ultimate: true },
    // Shuramaru
    sanmen:      { n: ['三面斬', 'Triple-Face Slash'], d: ['ランダム3回斬る(100%x3)', 'Slash 3 random targets (100% x3)'], cost: 2, tgt: 'rand', hits: [1.0, 1.0, 1.0], fx: 'slash', ult: 14 },
    shura:       { n: ['阿修羅鏖', "Asura's Slaughter"], d: ['【奥義】単体へ大打撃(430%)。HP20%回復', '[Ultimate] Huge hit (430%). Heal 20% HP'], tgt: 'enemy', hits: [4.3], fx: 'slashBig', selfHeal: 0.2, ultimate: true },
    // Oboro
    ofuda:       { n: ['癒しの札', 'Healing Charm'], d: ['味方1人を大回復し状態異常を解除', 'Heal one ally greatly and cleanse'], cost: 2, tgt: 'ally', heal: 2.6, cleanse: true, fx: 'heal', ult: 10 },
    kekkai:      { n: ['結界百符', 'Hundred-Seal Barrier'], d: ['【奥義】全員回復+結界+攻撃UP', '[Ultimate] Heal all + barrier + ATK up'], tgt: 'allies', heal: 1.5, shield: 0.18, allySt: [{ t: 'atkUp', turns: 3, val: 0.25 }], fx: 'healBig', ultimate: true },
    // Karasuba
    hayate:      { n: ['疾風斬', 'Gale Slash'], d: ['全体に風刃(100%)', 'Wind blades on all (100%)'], cost: 2, tgt: 'enemies', hits: [1.0], fx: 'wind', ult: 14 },
    kamikaze:    { n: ['神風', 'Divine Wind'], d: ['【奥義】全体(160%)+味方SPD UP+妖気+2', '[Ultimate] All (160%), allies SPD up, +2 Yoki'], tgt: 'enemies', hits: [1.6], fx: 'windBig', allySt: [{ t: 'spdUp', turns: 3, val: 0.25 }], kiGain: 2, ultimate: true },
    // Yukihana
    tsurara:     { n: ['氷柱', 'Icicle'], d: ['氷柱で貫く(180%)。35%で凍結', 'Pierce with ice (180%). 35% freeze'], cost: 2, tgt: 'enemy', hits: [1.8], fx: 'ice', st: [{ t: 'freeze', ch: 0.35, turns: 1 }], ult: 14 },
    fubuki:      { n: ['吹雪', 'Blizzard'], d: ['【奥義】全体(200%)。60%で凍結', '[Ultimate] All (200%). 60% freeze'], tgt: 'enemies', hits: [2.0], fx: 'iceBig', st: [{ t: 'freeze', ch: 0.6, turns: 1 }], ultimate: true },
    // Kawanosuke
    mizutachi:   { n: ['水断ち', 'Water Sever'], d: ['斬撃(160%)+自身の防御UP', 'Slash (160%) and DEF up on self'], cost: 2, tgt: 'enemy', hits: [1.6], fx: 'water', selfSt: [{ t: 'defUp', turns: 2, val: 0.35 }], ult: 14 },
    iai:         { n: ['居合・河童返し', 'Iai: Kappa Return'], d: ['【奥義】防御50%無視の一閃(400%)', '[Ultimate] Piercing draw (400%, ignores 50% DEF)'], tgt: 'enemy', hits: [4.0], fx: 'slashBig', pierce: 0.5, ultimate: true },
  };

  D.KITS = {
    mumei_oni:   ['strike', 'raijin_zan', 'onijin_dan'],
    mumei_tiger: ['strike', 'kosou', 'byakko'],
    tamamo: ['strike', 'kitsunebi_s', 'kyubi'],
    shuramaru: ['strike', 'sanmen', 'shura'],
    oboro: ['strike', 'ofuda', 'kekkai'],
    karasuba: ['strike', 'hayate', 'kamikaze'],
    yukihana: ['strike', 'tsurara', 'fubuki'],
    kappa: ['strike', 'mizutachi', 'iai'],
  };
  D.PATHS = { oni: { n: ['鬼道', 'Oni Path'], d: ['雷で戦う。気絶と範囲攻撃が得意。', 'Fights with lightning. Stuns and area attacks.'] },
              tiger: { n: ['虎道', 'Tiger Path'], d: ['連撃と会心。単体への火力が高い。', 'Flurries and crits. High single-target damage.'] } };

  /* ---------- enemies ---------- */
  D.ENEMY_SK = {
    bash:   { n: ['殴打', 'Bash'], tgt: 'enemy', hits: [1.0], fx: 'hit' },
    ember:  { n: ['狐火', 'Ember'], tgt: 'enemy', hits: [0.9], fx: 'fire', st: [{ t: 'burn', ch: 0.4, turns: 2, val: 0.3 }] },
    flicker:{ n: ['揺らめく炎', 'Flicker'], tgt: 'enemies', hits: [0.5], fx: 'fire' },
    spin:   { n: ['傘回し', 'Umbrella Spin'], tgt: 'enemies', hits: [0.55], fx: 'wind' },
    tongue: { n: ['長い舌', 'Long Tongue'], tgt: 'enemy', hits: [1.2], fx: 'hit', st: [{ t: 'stun', ch: 0.2, turns: 1 }] },
    flame:  { n: ['提灯火', 'Lantern Flame'], tgt: 'enemy', hits: [1.1], fx: 'fire', st: [{ t: 'burn', ch: 0.3, turns: 2, val: 0.3 }] },
    blaze:  { n: ['火の粉', 'Blaze'], tgt: 'rand', hits: [0.7, 0.7], fx: 'fire' },
    // Arakami
    root:   { n: ['根撃ち', 'Root Smash'], tgt: 'enemy', hits: [1.35], fx: 'hit' },
    bell:   { n: ['鈴鳴り', 'Ringing Bells'], tgt: 'enemies', hits: [0.6], fx: 'bell', st: [{ t: 'stun', ch: 0.3, turns: 1 }] },
    charge: { n: ['荒御霊の溜め', 'Gathering Wrath'], tgt: 'self', charge: true },
    crush:  { n: ['大注連縄の圧殺', 'Great Shimenawa Crush'], tgt: 'enemies', hits: [2.0], fx: 'crush', big: true },
    summon: { n: ['小鬼召喚', 'Summon Imps'], tgt: 'self', summon: 'kogaki' },
    // Chapter 2 - thunder
    zap:      { n: ['雷噛み', 'Thunder Bite'], tgt: 'enemy', hits: [1.1], fx: 'thunder', st: [{ t: 'stun', ch: 0.15, turns: 1 }] },
    windblade:{ n: ['鎌風', 'Sickle Wind'], tgt: 'enemies', hits: [0.6], fx: 'wind' },
    drumroll: { n: ['雷太鼓', 'Thunder Drum'], tgt: 'enemies', hits: [0.5], fx: 'thunder' },
    taiko:    { n: ['轟雷の連打', 'Roaring Drumbeat'], tgt: 'enemies', hits: [0.6], fx: 'thunder', st: [{ t: 'stun', ch: 0.25, turns: 1 }] },
    kaminari: { n: ['落雷', 'Lightning Strike'], tgt: 'enemy', hits: [1.5], fx: 'thunderBig', st: [{ t: 'stun', ch: 0.3, turns: 1 }] },
    tenwari:  { n: ['天割り', 'Heaven-Splitter'], tgt: 'enemies', hits: [1.9], fx: 'thunderBig', big: true },
    callraijuu:{ n: ['雷獣召喚', 'Summon Raijuu'], tgt: 'self', summon: 'raijuu' },
  };
  D.ENEMIES = {
    kogaki:    { n: ['小鬼', 'Kogaki'], img: 'e_kogaki', base: { hp: 62, atk: 15, def: 5, spd: 98 }, ai: ['bash'], exp: 1, c: '#ff9a3d' },
    kitsunebi: { n: ['狐火', 'Kitsunebi'], img: 'e_kitsunebi', base: { hp: 48, atk: 17, def: 4, spd: 112 }, ai: ['ember', 'flicker'], exp: 1, c: '#8fd8ff' },
    karakasa:  { n: ['唐傘お化け', 'Karakasa'], img: 'e_karakasa', base: { hp: 92, atk: 16, def: 8, spd: 90 }, ai: ['spin', 'tongue'], exp: 1.3, c: '#b080ff' },
    chochin:   { n: ['提灯お化け', 'Chochin-obake'], img: 'e_chochin', base: { hp: 84, atk: 18, def: 6, spd: 102 }, ai: ['flame', 'blaze'], exp: 1.3, c: '#ffb03a' },
    arakami:   { n: ['鎮守の荒神', 'Chinju no Arakami'], img: 'arakami', boss: true, base: { hp: 540, atk: 21, def: 12, spd: 92 }, ai: ['root', 'bell', 'charge', 'crush'], ai2: ['bell', 'root', 'charge', 'crush'], exp: 6, c: '#ff62d8' },
    // Chapter 2
    raijuu:     { n: ['雷獣', 'Raijuu'], img: 'e_raijuu', base: { hp: 110, atk: 21, def: 7, spd: 114 }, ai: ['bash', 'zap'], exp: 1.5, c: '#ffd84a' },
    kamaitachi: { n: ['鎌鼬', 'Kamaitachi'], img: 'e_kamaitachi', base: { hp: 78, atk: 22, def: 5, spd: 124 }, ai: ['windblade', 'bash'], exp: 1.5, c: '#7fe9d0' },
    raidaiko:   { n: ['雷太鼓', 'Raidaiko'], img: 'e_raidaiko', base: { hp: 130, atk: 20, def: 10, spd: 94 }, ai: ['drumroll', 'bash'], exp: 1.8, c: '#9fb4ff' },
    raijin:     { n: ['雷神 鳴神', 'Raijin Narukami'], img: 'raijin', boss: true, base: { hp: 760, atk: 24, def: 12, spd: 105 }, ai: ['taiko', 'kaminari', 'charge', 'tenwari'], ai2: ['kaminari', 'taiko', 'kaminari', 'charge', 'tenwari'], crushSk: 'tenwari', exp: 10, c: '#7fa8ff',
                  title: ['雷鳴の荒神', 'THUNDER GOD'], chargeHint: ['⚠ 雷が天に集まっていく! 次の一撃は「防御」で備えよう', '⚠ Lightning gathers above! Brace with GUARD!'], enrage: [['雷神、激昂', 'NARUKAMI ENRAGES'], ['雷獣を呼び寄せた!', 'He calls the raijuu!']], summonKey: 'raijuu' },
  };

  /* ---------- stages (chapter 1 is fully playable) ---------- */
  D.STAGES = {
    '1-1': { ch: 1, n: ['夜の幕開け', 'Night Falls'], bg: 'bg_forest', lv: 1, rec: 1, waves: [['kogaki', 'kogaki']], exp: 45, gold: 120, first: { mag: 60 }, pre: 'c1s1pre', post: 'c1s1post', drop: 'weapon_n', tut: true },
    '1-2': { ch: 1, n: ['狐火の道', 'Foxfire Road'], bg: 'bg_forest', lv: 2, rec: 2, waves: [['kitsunebi', 'kogaki', 'kitsunebi']], exp: 80, gold: 180, first: { mag: 40, rice: 3 }, pre: 'c1s2pre', post: 'c1s2post', join: 'tamamo', drop: 'armor_r' },
    '1-3': { ch: 1, n: ['雨の唐傘', 'Umbrellas in the Rain'], bg: 'bg_forest', lv: 4, rec: 4, waves: [['karakasa', 'kogaki'], ['karakasa', 'kitsunebi', 'karakasa']], exp: 130, gold: 260, first: { mag: 40, herb: 3 }, pre: 'c1s3pre', post: 'c1s3post', join: 'shuramaru', drop: 'charm_r' },
    '1-4': { ch: 1, n: ['灯りの宿場', 'The Last Lantern'], bg: 'bg_forest', lv: 5, rec: 6, waves: [['chochin', 'kitsunebi'], ['chochin', 'karakasa', 'kogaki']], exp: 190, gold: 340, first: { mag: 40, fish: 3 }, pre: 'c1s4pre', post: 'c1s4post', join: 'oboro', drop: 'weapon_r' },
    '1-5': { ch: 1, n: ['鎮守の社', 'The Guardian Shrine'], bg: 'bg_shrine', lv: 7, rec: 8, waves: [['kogaki', 'chochin', 'kogaki'], ['arakami']], exp: 300, gold: 600, first: { mag: 100 }, pre: 'c1s5pre', post: 'c1s5post', boss: 'arakami', drop: 'weapon_sr', musicBoss: true },
    '2-1': { ch: 2, n: ['峠の麓', 'Foot of the Pass'], bg: 'bg_cloud_path', lv: 8, rec: 9, waves: [['raijuu', 'kogaki'], ['raijuu', 'raijuu']], exp: 300, gold: 420, first: { mag: 40, rice: 3 }, pre: 'c2s1pre', post: 'c2s1post', drop: 'armor_r' },
    '2-2': { ch: 2, n: ['鴉の見張り台', "The Crow's Watch"], bg: 'bg_cloud_path', lv: 9, rec: 10, waves: [['kamaitachi', 'kamaitachi', 'kamaitachi'], ['kamaitachi', 'kitsunebi', 'kamaitachi']], exp: 420, gold: 460, first: { mag: 40, fish: 3 }, pre: 'c2s2pre', post: 'c2s2post', join: 'karasuba', drop: 'weapon_r' },
    '2-3': { ch: 2, n: ['雷除けの集落', 'The Lightning-Ward Hamlet'], bg: 'bg_shrine_struck_dry', lv: 10, rec: 11, waves: [['raidaiko', 'kamaitachi'], ['raidaiko', 'raidaiko', 'kamaitachi']], exp: 560, gold: 500, first: { mag: 40, herb: 3 }, pre: 'c2s3pre', post: 'c2s3post', drop: 'charm_r' },
    '2-4': { ch: 2, n: ['雷鳴の石段', 'The Thunder Stairs'], bg: 'bg_storm', lv: 11, rec: 13, waves: [['raijuu', 'raidaiko'], ['raijuu', 'raijuu', 'raidaiko']], exp: 700, gold: 560, first: { mag: 40, rice: 3 }, pre: 'c2s4pre', post: 'c2s4post', drop: 'armor_r' },
    '2-5': { ch: 2, n: ['太鼓の回廊', 'The Corridor of Drums'], bg: 'bg_storm', lv: 12, rec: 14, waves: [['raijuu', 'raidaiko', 'raijuu'], ['raidaiko', 'raidaiko', 'raijuu']], exp: 850, gold: 620, first: { mag: 60, fish: 3 }, pre: 'c2s5pre', post: 'c2s5post', drop: 'weapon_r' },
    '2-6': { ch: 2, n: ['雷神 鳴神', 'Raijin Narukami'], bg: 'bg_peak', lv: 14, rec: 16, waves: [['raijuu', 'raidaiko', 'raijuu'], ['raijin']], exp: 1200, gold: 1100, first: { mag: 150 }, pre: 'c2s6pre', post: 'c2s6post', boss: 'raijin', drop: 'charm_sr@1', musicBoss: true },
  };
  D.STAGE_ORDER = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5', '2-6'];
  D.CHAPTERS = [
    { id: 1, n: ['鈴鳴りの森', 'The Forest of Ringing Bells'], d: ['無名は、鈴の呪いに狂う鎮守の荒神を鎮める旅に出る。', 'Mumei sets out to calm the Guardian God driven mad by a curse of bells.'], boss: 'arakami', bg: 'bg_forest', open: true },
    { id: 2, n: ['雷鳴の峠', 'The Thunder Pass'], d: ['太鼓の音が山を越えて響く。雷神・鳴神が、道を塞ぐ。', 'Drums echo over the mountains. Raijin Narukami blocks the way.'], boss: 'raijin', bg: 'bg_storm', open: true },
    { id: 3, n: ['蒼淵の祠', 'The Abyssal Shrine'], d: ['水底の社に眠る龍神。その涙が、世界を沈めようとしている。', 'A dragon god sleeps in a drowned shrine. Its tears threaten to sink the world.'], boss: 'ryujin', bg: 'bg_shrine' },
    { id: 4, n: ['夜明けの炎', 'Flames of Dawn'], d: ['すべての元凶、火之迦具土神。夜明けを取り戻す最後の戦い。', 'The origin of it all: Kagutsuchi. The final battle to bring back the dawn.'], boss: 'kagutsuchi', bg: 'bg_title' },
  ];

  /* ---------- equipment ---------- */
  D.SLOTS = ['weapon', 'armor', 'charm'];
  D.SLOT_N = { weapon: ['武器', 'Weapon'], armor: ['防具', 'Armor'], charm: ['御守', 'Charm'] };
  D.SLOT_ICON = { weapon: '刀', armor: '鎧', charm: '守' };
  D.RARITY = [{ n: ['並', 'N'], c: '#aab2c0' }, { n: ['良', 'R'], c: '#6fb8ff' }, { n: ['極', 'SR'], c: '#ffc94a' }];
  D.ITEM_NAMES = {
    weapon: [[['錆びた刀', 'Rusty Katana'], ['鉄の太刀', 'Iron Tachi'], ['古びた脇差', 'Worn Wakizashi']], [['鬼切の刃', 'Oni-Cutter Blade'], ['霊鋼の太刀', 'Spirit-Steel Tachi'], ['月影の刀', 'Moonshade Katana']], [['雷切', 'Raikiri'], ['村正・影打ち', 'Muramasa Shadow'], ['百鬼断ち', 'Hyakki-Dachi']]],
    armor:  [[['麻の羽織', 'Hemp Haori'], ['革の胴当', 'Leather Cuirass'], ['擦り切れた袴', 'Frayed Hakama']], [['鉄の胴丸', 'Iron Do-maru'], ['霊糸の羽織', 'Spiritsilk Haori'], ['山伏の装束', 'Yamabushi Garb']], [['鬼の大鎧', 'Oni Great Armor'], ['神楽の振袖', 'Kagura Furisode'], ['黒漆の鎧', 'Black-Lacquer Armor']]],
    charm:  [[['古いお守り', 'Old Omamori'], ['木の数珠', 'Wooden Beads'], ['欠けた鈴', 'Chipped Bell']], [['厄除けの札', 'Warding Ofuda'], ['翡翠の勾玉', 'Jade Magatama'], ['銀の鈴', 'Silver Bell']], [['九尾の尾飾り', 'Nine-Tail Charm'], ['雷神の太鼓玉', 'Thunder Drum Bead'], ['夜明けの勾玉', 'Dawn Magatama']]],
  };
  D.statOfItem = function (it) {
    const m = 1 + 0.25 * it.lv, r = it.rar;
    if (it.slot === 'weapon') return { atk: Math.round([7, 13, 22][r] * m) };
    if (it.slot === 'armor') return { hp: Math.round([35, 62, 105][r] * m), def: Math.round([3, 6, 10][r] * m) };
    return { hp: Math.round([18, 30, 52][r] * m), crit: [0.03, 0.05, 0.08][r] * (1 + 0.1 * it.lv), spd: [1, 2, 4][r] };
  };

  /* ---------- cooking ---------- */
  D.ING = { rice: ['米', 'Rice'], herb: ['山菜', 'Herbs'], fish: ['川魚', 'Fish'] };
  D.DISHES = {
    onigiri: { n: ['焼きおにぎり', 'Grilled Onigiri'], need: { rice: 2 }, battles: 5, buff: { hp: 0.2 }, d: ['最大HP+20%(5戦)', 'Max HP +20% (5 battles)'], fav: ['shuramaru', 'oboro'] },
    nabe:    { n: ['山菜鍋', 'Herb Hot-Pot'], need: { rice: 1, herb: 2 }, battles: 5, buff: { atk: 0.15 }, d: ['攻撃力+15%(5戦)', 'ATK +15% (5 battles)'], fav: ['tamamo', 'kappa'] },
    yaki:    { n: ['川魚の塩焼き', 'Salt-Grilled Fish'], need: { fish: 2 }, battles: 5, buff: { crit: 0.12 }, d: ['会心率+12%(5戦)', 'Crit +12% (5 battles)'], fav: ['karasuba', 'yukihana'] },
    dango:   { n: ['月見団子', 'Tsukimi Dango'], need: { rice: 2, herb: 1 }, battles: 5, buff: { exp: 0.4 }, d: ['獲得経験値+40%(5戦)', 'EXP gained +40% (5 battles)'], fav: ['oboro', 'tamamo'] },
    matsuri: { n: ['宴の膳', 'Banquet Tray'], need: { rice: 2, herb: 2, fish: 2 }, battles: 5, buff: { hp: 0.15, atk: 0.12, exp: 0.25, ki: 1 }, d: ['HP+15% 攻撃+12% EXP+25% 妖気+1(5戦)', 'HP +15%, ATK +12%, EXP +25%, +1 Yoki (5 battles)'], fav: ['mumei', 'kappa', 'karasuba'] },
  };

  /* ---------- statuses ---------- */
  D.STATUS = {
    burn: { n: ['火傷', 'Burn'], c: '#ff7a3a', i: '焔', bad: true }, freeze: { n: ['凍結', 'Freeze'], c: '#7fe9ff', i: '凍', bad: true },
    stun: { n: ['気絶', 'Stun'], c: '#ffd84a', i: '眩', bad: true }, charm: { n: ['魅了', 'Charm'], c: '#ff8ad0', i: '惑', bad: true },
    atkUp: { n: ['攻撃UP', 'ATK Up'], c: '#ff9a6a', i: '攻' }, defUp: { n: ['防御UP', 'DEF Up'], c: '#8fc8ff', i: '守' },
    spdUp: { n: ['速度UP', 'SPD Up'], c: '#b6ff9a', i: '速' }, shield: { n: ['結界', 'Barrier'], c: '#e8e0ff', i: '結' },
  };

  /* ---------- progression ---------- */
  D.expNeed = (lv) => Math.round(24 + 11 * lv + 4 * lv * lv);
  D.levelCap = (star) => 20 + 5 * star;
  D.starNeed = [10, 20, 35, 55];
  D.MAX_STAR = 4;
  D.bondNeed = [0, 12, 30, 60, 100]; // cumulative points to reach bond level 1..5

  /* ---------- daily login calendar ---------- */
  D.LOGIN = [
    { mag: 30 }, { gold: 600 }, { rice: 3, herb: 3, fish: 3 }, { mag: 50 }, { item: 'weapon_r' }, { gold: 1500 }, { mag: 100, item: 'armor_sr' },
  ];
  D.QUESTS = [
    { id: 'win', n: ['戦いに3回勝利する', 'Win 3 battles'], goal: 3, rew: { mag: 10 } },
    { id: 'cook', n: ['料理を1回作る', 'Cook a meal'], goal: 1, rew: { mag: 10, rice: 1 } },
    { id: 'talk', n: ['仲間と3回話す', 'Talk with companions 3 times'], goal: 3, rew: { mag: 10 } },
    { id: 'chest', n: ['宝箱を1回開ける', 'Open a chest'], goal: 1, rew: { gold: 200 } },
  ];
  D.TOWER = { unlock: '1-2' };

  window.DATA = D;
})();

window.ART = function (k) { if (k === 'mumei') { const S = window.State; return 'mumei_' + (S && S.d && S.d.chars && S.d.chars.mumei.path === 'tiger' ? 'tiger' : 'oni') + '.webp'; } return k + '.webp'; };
