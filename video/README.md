# coincoin — videos (Remotion)

Two compositions for the submission, both 1920×1080 @ 30fps:

- **`Pitch`** (~70s) — problem → solution → how → proof → close.
- **`Demo`** (~66s) — recreated end-to-end run with the real on-chain data (victim `0xfa14…3368`, vault 0→800, real tx hashes).

Brand tokens live in `src/theme.ts`; scenes in `src/scenes/`. See "Add the voiceover" below for the fish.audio workflow.

## Run
```bash
cd video
pnpm install
pnpm dev      # Remotion Studio (live preview)
pnpm render   # → out/pitch.mp4 + out/demo.mp4   (pnpm render:pitch / render:demo for one)
```

## Add the voiceover (fish.audio)
The video renders fine **without** audio (silent cut). To add narration:

1. Open the narration scripts in the design spec (section *Narration scripts*).
2. On [fish.audio](https://fish.audio), generate **one MP3 per scene** (recommended voice: a composed US male, e.g. "Adrian"). The `[emphasis]` / `[long pause]` / `[chuckle]` tags are kept inline.
3. Save them as:
   - `public/audio/pitch/01.mp3 … 06.mp3`
   - `public/audio/demo/01.mp3 … 06.mp3`
4. Re-run `pnpm render`.

Each scene **auto-resizes to its clip's length** (floored at the scene's min so animations always finish) — no manual timing needed. The MP3s are gitignored (generated assets).

## Music + sound effects
An original, royalty-free ambient bed (`public/audio/music.mp3`) and a few light SFX
(`public/audio/sfx/{boom,pop,whoosh,alert,chime}.mp3`) are **synthesized** by
`tools/gen-audio.mjs` (no deps) and committed. Regenerate with:
```bash
node tools/gen-audio.mjs                       # writes tools/_raw/*.wav
# then convert (Remotion's ffmpeg): for each, e.g.
npx remotion ffmpeg -y -i tools/_raw/music.wav -codec:a libmp3lame -q:a 4 public/audio/music.mp3
```
Mix knobs live in `src/audio.ts` (`MUSIC_VOLUME`, `SFX_GAIN` — set `SFX_GAIN = 0` to mute SFX);
per-effect placement/volume is in each scene's `<Sfx .../>`. Kept deliberately light.

## Edit
- URLs / on-chain shorthands: `src/content.ts` (e.g. `LIVE_URL` if you set a custom Vercel domain).
- Per-scene length floors: `src/manifest.ts`.
- Brand tokens: `src/theme.ts`. Scenes: `src/scenes/{pitch,demo}/`.
