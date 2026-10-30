/* story.js - visual-novel scripts. Line: [speaker|null, ja, en, opts]; opts: {L,R,bg,sil,fx}. Speaker '?' = unknown voice. */
(function () {
  const S = {};
  S.c1s1pre = { bg: 'bg_title', music: 'story', lines: [
    [null, '千年に一度、百鬼の夜が明けない。', 'Once every thousand years, the Night of a Hundred Demons refuses to end.', { fx: 'fade' }],
    [null, '神々は荒ぶり、鬼と妖が人の世へあふれ出した。', 'The gods have turned wrathful, and demons spill into the human world.'],
    [null, '——名を捨てた一人の武者が、鈴鳴りの森へ足を踏み入れる。', '— A warrior who abandoned his name steps into the Forest of Ringing Bells.', { bg: 'bg_forest' }],
    ['mumei', '……また一つ、村が消えたか。', '...Another village, gone.', { L: 'mumei' }],
    ['mumei', '名など、とうに捨てた。だが刃だけは、まだ折れていない。', 'I abandoned my name long ago. But my blade is not yet broken.'],
    ['?', 'ギャギャ！ 人間だ、人間の匂いだ！', 'Gyah! A human! I smell a human!', { R: 'e_kogaki', sil: 'R', fx: 'shake' }],
    ['mumei', '来い。夜が明けるまで、何度でも斬ってやる。', 'Come. I will cut you down as many times as it takes for the dawn.', { R: null }],
  ] };
  S.c1s1post = { bg: 'bg_forest', lines: [
    ['mumei', '……鈴の音？ 森の奥からだ。', '...A bell? From deep in the forest.', { L: 'mumei' }],
    [null, '奥の社へ続く道に、青白い狐火が揺れていた。', 'Pale foxfire flickered along the path to the shrine at the forest\'s heart.'],
  ] };
  S.c1s2pre = { bg: 'bg_forest', lines: [
    ['tamamo', 'あら、迷い子かしら。それとも……刃を持った鬼？', 'Oh, a lost child? Or... a demon with a blade?', { L: 'mumei', R: 'tamamo' }],
    ['mumei', '何者だ。', 'Who are you?'],
    ['tamamo', '玉藻。見ての通り、ただの狐よ。……九つ尾があるだけの、ね。', 'Tamamo. Just a fox, as you can see. ...One with nine tails.'],
    ['tamamo', '鎮守の社の荒神が目を覚ましたの。あれが鈴を鳴らすたび、森の妖は狂ってしまう。', 'The guardian god of the shrine has awoken. Each time it rings its bells, the yokai of the forest go mad.'],
    ['tamamo', '……ほら、お客さんよ。手伝ってあげる。私の狐火、ちゃんと避けてね？', '...Look, company. I\'ll help. Do try to dodge my foxfire, won\'t you?', { fx: 'flash' }],
  ] };
  S.c1s2post = { bg: 'bg_forest', lines: [
    ['tamamo', 'ふふ、やるじゃない。……気に入ったわ。しばらく付き合ってあげる。', 'Hm, not bad. I like you. I\'ll tag along for a while.', { L: 'mumei', R: 'tamamo' }],
    ['mumei', '勝手にしろ。', 'Suit yourself.'],
    ['tamamo', '素直じゃないのね。……あなた、名は？', 'Not very honest, are you? ...Your name?'],
    ['mumei', '無い。', 'I have none.'],
    ['tamamo', 'ふうん。じゃあ……「無名」。それでいいわ。', 'Hmm. Then... "Mumei" — Nameless. That will do.'],
  ] };
  S.c1s3pre = { bg: 'bg_forest', lines: [
    [null, '雨が降り出した。道の先で、唐傘がひとりでに跳ねている。', 'Rain began to fall. Ahead on the road, umbrellas hopped about on their own.', { L: 'mumei', R: 'tamamo' }],
    ['tamamo', '唐傘お化け……数が多いわ。気をつけて。', 'Karakasa... and so many. Careful.'],
    ['shuramaru', '待て。その傘どもは、俺の獲物だ。', 'Wait. Those umbrellas are my prey.', { R: 'shuramaru', fx: 'shake' }],
    [null, '雨の向こうから、三つの顔を持つ鬼が現れた。', 'Out of the rain stepped an oni with three faces.'],
    ['shuramaru', '修羅丸。……怒りも、哀しみも、笑いも、すべて斬ってきた。', 'Shuramaru. ...I have cut down anger, sorrow, even laughter.'],
    ['mumei', '味方か。', 'An ally?'],
    ['shuramaru', '斬る相手が同じなら、な。', 'As long as we cut the same things.'],
  ] };
  S.c1s3post = { bg: 'bg_forest', lines: [
    ['shuramaru', '……荒神は、鎮守の社の主。あれを斬らねば、この森は救えん。', '...The Arakami rules the shrine. Unless we cut it down, this forest cannot be saved.', { L: 'mumei', R: 'shuramaru' }],
    ['tamamo', '怖い顔して、意外と世話焼きなのね。', 'Scary face, but surprisingly caring.', { R: 'tamamo' }],
    ['shuramaru', '顔は三つある。そのうち一つは、今笑っている。', 'I have three faces. One of them is smiling right now.', { R: 'shuramaru' }],
  ] };
  S.c1s4pre = { bg: 'bg_forest', lines: [
    [null, '廃れた宿場に、ひとつだけ灯りが残っていた。', 'In an abandoned post town, a single light remained.', { L: 'mumei', R: 'oboro' }],
    ['oboro', 'お待ちしておりました。……いえ、どなたか来てくださるのを、ずっと。', 'I have been waiting. ...No — for anyone at all to come.'],
    ['oboro', '朧と申します。主を失った、ただの式神です。', 'I am Oboro. Merely a shikigami who has lost its master.'],
    ['oboro', '社の荒神様は、鈴の呪いで……眠ることも許されず、暴れているのです。', 'The god of the shrine, cursed by the bells, is not even allowed to sleep. It rages.'],
    ['mumei', '鈴の呪い……誰が？', 'A curse of bells... Who did it?'],
    ['oboro', '雷鳴の……太鼓の音が、聞こえました。', 'I heard... the sound of thunder drums.', { fx: 'thunder' }],
    ['oboro', '——っ、提灯が！ ご助力いたします！', '— Lanterns! Allow me to assist!', { fx: 'flash' }],
  ] };
  S.c1s4post = { bg: 'bg_forest', lines: [
    ['oboro', '社はこの先です。……どうか、荒神様をお救いください。斬る、のではなく。', 'The shrine is just ahead. Please... save the god. Not merely cut it down.', { L: 'mumei', R: 'oboro' }],
    ['mumei', '約束はできん。……だが、斬るだけで終わらせはしない。', 'I cannot promise. But I will not let it end with only cutting.'],
  ] };
  S.c1s5pre = { bg: 'bg_shrine', music: 'story', lines: [
    [null, '注連縄に絡め取られた社。その中心で、根と鈴の巨躯が目を開いた。', 'A shrine bound in shimenawa. At its center, a colossus of roots and bells opened its eyes.', { L: 'mumei', R: 'arakami', fx: 'shake' }],
    ['arakami', 'リン……リン……眠ら、せて……くれ……', 'Ring... ring... let me... sleep...'],
    ['shuramaru', '来るぞ。', 'Here it comes.', { R: 'shuramaru' }],
    ['tamamo', '鈴が鳴るたびに力を溜めてるわ！ 溜めのあとの一撃は「防御」で受けて！', 'It gathers power with every bell! Use GUARD against the big strike that follows the charge!', { R: 'tamamo' }],
    ['oboro', '傷ついた方は、私が癒します。どうか、ご無理なく。', 'I will heal the wounded. Please, do not push yourselves.', { R: 'oboro' }],
  ] };
  S.c1s5post = { bg: 'bg_shrine', music: 'story', lines: [
    ['arakami', '……ああ……鈴が……止んだ……', '...Ah... the bells... have stopped...', { L: 'mumei', R: 'arakami' }],
    ['oboro', '荒神様の呪いが、解けていきます……', 'The curse is lifting...', { R: 'oboro' }],
    ['mumei', '礼はいい。……この鈴、誰が結んだ？', 'No thanks needed. ...Who tied these bells here?', { R: null }],
    [null, 'そのとき、遠雷が空を裂いた。', 'Just then, distant thunder tore the sky.', { bg: 'bg_storm', fx: 'thunder' }],
    [null, 'ドン、ドン、ドン——太鼓の音が、山を越えて響いてくる。', 'Don, don, don — drums echoed across the mountains.'],
    ['?', 'ドンドコドン！ 鈴を鎮めたか、人間。……ならば次は、俺の番だ。', 'Dondokodon! You quieted the bells, human. ...Then next, it is my turn.', { R: 'raijin', sil: 'R', fx: 'shake' }],
    ['tamamo', '雷神……鳴神。まさか、あれが元凶？', 'Raijin Narukami... Don\'t tell me he is behind it all?', { L: 'tamamo', R: 'raijin', sil: 'R' }],
    ['mumei', '次の山は、雷の峠か。', 'The next peak is the Thunder Pass.', { L: 'mumei' }],
    ['shuramaru', '行くぞ、無名。夜は、まだ長い。', 'Let us go, Mumei. The night is still long.', { R: 'shuramaru', sil: null }],
  ], end: true };

  /* ---- Bond events: id = b_<char>_<lvl> ---- */
  const B = (bg, lines) => ({ bg, lines, bond: true });
  S.b_tamamo_2 = B('bg_camp', [
    ['tamamo', 'ねえ無名、この狐火……ちょっと温かいでしょう？', 'Hey, Mumei — this foxfire is warm, isn\'t it?', { L: 'mumei', R: 'tamamo' }],
    ['mumei', '……ああ。', '...Yeah.'],
    ['tamamo', '千年生きるとね、温かいものを数えるのが趣味になるの。今夜で、また一つ増えたわ。', 'After a thousand years, counting warm things becomes a hobby. Tonight, there is one more.'] ]);
  S.b_tamamo_4 = B('bg_camp', [
    ['tamamo', '本当の名前はね、玉藻前。人の世では、傾国の悪女って呼ばれたわ。', 'My true name is Tamamo-no-Mae. In the human world they called me a ruinous temptress.', { L: 'mumei', R: 'tamamo' }],
    ['mumei', '俺は、お前をそうは呼ばん。', 'I do not call you that.'],
    ['tamamo', '……ふふ。だから、あなたの隣は居心地がいいの。', '...Heh. That is why your side is so comfortable.'] ]);
  S.b_shuramaru_2 = B('bg_camp', [
    ['shuramaru', '三つの顔のうち、怒りは剣に、哀しみは盾に、笑いは……酒に使う。', 'Of my three faces, rage serves the sword, sorrow the shield, and laughter... the sake.', { L: 'mumei', R: 'shuramaru' }],
    ['mumei', '今夜は笑う番か。', 'Is it laughter\'s turn tonight?'],
    ['shuramaru', 'ああ。注げ。', 'Yes. Pour.'] ]);
  S.b_shuramaru_4 = B('bg_camp', [
    ['shuramaru', '無名。お前が斬ると決めた相手の前では、俺は迷わず前に立つ。', 'Mumei. Whoever you decide to cut, I will stand in front without hesitation.', { L: 'mumei', R: 'shuramaru' }],
    ['mumei', '……頼りにしている。', '...I am counting on you.'],
    ['shuramaru', '三つの顔が、同時に頷いた。', 'All three faces nodded at once.'] ]);
  S.b_oboro_2 = B('bg_camp', [
    ['oboro', 'ご主人様……と、お呼びしても？', 'May I call you... master?', { L: 'mumei', R: 'oboro' }],
    ['mumei', 'やめろ。無名でいい。', 'Don\'t. Mumei is fine.'],
    ['oboro', 'では、無名様。お茶が入りました。', 'Then, Lord Mumei. The tea is ready.'] ]);
  S.b_oboro_4 = B('bg_camp', [
    ['oboro', '私は紙で出来ています。濡れれば破れ、燃えれば消える。', 'I am made of paper. I tear when wet and vanish when burned.', { L: 'mumei', R: 'oboro' }],
    ['mumei', 'だから、守る。', 'So I will protect you.'],
    ['oboro', '……札に書いた願いが、初めて叶った気がします。', '...I feel as if the wish written on my charm has finally come true.'] ]);
  S.b_karasuba_2 = B('bg_camp', [
    ['karasuba', '山で修行を積んだ。「風の声を聞け」と、師は言った。', 'I trained in the mountains. "Listen to the voice of the wind," my master said.', { L: 'mumei', R: 'karasuba' }],
    ['mumei', '何と言っている。', 'What is it saying?'],
    ['karasuba', '……お前の背は、まだ冷たい、と。', '...That your back is still cold.'] ]);
  S.b_karasuba_4 = B('bg_camp', [
    ['karasuba', '黒い羽は不吉と言われる。だが、闇の中でこそ道を示せる。', 'Black feathers are called an ill omen. But only in darkness can they show the way.', { L: 'mumei', R: 'karasuba' }],
    ['mumei', '頼む、道案内を。', 'Guide us, then.'],
    ['karasuba', '承知。夜明けまで、先を飛ぶ。', 'Understood. I will fly ahead until dawn.'] ]);
  S.b_yukihana_2 = B('bg_camp', [
    ['yukihana', '雪は……溶けると、何も残らないの。', 'Snow... leaves nothing behind when it melts.', { L: 'mumei', R: 'yukihana' }],
    ['mumei', '春には水になる。', 'In spring it becomes water.'],
    ['yukihana', '……そう。それなら、悪くないわね。', '...I see. Then that is not so bad.'] ]);
  S.b_yukihana_4 = B('bg_camp', [
    ['yukihana', 'あなたの手、温かい。凍らせてしまいそう。', 'Your hand is warm. I might freeze it.', { L: 'mumei', R: 'yukihana' }],
    ['mumei', '構わん。', 'I do not mind.'],
    ['yukihana', '……本当に、変な人。', '...You really are strange.'] ]);
  S.b_kappa_2 = B('bg_camp', [
    ['kappa', 'きゅうりを分けよう。……遠慮はいらん。', 'Have some cucumber. No need to be shy.', { L: 'mumei', R: 'kappa' }],
    ['mumei', 'それは、お前の大事な物だろう。', 'Is that not precious to you?'],
    ['kappa', 'だから分けるのだ。', 'That is exactly why I share it.'] ]);
  S.b_kappa_4 = B('bg_camp', [
    ['kappa', '皿の水が減ると力が出ん。だが、斬るべきものの前では不思議と乾かん。', 'When the water in my dish runs low, my strength fades. Yet before something worth cutting, it never dries.', { L: 'mumei', R: 'kappa' }],
    ['mumei', 'それは、義か。', 'Is that honor?'],
    ['kappa', 'いや、ただの頑固だ。', 'No. Just stubbornness.'] ]);

  /* camp talk lines (daily "talk" -> bond points) [ja, en] per character */
  S.TALK = {
    mumei: [['夜は長い。だが、焚き火があれば歩ける。', 'The night is long. But with a fire, we can walk.']],
    tamamo: [['今日の化かし相手は、あなたよ？', 'Today, I am tricking you. Guess how?'], ['狐は気まぐれ。でも、焚き火の側は好きよ。', 'Foxes are fickle. But I do love sitting by a fire.']],
    shuramaru: [['腹が減っては、斬れぬ。', 'A hungry blade cuts poorly.'], ['三つの顔、全員が腹ぺこだ。', 'All three of my faces are starving.']],
    oboro: [['お茶を淹れましょうか。', 'Shall I make some tea?'], ['お札の補充は万全です。', 'The charms are fully restocked.']],
    karasuba: [['風が変わった。明日は雨だな。', 'The wind has changed. Rain tomorrow.'], ['夜でも、羽は休まらん。', 'Even at night, wings do not rest.']],
    yukihana: [['焚き火は……少し、苦手。でも綺麗ね。', 'Campfires... I am not good with them. But they are pretty.'], ['夜の雪は、静かでいいわ。', 'Night snow is peaceful. I like it.']],
    kappa: [['きゅうりを一本、どうだ。', 'Care for a cucumber?'], ['川の水が恋しい夜だ。', 'A night to miss the river.']],
  };

  window.STORY = S;
})();
