# coincoin Brand Kit

> Source de vérité UI pour le front (Next.js). Concrétise la DA de la spec ([section 10](../superpowers/specs/2026-06-10-coincoin-design.md)) en tokens directement exploitables. Généré le 11/06/2026 à partir de l'illustration de référence [`coincoin-illustration.png`](coincoin-illustration.png).
>
> ⚠️ Ne pas réutiliser le lettrage du titre de l'illustration comme wordmark : il contient une cédille parasite (« COINÇOIN »). Le wordmark app est le texte « coincoin » composé en font display.

## 1. Brand essence

coincoin is a living alarm duck for onchain security: a canary in the coal mine that quacks before the drain finishes, then moves funds to safety. The brand should feel friendly, mischievous, heroic, and protective, never scary or panic-inducing.

**Keywords:** alarm, guardian, mischievous

## 2. Color system

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0B1B3A` | Base app background, dark theme root |
| `background-gradient-top` | `#0B1B3A` | Top of vertical brand gradient |
| `background-gradient-bottom` | `#078BEB` | Bottom of vertical brand gradient |
| `surface` | `#032B73` | Main dashboard sections, nav, panels |
| `card` | `#0351A6` | Cards, widgets, security modules |
| `card-strong` | `#036BC8` | Highlighted cards, active modules |
| `border` | `#040607` | Comic outline borders, dividers, focus outlines |
| `border-soft` | `#3EB5F3` | Blue-tinted secondary borders |
| `text-primary` | `#F3F5F3` | Main text on dark surfaces |
| `text-muted` | `#AFD0C7` | Secondary labels, timestamps, helper text |
| `text-inverse` | `#040607` | Text on yellow, green, and light surfaces |
| `primary` | `#F5D90A` | Main action color, duck identity, brand highlights |
| `primary-hover` | `#FFE84A` | Hover state for primary actions |
| `danger` | `#FF3B3B` | Threat states, alert badges, emergency actions |
| `danger-hover` | `#FF6A5F` | Hover state for danger actions |
| `success` | `#27C93F` | Funds-safe states, evacuation complete, secure balances |
| `success-hover` | `#48E85D` | Hover state for success actions |
| `info` | `#3EB5F3` | Monitoring, neutral security info, links |
| `warning` | `#E59010` | Pending review, elevated risk without active drain |
| `off-white` | `#F3F5F3` | Speech bubbles, white highlights, empty cards |
| `blue-tint-light` | `#AFD0C7` | Secondary character tint, disabled illustrations |
| `blue-tint-mid` | `#3EB5F3` | Bricks, icons, info highlights |
| `near-black` | `#040607` | Outlines, bevel shadows, comic strokes |

```css
background: linear-gradient(180deg, #0B1B3A 0%, #032B73 48%, #078BEB 100%);
```

| Mascot state | UI state | Color mapping |
|---|---|---|
| Calm duck | `monitoring` | info `#3EB5F3` with dark blue surfaces |
| Alert duck | `threat-detected` | danger `#FF3B3B` with primary yellow emphasis |
| Hero duck | `funds-evacuated` | success `#27C93F` with green glow |

## 3. Typography

| Role | Font | Google Fonts import | Weights |
|---|---|---|---|
| Display candidate 1 | Bungee | `@import url('https://fonts.googleapis.com/css2?family=Bungee&display=swap');` | 400 |
| Display candidate 2 | Rubik Mono One | `@import url('https://fonts.googleapis.com/css2?family=Rubik+Mono+One&display=swap');` | 400 |
| Body | IBM Plex Sans | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');` | 400, 500, 600, 700 |

| Token | Size | Line height | Weight | Letter spacing | Usage |
|---|---|---|---|---|---|
| `h1` | 64px | 0.9 | 400 display | -0.04em | Hero titles, main page title |
| `h2` | 40px | 0.95 | 400 display | -0.035em | Section hero headings |
| `h3` | 28px | 1.05 | 700 body | -0.02em | Dashboard card titles |
| `body-lg` | 18px | 1.5 | 500 body | 0 | Important body copy |
| `body` | 16px | 1.5 | 400 body | 0 | Default UI text |
| `body-sm` | 14px | 1.45 | 500 body | 0.01em | Labels, secondary text |
| `caption` | 12px | 1.35 | 600 body | 0.06em | Badges, timestamps, table headers |
| `numeric-lg` | 56px | 1 | 700 body | -0.03em | Timers, balances, risk score |
| `numeric` | 24px | 1.1 | 700 body | -0.02em | Amounts, gas, countdown segments |

Typography rules:

