// Brand tokens — mirror of docs/brand/BRAND.md, as plain TS for Remotion.
export const COLORS = {
  bg: "#0B1B3A",
  bgBottom: "#078BEB",
  surface: "#032B73",
  card: "#0351A6",
  cardStrong: "#036BC8",
  outline: "#040607",
  borderSoft: "#3EB5F3",
  text: "#F3F5F3",
  textMuted: "#AFD0C7",
  inverse: "#040607",
  primary: "#F5D90A", // duck yellow
  primaryHover: "#FFE84A",
  danger: "#FF3B3B",
  dangerHover: "#FF6A5F",
  success: "#27C93F",
  successHover: "#48E85D",
  info: "#3EB5F3",
  warning: "#E59010",
} as const;

export const GRADIENT = `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.surface} 48%, ${COLORS.bgBottom} 100%)`;

export const SHADOW = {
  bevel: `12px 12px 0 ${COLORS.outline}`,
  bevelLg: `18px 18px 0 ${COLORS.outline}`,
  bevelSm: `6px 6px 0 ${COLORS.outline}`,
  greenGlow: "0 0 60px rgba(39, 201, 63, 0.65)",
  redGlow: "0 0 60px rgba(255, 59, 59, 0.55)",
  blueGlow: "0 0 48px rgba(62, 181, 243, 0.5)",
  yellowGlow: "0 0 56px rgba(245, 217, 10, 0.55)",
} as const;

export const RADIUS = {
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// Comic outline shorthand
export const BORDER = `4px solid ${COLORS.outline}`;
export const BORDER_THICK = `6px solid ${COLORS.outline}`;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
