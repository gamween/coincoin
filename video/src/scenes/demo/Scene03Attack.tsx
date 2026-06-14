import { AbsoluteFill, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../../theme";
import { BrickBackground } from "../../components/BrickBackground";
import { Terminal } from "../../components/Terminal";
import { Stamp } from "../../components/Stamp";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, popIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

const DRAIN_AT = 58;

export const Scene03Attack: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const frame = useCurrentFrame();
  const thief = useEntrance(6, 12);
  const exit = useExitFade(durationInFrames);
  const flash = interpolate(frame, [DRAIN_AT, DRAIN_AT + 4, DRAIN_AT + 20], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground tint={COLORS.danger} tintOpacity={0.08} />

      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 60, padding: "0 110px" }}>
        <div style={{ ...popIn(thief) }}>
          <img src={staticFile("img/hero-thief.png")} style={{ width: 460, filter: "drop-shadow(0 18px 0 rgba(4,6,7,0.5))" }} />
        </div>
        <Terminal
          title="Terminal B — the attacker (the only simulated actor)"
          width={1040}
          accent={COLORS.danger}
          lines={[
            { text: "$ pnpm exploit", at: 8, color: COLORS.primary },
            { text: "[exploit] protocol balance before: 1000 dUSD", at: 26, color: COLORS.textMuted },
            { text: "[exploit] 💥 drained 1000 dUSD from 0x6e80…80Db", at: DRAIN_AT, color: COLORS.danger },
            { text: "[exploit]    → real Drained log emitted on-chain", at: DRAIN_AT + 18, color: COLORS.text },
          ]}
        />
      </AbsoluteFill>

      <Stamp kind="boom" delay={DRAIN_AT} size={460} rotate={10} style={{ position: "absolute", top: 120, right: 140 }} />
      <AbsoluteFill style={{ background: COLORS.danger, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
