# coincoin — Image-Generation Prompt Set (for ChatGPT)

> Prompts to generate every visual asset for the presentation site, 100% consistent with the existing comic universe. Paste the **global style lock** once, then run each asset, **attaching the listed reference image(s) every time**.

## Global style lock (paste first)

> "All assets share ONE visual universe: flat cel-shaded comic-book illustration, thick uniform near-black `#040607` outlines, hard offset comic shadows (no soft/luxury shadows), bold saturated flats, halftone/dot shading only. Palette: hero duck bright yellow `#F5D90A`, threat/thief in cold blue tones (`#3EB5F3` / `#0351A6`), night-blue background `#0B1B3A` with `#032B73` pixel-brick walls, danger red `#FF3B3B`, safe green `#27C93F`, monitoring blue `#3EB5F3`. Bold block lettering in yellow `#F5D90A` with black outline + bevel. NEVER use: glassmorphism, pastels, thin gray borders, realism, photographic rendering, gradients-as-glow-only, minimal fintech style. The duck is the ONLY yellow character and always wears a blue shield medal on its chest. Never make the duck scary, bloody, aggressive, or militarized — friendly, mischievous, heroic, protective."

---

## 1. Logo — Blue Shield Medal (square, transparent)
- **Use:** site header, loading mark, base for favicon. Files: `public/logo.svg` (master), `logo-512/256/128/64.png`, 1:1, transparent.
- **Attach:** `how-it-works.png` + `eip-7702-flip.png` (medal visible on the duck's chest).
- **Prompt:** "Isolated app logo: the blue shield medal that the coincoin hero duck wears on its chest, drawn ALONE, centered, on a fully TRANSPARENT background. Flat cel-shaded comic icon: a rounded heraldic shield in two blues (`#3EB5F3` light face, `#0351A6` deeper sides), thick near-black `#040607` outline, a small white snowflake / cross-guard emblem in the center exactly as on the reference duck's medal, subtle hard bevel highlight top-left. No text, no duck, no background, no drop shadow bleed. Square 1:1 framing with even padding so it crops cleanly. Crisp, high-contrast, icon-grade. Match the medal in the attached references EXACTLY in shape and color."

## 2. Favicon — simplified shield medal
- **Use:** browser tab/PWA. Files: `favicon.ico` (16/32/48), `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png` (180, solid bg ok), `icon-192/512.png`. 1:1, transparent (apple-touch solid ok).
- **Attach:** the logo render from #1 (re-feed), or `how-it-works.png`.
- **Prompt:** "Ultra-simplified favicon version of the coincoin blue shield medal, legible at 16×16 and 32×32. Bold chunky shield silhouette, only two blue tones (`#3EB5F3` and `#0351A6`), one thick near-black `#040607` outline, a single bold simplified white emblem in the center (reduce the snowflake to its clearest essential mark). No fine detail, no text, maximal contrast. TRANSPARENT background, square 1:1, centered, small even padding. Also output a variant centered on a solid `#0B1B3A` rounded square for apple-touch. Pixel-crisp, no anti-alias mush."

## 3. Wordmark badge (OPTIONAL — CSS is primary)
- **Use:** the site wordmark is the text **coincoin** in Bungee via CSS. Only generate this if you want a standalone graphic badge (social avatar/sticker). File: `public/wordmark.png`, ~3:1, transparent.
- **CRITICAL:** do NOT copy the illustration's lettering — it reads "COINÇOIN" (parasitic cedilla). Render clean "coincoin".
- **Prompt:** "Graphic wordmark badge of the single lowercase word `coincoin` — spelled c-o-i-n-c-o-i-n, exactly eight letters, NO cedilla, NO accent, NO uppercase, no extra characters. Bold rounded comic block lettering in bright yellow `#F5D90A`, thick near-black `#040607` outline, hard offset bevel shadow down-right in `#040607`, slight upward arch. TRANSPARENT background, generous even padding, horizontal lockup ~3:1. Comic-book sign-painting style. Do not add a duck or shield. Double-check the spelling is `coincoin`."

## 4. Hero illustration — duck guarding the glowing vault (NEW, wide)
- **Use:** landing hero. Files: `public/hero.png` (16:9, 1920×1080+), `public/hero-ultrawide.png` (21:9, 2560×1080+). Solid bg.
- **Attach:** `coincoin-illustration.png` + `eip-7702-flip.png`.
- **Prompt (16:9):** "Wide cinematic hero illustration, 16:9, flat cel-shaded comic style matching the attached references EXACTLY (same duck, same thief, same brick world). Composition: on the RIGHT, the bright yellow `#F5D90A` heroic cartoon duck — blue shield medal on its chest — stands confidently guarding an OPEN treasure chest/vault overflowing with glowing green `#27C93F` coins, radiating a hard-edged green comic glow and clean radial speed-lines. On the LEFT and receding into the background, the cold-blue hooded thief flees in panic, looking back over his shoulder, empty-handed, drawn smaller to show defeat. Setting: night-blue `#0B1B3A` pixel-brick wall (`#032B73` bricks), subtle halftone, hard offset ground shadows. The duck is the ONLY yellow element. Leave the LEFT-CENTER upper area calm/uncluttered as deliberate negative space for a headline + button overlay — keep the focal action right-of-center. Bold, punchy, heroic, friendly. No text in the image, no glassmorphism, no realism."
- **Prompt (21:9 ultrawide):** "Same scene and references as the coincoin hero, re-composed for ULTRAWIDE 21:9. Push the fleeing blue thief to the left edge, the green-glowing open vault + guarding yellow duck to the right third, extend the night-blue `#0B1B3A` pixel-brick wall across the wide middle with empty headroom upper-left for headline text. Keep every style rule identical: flat cel-shaded comic, thick black outlines, hard offset shadows, duck is the only yellow, blue medal on chest, green `#27C93F` glow on the coins. No baked-in text."

## 5. Mascot duck — 3 states (standalone, transparent, scroll guides)
Same duck, same proportions/medal across all three.

### 5a. Calm / monitoring — `public/duck-calm.png`, ~3:4 portrait, transparent. Attach `how-it-works.png`.
"The coincoin hero duck in a CALM MONITORING state, ALONE on a fully TRANSPARENT background. Same bright yellow `#F5D90A` duck as the reference, blue shield medal on chest, thick near-black `#040607` outlines, flat cel-shaded. Relaxed confident posture, friendly alert eyes scanning, maybe one wing raised in a casual 'all good' gesture, calm closed beak with a small reassuring smile. A subtle hard-edged monitoring-blue `#3EB5F3` comic glow / small radar-ping arc behind it (minimal). No background, no bricks, no text, no speech bubble. Full body, centered, even padding, portrait. The duck stays the only yellow element."

### 5b. Alert — `public/duck-alert.png`, ~1:1 or 4:5, transparent (incl. bubble). Attach `coincoin-illustration.png`.
"The coincoin hero duck in its ALERT state, ALONE on a fully TRANSPARENT background, EXACTLY matching the alert duck in the reference. Bright yellow `#F5D90A` duck, blue shield medal, wide-open shouting beak, alarmed wide eyes, wings flung out. A bold red `#FF3B3B` exclamation mark `!` pops above its head (REQUIRED). A white `#F3F5F3` comic speech bubble with thick black outline + tail reads `COIN COIN !` in bold black comic lettering (spelled C-O-I-N space C-O-I-N space !). Optional hard-edged red `#FF3B3B` alarm glow / motion lines, transparent elsewhere. No bricks, no background, no other characters. Full body + bubble + exclamation, centered, even padding. Friendly-panicked, never scary or bloody."

### 5c. Hero / funds-safe — `public/duck-hero.png`, ~3:4 portrait, transparent. Attach `eip-7702-flip.png`.
"The coincoin hero duck in a triumphant FUNDS-SAFE state, ALONE on a fully TRANSPARENT background. Same bright yellow `#F5D90A` duck, blue shield medal, thick near-black outlines, flat cel-shaded. Confident heroic pose: chest out, one wing on hip or thumbs-up, proud satisfied grin. A clean hard-edged success-green `#27C93F` comic glow / sparkle burst behind it (minimal), maybe a couple of glowing green coins safe at its feet. No background, no bricks, no text, no bubble. Full body, centered, even padding, portrait. The duck stays the only yellow element. Heroic but friendly, never militarized."

## 6. Section spot illustrations
`eip-7702-flip.png` (THE FLIP) and `how-it-works.png` (pipeline) are reused as-is. New ones:

### 6a. The drain (problem) — `public/spot-problem.png`, 16:9, 1600×900. Attach `coincoin-illustration.png` + `eip-7702-flip.png`.
"A comic spot illustration of the DRAIN PROBLEM, matching the coincoin universe. The cold-blue hooded thief greedily siphons a stream of blue-glowing coins out of an open wallet into a dark black 'SWEEPER' box marked with a skull, the coins trailing a hard-edged danger-red `#FF3B3B` energy line (no blood/gore). Night-blue `#0B1B3A` pixel-brick background, halftone shading, thick near-black outlines, hard offset shadows. The duck does NOT appear (threat-only frame). Leave clear space at top for a headline. Bold, ominous-but-cartoonish, never realistic. No baked-in text except an optional small red comic badge."

### 6b. DeFi auto-exit (roadmap) — `public/spot-defi.png`, 16:9, 1600×900. Attach `how-it-works.png`.
"A comic spot illustration: the coincoin duck pulling its glowing green `#27C93F` coins OUT of a tilting, cracking DeFi 'position' pool/lego-brick stack just in time, tucking them into a safe blue treasure vault. Same flat cel-shaded style and same duck — bright yellow `#F5D90A`, blue shield medal, thick black outlines, hard offset shadows, night-blue `#0B1B3A` brick background. Two small labeled comic gears/lego-bricks suggesting protocols (generic, no real logos). Green safe glow on rescued coins, a small danger-red `#FF3B3B` crack on the abandoned pool. Friendly heroic, no realism. Headroom at top for a title. No baked-in body text."

### 6c. Self-custody — `public/spot-noncustodial.png`, 1:1 or 4:3, transparent. Attach `how-it-works.png`.
"A comic spot illustration of SELF-CUSTODY: the bright yellow `#F5D90A` coincoin duck (blue shield medal) proudly holding a large glowing yellow comic KEY in one wing, beside its own blue treasure vault. A small hard-edged comic chain/leash runs from a labeled 'KEEPER' gear toward the vault but is clearly STOPPED/bounded — the keeper can only push coins IN, shown by a one-way green arrow into the vault, and a green `#27C93F` pill badge reading 'ONLY YOUR VAULT'. Flat cel-shaded, thick black outlines, hard offset shadows, transparent background. Reassuring, friendly, heroic. Spell any badge text correctly."

## 7. OG / Twitter social card — `public/og-image.png`, 1200×630, solid bg. Attach `coincoin-illustration.png`.
"Social-share card, exactly 1200×630 (1.91:1), flat cel-shaded comic style matching the reference. LEFT: the bright yellow `#F5D90A` coincoin duck mid-quack with blue shield medal and a white speech bubble reading `COIN COIN !` (C-O-I-N space C-O-I-N space !) and a red `#FF3B3B` exclamation mark — guarding a green-glowing `#27C93F` vault of coins; cold-blue thief flees small in back. RIGHT: clean dark space for text — render the lowercase wordmark `coincoin` (eight letters, NO cedilla/accent) in bold yellow `#F5D90A` Bungee-style block lettering with black outline + bevel, and beneath it the tagline `The onchain firewall that quacks before you get drained.` in clean white `#F3F5F3` comic sans-serif. Night-blue `#0B1B3A` pixel-brick background, halftone, thick outlines, hard offset shadows. Punchy, high-contrast, legible as a thumbnail. No glassmorphism/realism. Double-check spelling of `coincoin` and `COIN COIN !`."

## 8. Textures
### 8a. Seamless brick tile — `public/bg-brick-tile.png`, 512×512 (export 1024 retina), seamless, opaque. Attach `eip-7702-flip.png`/`how-it-works.png`.
"A SEAMLESSLY TILEABLE pixel-brick wall texture matching the coincoin background, 512×512, all four edges wrap with no visible seam. Night-blue `#0B1B3A` base with slightly lighter `#032B73` rectangular comic bricks in an offset running-bond pattern, thin near-black `#040607` mortar lines, very subtle hard-edged per-brick shading (no soft gradients), faint halftone dots. Flat, low-contrast enough to sit BEHIND content — no bright highlights, no focal point, uniform. No characters, no text. Opaque, tileable."

### 8b. Halftone overlay — `public/overlay-halftone.png`, 1024×1024, transparent, seamless.
"A SEAMLESSLY TILEABLE comic halftone overlay, 1024×1024, fully TRANSPARENT background with only a regular grid of small near-black `#040607` Ben-Day halftone dots, subtle, evenly spaced, fading to very low opacity. Edges wrap perfectly. No color, no characters, no text — pure dot texture to lay over artwork at low opacity with a blend mode for a printed-comic feel. Crisp dots, no blur."

## 9. Icon set — alerts / keeper / guardian / vault
> These exist inside `how-it-works.png` — crop/extract or redraw as SVG. For clean standalone source icons, generate the set with one prompt. Files: `public/icons/{alerts,keeper,guardian,vault}.png`, 512×512, transparent. Attach `how-it-works.png`.
"A matching SET of 4 square comic icons in the coincoin universe, EXACTLY matching the icons in the attached `how-it-works.png`. Each: a rounded-square comic tile with a dark blue `#032B73` face, thick near-black `#040607` outline, hard offset bevel shadow, flat cel-shaded subject, isolated on a fully TRANSPARENT background outside the tile, centered, 1:1, even padding. The four: (1) ALERTS — a satellite dish/radar with a small red `#FF3B3B` alert bolt; (2) KEEPER — a friendly blue mechanical robot/bot, never menacing; (3) GUARDIAN — a blue shield with a snowflake/cog emblem fused with a gear (matching the duck's medal motif); (4) VAULT — a closed blue treasure chest/vault with a green `#27C93F` glow leaking from the seams. Keep all four identical in tile style, line weight, lighting angle, and palette. No baked-in text labels, no realism, no glassmorphism."

---

## Build notes
- Attach reference images **every time**, even when reusing a description — style drifts without the visual anchor.
- For transparent assets, explicitly say "transparent PNG, no background"; if you get a checkered/solid bg, ask for an alpha re-export.
- After generating logo (#1) + favicon (#2), redraw as **SVG** (hand or tracer) for crisp small sizes.
- The canonical wordmark is CSS (Bungee, lowercase `coincoin`, `#F5D90A` + black outline + bevel) — ship #3 only if you need a graphic badge.
- `coincoin-illustration.png`, `eip-7702-flip.png`, `how-it-works.png` are reuse-ready (hero fallback, the flip section, how-it-works). Regenerate only for higher res or transparency.

## Where each asset goes on the site (filename → slot)
- `public/logo.svg` / `logo-*.png` → nav + footer shield mark (currently a CSS/SVG placeholder).
- `public/favicon.svg`+`.ico` → browser tab (placeholder shield shipped).
- `public/hero.png` (+ `-ultrawide`) → hero background (currently uses `coincoin-illustration.png`).
- `public/duck-alert.png` / `duck-calm.png` / `duck-hero.png` → scroll-guide mascot states.
- `public/spot-problem.png` / `spot-defi.png` / `spot-noncustodial.png` → section art.
- `public/og-image.png` → social share (referenced in `index.html`).
- `public/bg-brick-tile.png` / `overlay-halftone.png` → background textures (CSS fallbacks shipped).
- `public/icons/*.png` → how-it-works pipeline nodes (CSS/SVG fallback shipped).
