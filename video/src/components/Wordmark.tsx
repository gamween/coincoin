import { COLORS } from "../theme";
import { DISPLAY } from "../fonts";

/** The product wordmark "coincoin" (lowercase, display font) + duck dot. */
export const Wordmark: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 120, style }) => (
  <div
    style={{
      fontFamily: DISPLAY,
      fontSize: size,
      color: COLORS.text,
      textTransform: "none",
      letterSpacing: "-0.03em",
      lineHeight: 1,
      textShadow: `6px 6px 0 ${COLORS.outline}`,
      ...style,
    }}
  >
    coin<span style={{ color: COLORS.primary }}>coin</span>
  </div>
);
