import { AbsoluteFill, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../../theme";
import { DISPLAY, BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Stamp } from "../../components/Stamp";
import { SceneAudio } from "../../components/SceneAudio";
import { Sfx } from "../../components/Sfx";
import { useEntrance, popIn, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene01Hook: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const frame = useCurrentFrame();
  const chest = useEntrance(2, 12);
  const stat = useEntrance(26, 13);
  const sub = useEntrance(40, 16);
  const exit = useExitFade(durationInFrames);
  // red danger pulse as the chest drains
  const redPulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.05, 0.22]);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <Sfx name="boom" at={18} volume={0.45} />
      <Sfx name="whoosh" at={26} volume={0.3} />
      <BrickBackground tint={COLORS.danger} tintOpacity={redPulse} />

      {/* chest + sparks */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", ...popIn(chest) }}>
          <img src={staticFile("img/hero-sparks.png")} style={{ position: "absolute", width: 720, left: -130, top: -120, opacity: 0.9 }} />
          <img src={staticFile("img/hero-chest.png")} style={{ width: 460, filter: "drop-shadow(0 20px 0 rgba(4,6,7,0.5))" }} />
        </div>
      </AbsoluteFill>

      <Stamp kind="boom" delay={18} size={520} rotate={-14} style={{ position: "absolute", top: 90, right: 110 }} />

      {/* stat slam */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              ...popIn(stat),
              fontFamily: DISPLAY,
              fontSize: 200,
              lineHeight: 0.9,
              color: COLORS.primary,
              textShadow: `8px 8px 0 ${COLORS.outline}`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            $83.85M
          </div>
          <div
            style={{
              ...riseIn(sub, 40),
              marginTop: 18,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 46,
              color: COLORS.text,
              letterSpacing: "0.01em",
            }}
          >
            stolen from <span style={{ color: COLORS.danger }}>106,106</span> victims · 2025
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
