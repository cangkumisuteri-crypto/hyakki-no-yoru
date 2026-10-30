/* story_ch2.js (integrated from drafts/ch2_story.js; bg: pre-boss shrine scenes use bg_shrine_struck_dry, rainy bg_shrine_struck only in c2s6post). Chapter 2 "The Thunder Pass" (雷鳴の峠) visual-novel scripts.
 * Line: [speaker|null, ja, en, opts]; opts: {L,R,bg,sil,fx}. Speaker '?' = unknown voice.
 * Self-contained: exports window.STORY_CH2. Programmer merges with: Object.assign(window.STORY, window.STORY_CH2).
 * Chapter 1 already ends cleanly (c1s5post: Arakami calmed, Raijin cliff-hanger, end:true), so there is no STORY_CH1_EXTRA.
 * New (not yet existing) ids used here:
 *   speaker 'goro' (needs a case in nameOf, main.js), portraits 'goro', 'e_raijuu', 'e_kamaitachi', 'e_raidaiko',
 *   backgrounds (art already in drafts/art_ch2): 'bg_cloud_path', 'bg_shrine_struck', 'bg_peak'.
 * Existing ids reused: bg_camp/bg_storm (2-4 and 2-5post); mumei tamamo shuramaru oboro karasuba raijin.
 * Rules: no sexual content, no blood/gore (light, smoke, shattering, ash instead). */