- Display text uses Bungee by default, uppercase only, no lowercase display headings except the product wordmark `coincoin`.
- Dashboard body text uses IBM Plex Sans.
- Amounts, timers, block numbers, and wallet balances use:

```css
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1, "zero" 1;
```

## 4. Shape language

| Token | Value | Usage |
|---|---|---|
| `radius-none` | 0px | Pixel bricks, sharp comic bevel pieces |
| `radius-sm` | 6px | Small badges, labels |
| `radius-md` | 10px | Inputs, alert rows |
| `radius-lg` | 16px | Cards, modals |
| `radius-xl` | 24px | Hero panels, main dashboard modules |
| `radius-pill` | 999px | Pills, status badges, CTA buttons |
| `border-comic` | 3px solid `#040607` | Primary UI outline |
| `border-comic-sm` | 2px solid `#040607` | Smaller components |
| `border-info` | 2px solid `#3EB5F3` | Passive blue outline |
| `shadow-bevel` | 8px 8px 0 `#040607` | Main hard comic shadow |
| `shadow-bevel-lg` | 14px 14px 0 `#040607` | Hero cards, large CTA blocks |
| `shadow-bevel-sm` | 4px 4px 0 `#040607` | Buttons, badges |
| `shadow-green-glow` | 0 0 24px rgba(39, 201, 63, 0.65) | Safe funds glow |
| `shadow-red-glow` | 0 0 24px rgba(255, 59, 59, 0.55) | Active threat glow |
| `shadow-blue-glow` | 0 0 18px rgba(62, 181, 243, 0.45) | Monitoring glow |

Spacing scale:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |
| `space-24` | 96px |

## 5. Components

| Component | State | Background | Border | Text | Shadow |
|---|---|---|---|---|---|
| Primary button | default | `#F5D90A` | 3px solid `#040607` | `#040607` | 4px 4px 0 `#040607` |
| Primary button | hover | `#FFE84A` | 3px solid `#040607` | `#040607` | 6px 6px 0 `#040607` |
| Primary button | active | `#E6C800` | 3px solid `#040607` | `#040607` | 2px 2px 0 `#040607` |
| Secondary button | default | `#032B73` | 3px solid `#3EB5F3` | `#F3F5F3` | 4px 4px 0 `#040607` |
| Secondary button | hover | `#0351A6` | 3px solid `#3EB5F3` | `#F3F5F3` | 6px 6px 0 `#040607` |
| Secondary button | active | `#021757` | 3px solid `#3EB5F3` | `#F3F5F3` | 2px 2px 0 `#040607` |
| Danger button | default | `#FF3B3B` | 3px solid `#040607` | `#040607` | 4px 4px 0 `#040607` |
| Danger button | hover | `#FF6A5F` | 3px solid `#040607` | `#040607` | 6px 6px 0 `#040607` |
| Danger button | active | `#D92828` | 3px solid `#040607` | `#040607` | 2px 2px 0 `#040607` |
| Card | default | `#032B73` | 3px solid `#040607` | `#F3F5F3` | 8px 8px 0 `#040607` |
| Card | elevated | `#0351A6` | 3px solid `#040607` | `#F3F5F3` | 14px 14px 0 `#040607` |
| Card | safe | `#032B73` | 3px solid `#27C93F` | `#F3F5F3` | 0 0 24px rgba(39, 201, 63, 0.65), 8px 8px 0 `#040607` |
| Status banner | monitoring | `#032B73` | 3px solid `#3EB5F3` | `#F3F5F3` | 0 0 18px rgba(62, 181, 243, 0.45), 8px 8px 0 `#040607` |
| Status banner | alert | `#FF3B3B` | 3px solid `#040607` | `#040607` | 0 0 24px rgba(255, 59, 59, 0.55), 8px 8px 0 `#040607` |
| Status banner | safe | `#27C93F` | 3px solid `#040607` | `#040607` | 0 0 24px rgba(39, 201, 63, 0.65), 8px 8px 0 `#040607` |
| Alert-feed row | default | `#032B73` | 2px solid `#3EB5F3` | `#F3F5F3` | 4px 4px 0 `#040607` |
| Alert-feed row | warning | `#E59010` | 2px solid `#040607` | `#040607` | 4px 4px 0 `#040607` |
| Alert-feed row | danger | `#FF3B3B` | 2px solid `#040607` | `#040607` | 0 0 18px rgba(255, 59, 59, 0.45), 4px 4px 0 `#040607` |
| Alert-feed row | safe | `#032B73` | 2px solid `#27C93F` | `#F3F5F3` | 0 0 18px rgba(39, 201, 63, 0.45), 4px 4px 0 `#040607` |
| Countdown timer | default | `#040607` | 3px solid `#F5D90A` | `#F5D90A` | 8px 8px 0 `#040607` |
| Countdown timer | alert | `#040607` | 3px solid `#FF3B3B` | `#FF3B3B` | 0 0 24px rgba(255, 59, 59, 0.55), 8px 8px 0 `#040607` |
| Countdown timer | safe | `#040607` | 3px solid `#27C93F` | `#27C93F` | 0 0 24px rgba(39, 201, 63, 0.65), 8px 8px 0 `#040607` |

