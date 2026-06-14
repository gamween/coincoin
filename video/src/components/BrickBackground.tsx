import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GRADIENT, COLORS } from "../theme";

/** Brand gradient + subtle slow-scrolling brick tile + vignette. */
export const BrickBackground: React.FC<{ tint?: string; tintOpacity?: number }> = ({
  tint,
  tintOpacity = 0,
}) => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.25) % 256;
  return (
    <AbsoluteFill style={{ background: GRADIENT }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("img/bg-brick-tile.png")})`,
          backgroundSize: "256px 256px",
          backgroundRepeat: "repeat",
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
          opacity: 0.14,
          mixBlendMode: "overlay",
        }}
      />
      {tint ? <AbsoluteFill style={{ background: tint, opacity: tintOpacity }} /> : null}
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 55%, ${COLORS.outline}99 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
