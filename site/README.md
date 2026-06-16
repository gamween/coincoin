# coincoin — presentation site

The landing / presentation site for **coincoin**, the self-custodial onchain firewall
([repo root README](../README.md)). Long-scroll one-pager that explains the project, shows the
EIP-7702 "flip", walks through how to run the CLI, and links to the code. Plus standalone
Docs / Contact / License pages.

Built with **Vite + React + TypeScript + Tailwind**. The theme (in `tailwind.config.js`) is
comic/brutalist — night-blue gradient, the yellow duck `#F5D90A`, Bungee + IBM Plex Sans/Mono,
hard bevel shadows.

## Develop

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # type-check + production build to dist/
pnpm preview   # serve the built dist/
```

## Assets

Brand art lives in `public/`: the campaign illustration (`coincoin-illustration.png` — also the
hero and the OG/Twitter card, see `index.html`), the extracted cutouts used by the hero and the
section index (`hero-*.png`, `duck-*.png`, `flip-*.png`), the pipeline icons (`icons/`), the
stamps (`pow-/boom-/speed-*.png`), and the brick texture (`bg-brick-tile.png`). New art is picked
up by filename — no code change needed.

## Deploy

Static build — deploy `dist/` to any static host (Vercel / Netlify / GitHub Pages). No backend.