(function () {
  const S = {};

  /* ================= 2-1  峠の麓 / Foot of the Pass ================= */
  S.c2s1pre = { bg: 'bg_cloud_path', music: 'story', lines: [
    [null, '鎮守の社を後にした一行は、雷鳴の峠へ続く石段を登っていた。', 'Leaving the shrine behind, the party climbed the stone steps toward the Thunder Pass.', { fx: 'fade', L: 'mumei', R: 'tamamo' }],
    [null, '空は黒雲に覆われている。だが、雨は一滴も降らない。', 'The sky was choked with black cloud. Yet not a single drop of rain fell.'],
    ['tamamo', 'おかしいわね。これだけ雷が鳴って、雨粒ひとつ落ちてこないなんて。', 'Strange. With all this thunder, not one drop of rain.'],
    ['shuramaru', '空気がひりつく。髪が逆立つほどだ。', 'The air prickles. Enough to make hair stand on end.', { R: 'shuramaru' }],
    ['oboro', '無名様、これを。荒神様が、最後に私へ預けてくださった鈴です。', 'Lord Mumei, take this. The little bell the Arakami entrusted to me at the end.', { R: 'oboro' }],
    ['oboro', '黒い縄が近くにあると、ひとりでに鳴るのだそうです。', 'They say it rings by itself when the black cord is near.'],
    [null, '銀の鈴が、ちりん、と小さく震えた。', 'The silver bell gave a small, trembling chime.', { fx: 'flash' }],
    ['mumei', '鈴を縛っていた縄の呪い……この峠にも、あるのか。', 'The cord that bound the bells... it reaches this pass too.', { R: null }],
    ['?', 'ビリビリ……ビリビリビリッ！', 'Bzzt... bzzt-bzzt-bzzt!', { R: 'e_raijuu', sil: 'R', fx: 'shake' }],
    [null, '稲光とともに、青白い毛並みの獣が石段を駆け下りてきた。', 'With a flash of lightning, a pale-furred beast came bounding down the steps.'],
    ['mumei', '来るぞ。構えろ。', 'Here it comes. Ready yourselves.'],
  ] };
  S.c2s1post = { bg: 'bg_cloud_path', lines: [
    ['shuramaru', '雷獣か。雨は降らんのに、雷だけが獣になって降ってくる。', 'Raijuu. No rain falls, yet the lightning itself comes down as beasts.', { L: 'mumei', R: 'shuramaru' }],
    ['tamamo', '……見て。倒れた鳥居の柱に。', '...Look. On the fallen torii pillar.', { R: 'tamamo' }],
    [null, '黒い縄が、柱に幾重にも巻きついていた。縄は脈打つように、かすかに震えている。', 'A black cord was wound around the pillar, again and again. It trembled faintly, as if it had a pulse.'],
    ['oboro', '鈴が……鳴り止みません。', 'The bell... will not stop ringing.', { R: 'oboro' }],
    ['mumei', '社の鈴を縛っていた縄と、同じだ。', 'The same as the cord that bound the shrine\'s bells.', { R: null }],
    ['tamamo', '縄の先を辿れば、結んだ誰かに会える。……そうでしょう？', 'Follow the cord, and we find whoever tied it. ...Don\'t we?', { R: 'tamamo' }],
    [null, '縄は霧の奥、雲を貫く峰へと伸びていた。その震えは、遠い太鼓の拍と、ぴたりと重なっている。', 'The cord stretched into the mist, up toward a peak that pierced the clouds. Its trembling matched, beat for beat, the distant drums.', { fx: 'thunder' }],
  ] };

  /* ================= 2-2  鴉の見張り台 / The Crow's Watch  (Karasuba joins) ================= */
  S.c2s2pre = { bg: 'bg_cloud_path', lines: [
    [null, '霧が濃くなった。風が四方から、刃のように吹きつける。', 'The mist thickened. Wind came from every side, sharp as blades.', { L: 'mumei', R: 'tamamo' }],
    ['tamamo', '風が……斬ってくる？', 'The wind... is cutting at us?'],
    ['?', 'キキッ！ キキキッ！', 'Kiki! Kikiki!', { R: 'e_kamaitachi', sil: 'R', fx: 'shake' }],
    [null, '風の刃を放つ鎌鼬の群れが、霧の中を駆け回っている。', 'A pack of kamaitachi raced through the mist, loosing blades of wind.'],
    ['mumei', '見えん。', 'I cannot see them.', { R: null }],
    ['?', '目に頼るな。風を読め。', 'Do not trust your eyes. Read the wind.', { R: 'karasuba', sil: 'R' }],
    [null, '黒い羽根が一枚、霧を裂いて足元に突き立った。', 'A single black feather split the mist and pierced the ground at their feet.', { fx: 'flash' }],
    ['karasuba', '右に三、左に二。……動くな。まず、俺が見せる。', 'Three on the right, two on the left. ...Do not move. Let me show you first.', { R: 'karasuba', sil: null }],
    ['karasuba', '手を貸そう。ただし——お前が風に値するかは、見せてもらう。', 'I will lend a hand. But show me whether you are worthy of the wind.'],
  ] };
  S.c2s2post = { bg: 'bg_cloud_path', lines: [
    ['karasuba', '烏天狗、鴉羽。この峠で、雷と風の流れを見張っている。', 'Karasuba, a crow tengu. I keep watch over the flow of thunder and wind on this pass.', { L: 'mumei', R: 'karasuba' }],
    ['mumei', '見張り？', 'Watching?'],
    ['karasuba', '十日前まで、雷は雨を連れてきた。今は、ただ鳴るだけだ。……何かが、頂で縛られている。', 'Until ten days ago, thunder brought rain. Now it only roars. ...Something is bound at the summit.'],
    ['oboro', '黒い縄、ですね。', 'A black cord, is it not?', { R: 'oboro' }],
    ['karasuba', '知っているのか。ならば話が早い。', 'You know of it. Then this will be quick.', { R: 'karasuba' }],
    ['karasuba', '俺の師は、その縄を断ちに頂へ登った。……それきり、風の便りもない。', 'My master climbed to the summit to cut that cord. Since then, not even a word on the wind.'],
    ['tamamo', 'あら。案内役を買って出てくれるの？', 'Oh? Are you volunteering as our guide?', { R: 'tamamo' }],
    ['karasuba', 'この峠には、三つの谷と一本の石段、そして太鼓の頂がある。道を知る者がいなければ、夜明けまでに着けん。', 'This pass has three valleys, one great stairway, and the Drum Summit. Without someone who knows the way, you will not arrive before dawn.', { R: 'karasuba' }],
    ['mumei', '頼む。風の行く先を、教えてくれ。', 'Please. Show us where the wind leads.', { R: null }],
    ['karasuba', '承知。……風を読め。それが勝負だ。', 'Understood. ...Read the wind. That decides the fight.', { R: 'karasuba' }],
  ] };

  /* ================= 2-3  雷除けの集落 / The Lightning-Ward Hamlet ================= */
  S.c2s3pre = { bg: 'bg_shrine_struck_dry', lines: [
    [null, '峠の中腹。雷除けの社は、雷に打たれて焼け焦げていた。その周りに、小さな集落の跡が広がっている。', 'Midway up the pass stood the lightning-ward shrine — itself struck and scorched. Around it lay the remains of a small hamlet.', { L: 'mumei', R: 'oboro' }],
    [null, '軒先に吊られた太鼓が、ひとりでに鳴っている。ドン、ドン、ドン——', 'Drums hanging from the eaves were beating on their own. Don, don, don —'],
    ['oboro', 'あの太鼓……誰も叩いていないのに。', 'Those drums... and no one is striking them.'],
    ['karasuba', '付喪神だ。縄に拍を引かれて、勝手に動かされている。', 'Tsukumogami. The cord is dragging their rhythm, moving them against their will.', { R: 'karasuba' }],
    [null, '宙に浮いた太鼓の群れが、拍を揃えて迫ってきた。', 'A flock of floating drums closed in, beating in perfect unison.', { R: 'e_raidaiko', sil: 'R', fx: 'shake' }],
    ['shuramaru', '同じ拍だ。頂の太鼓と。', 'The same rhythm as the drums on the summit.', { R: 'shuramaru', sil: null }],
    ['tamamo', '踊らされてるのね。……いいわ、一曲だけ付き合ってあげる。', 'They are being made to dance. ...Fine. I will grant them one song.', { R: 'tamamo' }],
  ] };
  S.c2s3post = { bg: 'bg_shrine_struck_dry', lines: [
    [null, '太鼓が静まると、大きな桶の陰から、ちいさな青白い光が覗いた。', 'When the drums fell silent, a tiny pale glow peeked out from behind a great tub.', { L: 'mumei', R: 'goro', sil: 'R' }],
    ['goro', '……ゴ、ロ……', '...Go... ro...', { sil: null }],
    ['tamamo', 'あら、可愛い。雷獣の……子供？', 'Oh, how sweet. A raijuu... cub?', { L: 'tamamo' }],
    ['shuramaru', '三つの顔が、そろって困っている。', 'All three of my faces are at a loss.', { L: 'shuramaru' }],
    ['goro', 'ゴロ！ ゴロ、おやぶんのタイコ、ないてるの、しってる！', 'Goro! Goro knows! The boss\'s drum is crying!', { L: 'mumei' }],
    ['mumei', '親分、とは。', 'The boss?'],
    ['goro', 'カミナリのおやぶん！ ナルカミ！ ほんとはね、すっごく、やさしいの！', 'The Thunder Boss! Narukami! He is really, really kind!'],
    ['goro', 'でも、くろいひもが、ぎゅうって。おやぶん、わらってるけど……ほんとのわらいじゃ、ないの。', 'But the black cord squeezes him. The boss laughs... but it is not a real laugh.'],
    ['karasuba', '鳴神の眷属か。', 'A kin of Narukami\'s.', { L: 'karasuba' }],
    ['oboro', '無名様、この子は嘘をついていません。鈴が、静かなままです。', 'Lord Mumei, the child is not lying. The bell stays quiet.', { L: 'oboro' }],
    ['goro', 'ゴロ、あんない、する！ ちかみち、しってる！', 'Goro will guide you! Goro knows a shortcut!', { L: 'mumei' }],
    ['mumei', '……頼む、ゴロ。', '...Count on you, Goro.'],
  ] };

  /* ================= 2-4  雷鳴の石段 / The Thunder Stairs ================= */
  S.c2s4pre = { bg: 'bg_storm', lines: [
    [null, '雲海へ突き出す、古い石段。頭上では、太鼓の群れが輪を描いて浮かんでいる。', 'An old stone stairway jutted out over the sea of cloud. Overhead, a ring of drums hung in the air.', { L: 'mumei', R: 'goro', fx: 'fade' }],
    ['goro', 'ここ、のぼると、てっぺん！ ……ゴロ、こわい。', 'Climb this and it is the top! ...Goro is scared.'],
    ['karasuba', '石段が鳴いている。風ではない。雷が、段に集まっている。', 'The steps are groaning. Not from wind. Thunder is gathering on them.', { R: 'karasuba' }],
    ['?', 'ガッハッハッハ！ 来たな、来たな！ 鈴を鎮めた人間ども！', 'Gahahaha! You came, you came! The humans who quieted the bells!', { R: 'raijin', sil: 'R', fx: 'thunder' }],
    [null, '雲の裂け目に、巨大な槌を担いだ影が、腹を抱えて笑っていた。', 'In a rift in the clouds, a shadow with a giant mallet on its shoulder was roaring with laughter.'],
    ['raijin', '頂まで来たけりゃ、石段の雷を全部浴びてこい！ ドンドコ盃は、そのあとだ！', 'Want to reach my summit? Take every bolt on that stairway first! The Dondoko cup comes after!', { sil: null }],
    ['tamamo', '相変わらず、うるさい神様ね。', 'Still a very loud god.', { L: 'tamamo' }],
    ['raijin', '鬼の雷を持つ男、聞こえるか！ お前の刃の音、ずっと俺の太鼓に響いてたぜ！', 'You with the oni\'s thunder, can you hear me?! The sound of your blade has been echoing in my drums all along!', { L: 'mumei' }],
    ['mumei', '鬼の……雷。', 'An oni\'s... thunder.'],
    ['goro', 'おやぶん……また、わらってる。', 'Boss... laughing again.', { L: 'goro' }],
    [null, '稲妻が石段を走った。雷獣と雷太鼓が、段の上へ降り立つ。', 'Lightning raced along the stairway. Raijuu and thunder-drums landed on its steps.', { fx: 'flash' }],
  ] };
  S.c2s4post = { bg: 'bg_storm', lines: [
    [null, '稲妻がひとすじ、無名の刃を打った。……だが刃は雷を呑み、青白く唸っただけだった。', 'One bolt struck Mumei\'s blade. Yet the blade swallowed the lightning and only hummed, pale blue.', { L: 'mumei', R: 'shuramaru', fx: 'thunder' }],
    ['shuramaru', '無名、今のは。', 'Mumei, what was that?'],
    ['mumei', '……知らん。体が、勝手に受けた。', '...I do not know. My body took it on its own.'],
    ['karasuba', '雷を恐れぬ剣は、雷に呼ばれる。', 'A blade unafraid of lightning is called by the lightning.', { R: 'karasuba' }],
    ['tamamo', '鬼の雷、虎の爪。……あなたの道は二つ。どちらも、迷いの数ね。', 'Oni lightning, tiger claws. ...Two paths for you, and each one a doubt.', { R: 'tamamo' }],
    ['karasuba', '「雲は龍に、風は虎に従う」。古い言葉だ。', '"Clouds follow the dragon; wind follows the tiger." An old saying.', { R: 'karasuba' }],
    ['karasuba', '虎の道なら風が助け、鬼の道なら雷が応える。どちらを選んでも、お前の味方だ。', 'Walk the tiger\'s path and the wind helps; walk the oni\'s and the thunder answers. Whichever you choose, they stand with you.'],
    [null, 'その時、石段が光となって砕けた。段が、きらめく粒になって崩れていく。', 'Then the stairway shattered into light. The steps crumbled into glittering grains.', { fx: 'shake' }],
    ['karasuba', '掴まれ！ 飛ぶぞ！', 'Grab on! We fly!', { R: 'karasuba' }],
    [null, '黒い翼が風を孕み、一行は雲の海を越えた。', 'Black wings caught the wind, and the party crossed the sea of cloud.', { fx: 'flash' }],
  ] };

  /* ================= 2-5  太鼓の回廊 / The Corridor of Drums ================= */
  S.c2s5pre = { bg: 'bg_camp', lines: [
    [null, '頂を目前にした岩屋で、一行は短い夜営を取った。', 'In a rock shelter just below the summit, the party made a short camp.', { fx: 'fade', L: 'mumei', R: 'oboro' }],
    ['oboro', 'お茶が入りました。ゴロ様も、どうぞ。', 'The tea is ready. Please, Master Goro, you too.', { R: 'oboro' }],
    ['goro', 'ゴロ、ねむく、ない！ ……ふあ……', 'Goro is not sleepy! ...yaaawn...', { R: 'goro' }],
    ['tamamo', '眠れないの？ 無名。', 'Can\'t sleep, Mumei?', { R: 'tamamo' }],
    ['mumei', '刃が、うるさい。', 'My blade will not be quiet.'],
    [null, '無名の太刀が、遠い太鼓に合わせて、青く唸っていた。', 'Mumei\'s blade hummed blue, in time with the distant drums.'],
    ['tamamo', '鬼の雷で戦うか、虎の爪で戦うか。……それは、あなたが決めること。誰かに決めてもらう道じゃないわ。', 'Fight with the oni\'s thunder or the tiger\'s claws... that is for you to decide. It is not a road others can choose.'],
    ['mumei', '斬るか、守るか。道は二つ、刃は一つ。', 'Cut or protect. Two paths, one blade.'],
    ['shuramaru', '迷え。迷った分だけ、刃は重くなる。', 'Hesitate. The more you hesitate, the heavier the blade becomes.', { R: 'shuramaru' }],
    [null, '——その時、銀の鈴が激しく鳴り響いた。', 'Then the silver bell rang wildly.', { fx: 'flash' }],
    ['karasuba', '縄だ。回廊に、雷獣の影が並んでいる。', 'The cord. Raijuu shadows are lining up in the corridor.', { R: 'karasuba' }],
    ['mumei', '行くぞ。頂は、すぐそこだ。', 'Let us go. The summit is right there.', { R: null }],
  ] };
  S.c2s5post = { bg: 'bg_storm', lines: [
    [null, '太鼓の回廊を抜けた先に、雲を貫く岩の舞台が見えた。', 'Beyond the corridor of drums, a stage of rock pierced the clouds.', { L: 'mumei', R: 'goro', fx: 'thunder' }],
    ['goro', 'おやぶん！ あそこ！ おやぶんの、タイコ！', 'Boss! Over there! The boss\'s drums!'],
    ['karasuba', '……縄に、黒い羽が絡んでいる。', '...A black feather is tangled in the cord.', { R: 'karasuba' }],
    ['karasuba', '師のものではない。だが、縄を断とうとした跡が、残っている。', 'It is not my master\'s. But there are marks where someone tried to cut it.'],
    ['oboro', '縄が、すぐそこです。……鈴が、悲鳴のように。', 'The cord is right there. ...The bell is crying out.', { R: 'oboro' }],
    ['tamamo', '準備はいい？ 無名。', 'Ready, Mumei?', { R: 'tamamo' }],
    ['mumei', '……ああ。行こう。', '...Yes. Let us go.', { R: null }],
  ] };

  /* ================= 2-6  雷神 鳴神 / Raijin Narukami (BOSS) ================= */
  S.c2s6pre = { bg: 'bg_peak', music: 'story', lines: [
    [null, '雷鳴の頂。雲を貫く岩の舞台に、十の太鼓が円を描いて並んでいた。', 'The Thunder Summit. On a stage of rock above the clouds, ten drums stood in a ring.', { fx: 'thunder', L: 'mumei', R: 'raijin' }],
    ['raijin', 'ドンドコドン！ 天ごと割ってやる！', 'Dondokodon! I will split the heavens themselves!', { fx: 'shake' }],
    ['raijin', 'よく来た、よく来た！ 俺は雷神、鳴神！ 天を叩いて夜を鳴らす、天下一の太鼓打ちだ！', 'Welcome, welcome! I am Raijin Narukami! The greatest drummer under heaven, who strikes the sky and sounds the night!'],
    ['tamamo', '自己紹介が長いわね。', 'A long introduction.', { L: 'tamamo' }],
    ['raijin', 'おう、鈴の坊主を鎮めたのはお前らだな！ ……あいつの鈴を狂わせたのは、俺の太鼓の拍だ。', 'Oh, you are the ones who calmed the little bell-brat! ...It was the beat of my drums that drove his bells mad.', { L: 'mumei' }],
    ['raijin', 'だが、止められねえ！ 腕が、勝手に叩きやがる！ ガッハッハッハ！', 'But I cannot stop! My arms keep striking by themselves! Gahahaha!'],
    [null, '笑っているが、巨大な鉄槌を握る腕には、黒縄が変じた青銅の鎖が幾重にも絡み、小刻みに震えていた。', 'He laughed, but around the arms gripping his great iron mallet, bronze chains — the black cord, changed — were wound again and again, trembling ever so slightly.'],
    ['oboro', '笑っておられるのに……腕が、震えています。', 'He is laughing... yet his arms are trembling.', { L: 'oboro' }],
    ['raijin', '……見えたか。そうだ、この鎖が俺の腕を引いて、夜を鳴らさせる。', '...You saw. Yes. These chains drag my arms and make me sound the night.'],
    ['raijin', '頼み方は知らねえ！ 戦い方しか知らねえ！ だから、俺が全力で暴れて鎖が緩んだ隙に——断ってみろ！', 'I do not know how to ask for help! I only know how to fight! So when I rage with all my might and the chains slacken — cut them, if you can!'],
    ['karasuba', '鎖だけを狙う。拍の切れ目を、俺が読む。', 'We aim only for the chains. I will read the gaps in the beat.', { L: 'karasuba' }],
    ['mumei', '斬るか、守るか。……両方だ。', 'Cut or protect. ...Both.', { L: 'mumei' }],
    ['shuramaru', '三つの顔が、同時に頷いた。', 'All three faces nodded at once.', { L: 'shuramaru' }],
    ['raijin', 'ガッハッハ！ いい面だ！ 鬼の雷でも、虎の爪でも、全部受けてやる！', 'Gahaha! Good faces! Oni thunder or tiger claws, I will take them all!', { L: 'mumei', fx: 'thunder' }],
    ['raijin', 'ドンドコドン！ 天ごと割ってやる！', 'Dondokodon! I will split the heavens themselves!', { fx: 'shake' }],
  ] };
  /* OPTIONAL mid-battle (boss HP <= 50%): needs a battle hook; otherwise drop it. */
  S.c2s6mid = { bg: 'bg_peak', lines: [
    [null, '鎖がきしみ、太鼓の拍が乱れた。', 'The chains creaked, and the drumbeat faltered.', { L: 'mumei', R: 'raijin', fx: 'flash' }],
    ['raijin', 'ぐ……ぬう……腕が、重え！ もっとだ！ もっと強く打ってこい！ 鎖が、きしんでやがる！', 'Ugh... my arms are heavy! More! Hit harder! The chains are straining!'],
    ['karasuba', '今だ。鎖の留め金は、右手の槌の柄だ。', 'Now. The clasp is at the handle of the mallet, in his right hand.', { L: 'karasuba' }],
    ['mumei', '雷神ごと終わらせはしない。鎖だけを、断つ。', 'I will not end the god with it. I will cut the chains alone.', { L: 'mumei' }],
  ] };
  /* OPTIONAL path variants: play ONE before c2s6post depending on State.d.chars.mumei.path ('oni' | 'tiger'). */
  S.c2s6path_oni = { bg: 'bg_peak', lines: [
    ['raijin', 'おう、鬼の雷を選んだか！ その刃、俺の太鼓と同じ拍で鳴ってたぜ！', 'So you chose the oni\'s thunder! Your blade rang in the very same beat as my drums!', { L: 'mumei', R: 'raijin' }],
    ['mumei', '雷は、俺の中で鳴っている。……誰に教わったのかは、覚えていない。', 'The thunder rings inside me. ...I do not remember who taught me.'],
    ['raijin', 'ガハハ！ 思い出す時は、一緒に鳴らしてやる！', 'Gahaha! When you remember, we will play it together!'],
  ] };
  S.c2s6path_tiger = { bg: 'bg_peak', lines: [
    ['raijin', 'おう、虎の爪を選んだか！ 雷より速い獣は、天にもそういねえ！', 'So you chose the tiger\'s claws! Few beasts in heaven are faster than lightning!', { L: 'mumei', R: 'raijin' }],
    ['karasuba', '風が、お前に従っていた。虎の道だ。', 'The wind obeyed you. That is the tiger\'s path.', { R: 'karasuba' }],
    ['mumei', '爪は、守るためにも使える。', 'Claws can be used to protect, too.', { R: 'raijin' }],
    ['raijin', 'ガハハ！ 気に入った！', 'Gahaha! I like it!'],
  ] };
  S.c2s6post = { bg: 'bg_peak', music: 'story', lines: [
    [null, '無名の刃が、鎖を断ち切った。鎖は黒い灰のように崩れ、風にさらわれて消えていく。', 'Mumei\'s blade severed the chains. They crumbled like black ash and were swept away on the wind.', { L: 'mumei', R: 'raijin', fx: 'flash' }],
    [null, '十の太鼓が、ぴたりと止んだ。——百夜ぶりの、静寂。', 'All ten drums fell silent at once. — The first silence in a hundred nights.'],
    ['raijin', '……はっ。はは、ガッハッハッハ！ 腕が、軽い！', '...Ha. Hahaha, GAHAHAHA! My arms are light!'],
    ['goro', 'おやぶん！ おやぶーん！', 'Boss! Boooss!', { L: 'goro' }],
    ['raijin', '泣くな、ゴロ！ ガキは笑ってろ！', 'Do not cry, Goro! Kids laugh!', { L: 'mumei' }],
    ['raijin', '礼を言うぜ、人間。鬼の雷を持つ男、名は？', 'My thanks, human. You with the oni\'s thunder, what is your name?'],
    ['mumei', '無い。', 'I have none.'],
    ['raijin', 'ガハハ！ 名無しが、この鳴神を救ったか！ 気に入った！', 'Gahaha! A nameless one saved Narukami! I like it!'],
    ['raijin', 'この太鼓玉を持っていけ。雷の音が要る時は、俺が応えてやる！', 'Take this drum bead. When you need the sound of thunder, I will answer!', { fx: 'flash' }],
    ['oboro', '灰から、焦げた匂いがします。ただの縄でも、鎖でもありません。', 'The ashes smell scorched. This was no ordinary cord, nor chain.', { L: 'oboro' }],
    ['tamamo', '灰の中に、赤い火種。……燃える何かが、あの縄を結んだのね。', 'A red ember in the ash. ...Something burning tied that cord.', { L: 'tamamo' }],
    ['raijin', '結んだ奴の顔は見てねえ。ただ、鎖の向こうから声がした。熱い、燃えるような声がな。', 'I never saw who tied it. But a voice came through the chains. A hot, burning voice.', { L: 'mumei' }],
    ['?', '……夜明けは……我が炎……', '...The dawn... is my flame...', { fx: 'thunder', sil: 'R', R: null }],
    ['raijin', 'もう一つ教えてやる。縄は、俺と鈴だけじゃねえ。南の谷、蒼い淵にも、結ばれてるのが見えた。', 'One more thing. The cord is not only on me and the bells. I saw it tied in the south valley, at the blue abyss.', { R: 'raijin', sil: null }],
    ['raijin', '龍の旦那が、そこで泣いてた。', 'The dragon lord was weeping there.'],
    [null, 'ぽつり。……一粒。', 'Plip. ...One drop.', { fx: 'fade', bg: 'bg_shrine_struck' }],
    [null, '百夜ぶりの雨が、頂に降り出した。', 'For the first time in a hundred nights, rain began to fall on the summit.'],
    ['goro', 'あめ！ あめだ！', 'Rain! It is rain!', { R: 'goro' }],
    ['karasuba', '……雲は龍に従う。この雨は、南へ流れている。', '...Clouds follow the dragon. This rain is flowing south.', { L: 'karasuba' }],
    ['karasuba', '風が、南の谷から水の匂いを運んでくる。', 'The wind carries the smell of water from the southern valley.'],
    ['mumei', '次は、龍か。', 'Next, the dragon.', { L: 'mumei' }],
    ['shuramaru', '夜は、まだ長い。', 'The night is still long.', { R: 'shuramaru' }],
    ['tamamo', '行きましょう、無名。次は、水の底よ。', 'Let us go, Mumei. Next, the bottom of the water.', { R: 'tamamo' }],
  ], end: true };

  window.STORY_CH2 = S;
  if (window.STORY) Object.assign(window.STORY, S);
})();
