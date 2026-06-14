import { AbsoluteFill } from "remotion";
import { COLORS, RADIUS, SHADOW } from "../theme";
import { BODY } from "../fonts";
import { useEntrance, riseIn } from "../lib/anim";

/** Lower-third caption strip — mirrors the spoken narration beat. */
export const Caption: React.FC<{ text: string; delay?: number; accent?: string }> = ({
  text,
  delay = 6,
  accent = COLORS.primary,
}) => {
  const p = useEntrance(delay, 16);
  const { transform, opacity } = riseIn(p, 40);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div
        style={{
          transform,
          opacity,
          maxWidth: 1400,
          textAlign: "center",
          background: "rgba(3,43,115,0.86)",
          border: `4px solid ${COLORS.outline}`,
          borderLeft: `12px solid ${accent}`,
          borderRadius: RADIUS.md,
          boxShadow: SHADOW.bevelSm,
          padding: "18px 34px",
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 34,
          lineHeight: 1.35,
          color: COLORS.text,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
