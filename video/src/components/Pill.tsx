import { COLORS, RADIUS, SHADOW } from "../theme";
import { BODY } from "../fonts";

/** Status pill / badge with comic outline. */
export const Pill: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, bg = COLORS.primary, color = COLORS.inverse, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      background: bg,
      color,
      fontFamily: BODY,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "12px 26px",
      borderRadius: RADIUS.pill,
      border: `4px solid ${COLORS.outline}`,
      boxShadow: SHADOW.bevelSm,
      ...style,
    }}
  >
    {children}
  </span>
);
