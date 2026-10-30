# Credits & licenses — 百鬼ノ夜 / Hyakki no Yoru

All third-party assets bundled in this repository, with source and license. Nothing here requires attribution on screen, but we credit them anyway.

## Fonts (bundled locally in `fonts/`, subset to the glyphs the game uses — SIL Open Font License 1.1)

| File | Font | Source | License |
|---|---|---|---|
| `fonts/mincho.woff2`, `fonts/mincho_xb.woff2` | **Shippori Mincho** (Medium, ExtraBold) — © 2021 The Shippori Mincho Project Authors | https://github.com/google/fonts/tree/main/ofl/shipporimincho | SIL OFL 1.1 |
| `fonts/brush.woff2` | **Yuji Boku** — © 2021 The Yuji Project Authors (https://github.com/Kinutafontfactory/Yuji) | https://github.com/google/fonts/tree/main/ofl/yujiboku | SIL OFL 1.1 |
| `fonts/cinzel.woff2` | **Cinzel** — © 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) | https://github.com/google/fonts/tree/main/ofl/cinzel | SIL OFL 1.1 |

The license texts are included in `fonts/OFL-*.txt`. OFL 1.1 full text: https://openfontlicense.org/open-font-license-official-text/ (the font files are redistributed as subsetted WOFF2 under the same license; the Reserved Font Names are not used for any modified derivative beyond subsetting).

## Art (AI-generated for this project)

Character portraits, enemy/boss art, battle backdrops, the painted night-yokai world map (`ui/map_land.webp`, `ui/map_port.webp`), and the four rarity chests (`ui/chest_wood|bronze|gold|legend.webp`) were generated with the Grok Bot image generator (GenerateImage) and post-processed (cropping, background removal/defringe, WebP conversion). No third-party artwork is included.

## Self-made assets (this project, same license as the code)

- UI icons (`#i-*` SVG sprite in `index.html`), ornate frame corners (`ui/c_*.svg`), washi paper textures (`ui/washi*.png`, generated procedurally with numpy/PIL).
- Combat VFX sprites (slash crescents, bursts, glows, claws, flares) are drawn at runtime on `<canvas>` by `fx.js` — no image files.
- **All audio is procedural Web Audio** (`audio.js`): convolution reverb from a generated impulse response, Karplus-Strong koto / shamisen / bass strings, a shakuhachi-like breath voice, taiko / gong / temple-bell voices, and six sequenced BGMs (title, story, camp, map, battle, boss). No audio files and no third-party samples are used, so there is nothing to license.

## Evaluated but not used

CC0 / commercial-OK asset packs were considered for UI, VFX and SFX (e.g. Kenney.nl, OpenGameArt CC0 collections), but the generated art and procedural audio matched the dark-Japanese style better, so none are bundled.

## Design references (inspiration only, no assets copied)

Layout and feedback patterns inspired by commercial mobile RPGs such as Onmyoji, Fate/Grand Order and Genshin Impact (bottom tab bar, currency badges, chest-opening suspense, skill cut-ins). No assets, names or code from those games are used.