Component sizing:

| Component | Padding | Radius | Font |
|---|---|---|---|
| Button | 12px 20px | 999px | 700 14px IBM Plex Sans |
| Card | 24px | 16px | 16px IBM Plex Sans |
| Status banner | 16px 20px | 16px | 700 16px IBM Plex Sans |
| Alert-feed row | 14px 16px | 10px | 500 14px IBM Plex Sans |
| Countdown timer | 24px 32px | 16px | 700 56px IBM Plex Sans |

## 6. Code

```css
:root {
  --color-background: #0B1B3A;
  --color-background-gradient-top: #0B1B3A;
  --color-background-gradient-mid: #032B73;
  --color-background-gradient-bottom: #078BEB;
  --color-surface: #032B73;
  --color-card: #0351A6;
  --color-card-strong: #036BC8;
  --color-border: #040607;
  --color-border-soft: #3EB5F3;
  --color-text-primary: #F3F5F3;
  --color-text-muted: #AFD0C7;
  --color-text-inverse: #040607;
  --color-primary: #F5D90A;
  --color-primary-hover: #FFE84A;
  --color-danger: #FF3B3B;
  --color-danger-hover: #FF6A5F;
  --color-success: #27C93F;
  --color-success-hover: #48E85D;
  --color-info: #3EB5F3;
  --color-warning: #E59010;
  --color-off-white: #F3F5F3;
  --color-blue-tint-light: #AFD0C7;
  --color-blue-tint-mid: #3EB5F3;
  --color-near-black: #040607;
  --font-display: "Bungee", "Rubik Mono One", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --radius-none: 0px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;
  --border-comic: 3px solid #040607;
  --border-comic-sm: 2px solid #040607;
  --border-info: 2px solid #3EB5F3;
  --shadow-bevel-sm: 4px 4px 0 #040607;
  --shadow-bevel: 8px 8px 0 #040607;
  --shadow-bevel-lg: 14px 14px 0 #040607;
  --shadow-green-glow: 0 0 24px rgba(39, 201, 63, 0.65);
  --shadow-red-glow: 0 0 24px rgba(255, 59, 59, 0.55);
  --shadow-blue-glow: 0 0 18px rgba(62, 181, 243, 0.45);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
body {
  background: linear-gradient(
    180deg,
    var(--color-background-gradient-top) 0%,
    var(--color-background-gradient-mid) 48%,
    var(--color-background-gradient-bottom) 100%
  );
  color: var(--color-text-primary);
  font-family: var(--font-body);
}
.display {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: -0.04em;
}
.numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
```

```js
// tailwind.config.js
const themeExtend = {
  colors: {
    background: "#0B1B3A",
    "background-gradient-top": "#0B1B3A",
    "background-gradient-mid": "#032B73",
    "background-gradient-bottom": "#078BEB",
    surface: "#032B73",
    card: "#0351A6",
    "card-strong": "#036BC8",
    border: "#040607",
    "border-soft": "#3EB5F3",
    "text-primary": "#F3F5F3",
    "text-muted": "#AFD0C7",
    "text-inverse": "#040607",
    primary: "#F5D90A",
    "primary-hover": "#FFE84A",
    danger: "#FF3B3B",
    "danger-hover": "#FF6A5F",
    success: "#27C93F",
    "success-hover": "#48E85D",
    info: "#3EB5F3",
    warning: "#E59010",
    "off-white": "#F3F5F3",
    "blue-tint-light": "#AFD0C7",
    "blue-tint-mid": "#3EB5F3",
    "near-black": "#040607",
  },
  fontFamily: {
    display: ['"Bungee"', '"Rubik Mono One"', "system-ui", "sans-serif"],
    body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
  },
  fontSize: {
    h1: ["64px", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
    h2: ["40px", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
    h3: ["28px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
    "body-lg": ["18px", { lineHeight: "1.5" }],
    body: ["16px", { lineHeight: "1.5" }],
    "body-sm": ["14px", { lineHeight: "1.45", letterSpacing: "0.01em" }],
    caption: ["12px", { lineHeight: "1.35", letterSpacing: "0.06em" }],
    "numeric-lg": ["56px", { lineHeight: "1", letterSpacing: "-0.03em" }],
    numeric: ["24px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
  },
  borderRadius: {
    none: "0px",
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "24px",
    pill: "999px",
  },
  boxShadow: {
    "bevel-sm": "4px 4px 0 #040607",
    bevel: "8px 8px 0 #040607",
    "bevel-lg": "14px 14px 0 #040607",
    "green-glow": "0 0 24px rgba(39, 201, 63, 0.65)",
    "red-glow": "0 0 24px rgba(255, 59, 59, 0.55)",
    "blue-glow": "0 0 18px rgba(62, 181, 243, 0.45)",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
    24: "96px",
  },
  backgroundImage: {
    "brand-gradient": "linear-gradient(180deg, #0B1B3A 0%, #032B73 48%, #078BEB 100%)",
  },
};
module.exports = {
  theme: {
    extend: themeExtend,
  },
};
```

