# 百鬼ノ夜 / HYAKKI NO YORU

Dark Japanese-folklore oni RPG for the browser (HTML5 / Canvas / plain JS). Playable Chapter 1: from the first night to the guardian god **Chinju no Arakami**, with a Raijin cliffhanger.

- **2.5D battle stage**: perspective ground plane, parallax layers (depth-of-field backdrop, fog, lanterns, foreground trunks), depth-sorted scaled painted portraits with ground shadows, idle breathing + pseudo-3D tilt, attack lunges, hit recoil/knockback, ultimate camera zoom, screen shake, lightning flashes + rim light, ambient particles. A built-in FPS governor trims effects on slow phones (`?fx=full|mid|low` forces a level).
- Turn-based speed-timeline battles (Yoki pool, ultimates with cut-ins, guard, boss telegraphs, AUTO, x1/x2/x4)
- Visual-novel story with portraits (ja / en)
- Party raising: levels, skills, equipment, bonds, shards; cooking buffs; camp rest + offline rewards; 7-day login; daily quests; 30-min chest; win streaks
- Rewarded + midgame ad hooks through an adapter (CrazyGames / Poki / simulated)
- PWA (offline), localStorage save, mobile + desktop, portrait + landscape

Ad simulation: on `github.io`, `localhost` and with `?adsim=1` the rewarded / midgame buttons show a fake 1.5 s ad overlay. Query flags: `?lang=en|ja`, `?debug=1`, `?nosw=1`, `?fx=full|mid|low`.

Art: AI-generated (see CREDITS.md). Audio: fully procedural WebAudio. Fonts: Shippori Mincho, Yuji Boku, Cinzel (SIL OFL 1.1, bundled locally). See `CREDITS.md`.
