# coincoin — presentation site

The landing / presentation site for **coincoin**, the self-custodial onchain firewall
([repo root README](../README.md)). Long-scroll one-pager that explains the project, shows the
EIP-7702 "flip", walks through the live CLI demo, and links to the code.

Built with **Vite + React + TypeScript + Tailwind**. The theme is the brand kit
([`docs/brand/BRAND.md`](../docs/brand/BRAND.md)) — comic/brutalist, night-blue gradient, the
yellow duck `#F5D90A`, Bungee + IBM Plex Sans/Mono, hard bevel shadows.

## Develop

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # type-check + production build to dist/
pnpm preview   # serve the built dist/
```

## Assets

The three campaign illustrations (`public/coincoin-illustration.png`, `eip-7702-flip.png`,
`how-it-works.png`) ship in `public/` and are used directly. Logo, favicon, the standalone duck
states (`duck-alert/calm/hero.png`), the social card (`og-image.png`), and textures are slots:
the site ships sensible placeholders/fallbacks and renders fully without them. Generate the final
art from [`docs/brand/site-image-prompts.md`](../docs/brand/site-image-prompts.md) and drop the
files into `public/` — they're picked up by filename, no code change needed.

## Deploy

Static build — deploy `dist/` to any static host (Vercel / Netlify / GitHub Pages). No backend.