## 7. Mascot usage

- Calm duck appears on idle dashboard screens as the monitoring state mascot.
- Alert duck appears only when a real threat or simulated threat is detected. It must include the speech bubble text `COIN COIN !`.
- Hero duck appears on success screens after funds are evacuated.

Sizing rules:

| Context | Size |
|---|---|
| Header mascot icon | 40px to 56px tall |
| Dashboard side mascot | 160px to 240px tall |
| Empty state mascot | 220px to 320px tall |
| Alert screen mascot | 320px to 460px tall |
| Mobile mascot | Max 42vw, never below 96px tall |

Usage rules:

- Never distort, stretch, crop the beak, remove the red exclamation mark in alert state, recolor the duck away from `#F5D90A`, or place the yellow duck on a yellow background.
- Keep the duck as the only yellow character in illustrations.
- The blue shield medal on the duck chest can be used alone as the app logo, favicon, loading mark, and small wallet safety indicator.

## 8. Voice and microcopy

Voice is friendly, mischievous, clear, and protective. Security copy should reduce anxiety: explain what happened, what coincoin is doing, and what the user can do next. UI copy is in English, but the quack stays `COIN COIN !` verbatim as the brand signature.

| Use case | String |
|---|---|
| Idle status | All quiet. coincoin is watching your wallets. |
| Threat detected | COIN COIN ! Suspicious drain detected. |
| Evacuation in progress | Moving funds to your safe wallet now. |
| Funds safe | Funds safe. The duck did its job. |
| Empty state | No alerts yet. That is exactly what we like to see. |
| Error | Something slipped. coincoin could not complete this action. |
| CTA label 1 | Arm firewall |
| CTA label 2 | Evacuate funds |

## 9. Do and don't

Do:

- Use `#F5D90A` only for the duck, primary CTAs, and critical brand highlights.
- Put yellow elements on dark blue or near-black backgrounds for maximum contrast.
- Use one accent color per screen: yellow for action, red for threat, green for safety, blue for monitoring.
- Keep black comic borders at 2px or 3px on interactive UI.
- Use hard offset shadows instead of soft luxury shadows.

Don't:

- Do not place yellow text on green, white, or light blue backgrounds.
- Do not make the duck scary, aggressive, bloody, realistic, or militarized.
- Do not mix red and green as equal accents on the same screen unless showing before-and-after security states.
- Do not use thin gray borders, glassmorphism, pastel gradients, or minimal fintech styling.
- Do not replace `COIN COIN !` with another quack, slogan, or localized translation.

## 10. Illustrations de la campagne

Série de visuels produits pour le fil X du buildathon (un par jour). Tous en 16:9, même univers comic (canard `#F5D90A`, voleur bleu, fond bleu nuit, briques pixel, lettrage block jaune). Servent aussi de référence de style et de personnages pour générer les suivants.

| Fichier | Sujet | Usage |
|---|---|---|
| [`coincoin-illustration.png`](coincoin-illustration.png) | Canard alerte « COIN COIN ! » devant le coffre, voleur en fuite | Jour 1 : ce que c'est |
| [`eip-7702-flip.png`](eip-7702-flip.png) | Split EIP-7702 : drainer (EOA → SWEEPER) vs coincoin (EOA → GUARDIAN → VAULT), badge « 90%+ ARE SWEEPERS » | Jour 2, tweet 1 : le retournement de primitive |
| [`how-it-works.png`](how-it-works.png) | Pipeline ALERTS → KEEPER → EOA/GUARDIAN → VAULT, badges « ONLY YOUR VAULT » et « REVOCABLE » | Jour 2, tweet 2 : le mécanisme et la garantie |
