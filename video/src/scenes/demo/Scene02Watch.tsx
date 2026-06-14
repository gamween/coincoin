import { AbsoluteFill } from "remotion";
import { COLORS } from "../../theme";
import { BrickBackground } from "../../components/BrickBackground";
import { Duck } from "../../components/Duck";
import { Terminal } from "../../components/Terminal";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene02Watch: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const pill = useEntrance(40, 16);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground tint={COLORS.info} tintOpacity={0.06} />

      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 70, padding: "0 120px" }}>
        <Duck state="calm" delay={6} size={460} />
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <Terminal
            title="Terminal A — the watcher (the product)"
            width={1020}
            accent={COLORS.info}
            lines={[
              { text: "$ pnpm watch", at: 8, color: COLORS.primary },
              { text: "[coincoin] 👁️  monitoring 0x6e80…80Db on Robinhood Chain", at: 24, color: COLORS.info },
              { text: "[coincoin]     reading on-chain Drained logs (real getLogs)…", at: 48, color: COLORS.textMuted },
            ]}
          />
          <div style={{ ...riseIn(pill, 30) }}>
            <Pill bg={COLORS.info} color={COLORS.inverse}>● Live · calm · waiting</Pill>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
