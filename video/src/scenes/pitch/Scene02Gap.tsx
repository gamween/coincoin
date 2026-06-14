import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER } from "../../theme";
import { BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Headline } from "../../components/Headline";
import { SceneAudio } from "../../components/SceneAudio";
import { Sfx } from "../../components/Sfx";
import { useEntrance, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene02Gap: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const frame = useCurrentFrame();
  const bar = useEntrance(20, 16);
  const barFill = interpolate(frame, [28, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chipsP = useEntrance(72, 16);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <Sfx name="whoosh" at={28} volume={0.22} />
      <Sfx name="pop" at={72} volume={0.3} />
      <BrickBackground />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 60, padding: "0 140px" }}>
        <Headline delay={2} size={94} maxWidth={1500}>
          The window nobody<br />tools up
        </Headline>

        {/* timeline bar */}
        <div style={{ width: 1340, ...riseIn(bar, 40) }}>
          <div
            style={{
              position: "relative",
              height: 56,
              background: COLORS.surface,
              border: BORDER,
              borderRadius: RADIUS.pill,
              boxShadow: SHADOW.bevelSm,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${barFill * 100}%`,
                background: `linear-gradient(90deg, ${COLORS.warning}, ${COLORS.danger})`,
                boxShadow: SHADOW.redGlow,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: COLORS.textMuted }}>
            <span>4 min</span>
            <span style={{ color: COLORS.primary }}>← non-atomic response window →</span>
            <span>5 days</span>
          </div>
        </div>

        {/* what existing tools miss */}
        <div style={{ display: "flex", gap: 28, ...riseIn(chipsP, 40) }}>
          <MissChip label="after a compromise" />
          <MissChip label="your DeFi positions" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MissChip: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: COLORS.card,
      border: BORDER,
      borderRadius: RADIUS.lg,
      boxShadow: SHADOW.bevelSm,
      padding: "18px 30px",
      fontFamily: BODY,
      fontWeight: 600,
      fontSize: 32,
      color: COLORS.text,
    }}
  >
    <span style={{ color: COLORS.danger, fontSize: 40, fontWeight: 800 }}>✗</span>
    <span>
      pre-sig tools do <span style={{ color: COLORS.danger, textDecoration: "line-through" }}>nothing</span> for {label}
    </span>
  </div>
);
