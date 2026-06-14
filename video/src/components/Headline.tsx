import { COLORS } from "../theme";
import { DISPLAY } from "../fonts";
import { useEntrance, riseIn } from "../lib/anim";

/** Big uppercase display headline with a springy rise-in. */
export const Headline: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  align?: "left" | "center";
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, size = 88, color = COLORS.text, align = "center", maxWidth, style }) => {
  const p = useEntrance(delay, 15);
  const { transform, opacity } = riseIn(p, 50);
  return (
    <div
      style={{
        transform,
        opacity,
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: "-0.03em",
        textTransform: "uppercase",
        color,
        textAlign: align,
        maxWidth,
        textShadow: `5px 5px 0 ${COLORS.outline}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
