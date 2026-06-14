import { COLORS, RADIUS, BORDER_THICK, SHADOW } from "../theme";

/** Comic card: flat fill, thick outline, hard bevel shadow. */
export const BevelCard: React.FC<{
  children: React.ReactNode;
  bg?: string;
  shadow?: string;
  border?: string;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ children, bg = COLORS.card, shadow = SHADOW.bevel, border = BORDER_THICK, radius = RADIUS.xl, style }) => (
  <div
    style={{
      background: bg,
      border,
      borderRadius: radius,
      boxShadow: shadow,
      ...style,
    }}
  >
    {children}
  </div>
);
