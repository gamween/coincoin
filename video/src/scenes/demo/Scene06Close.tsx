import { AbsoluteFill } from "remotion";
import { COLORS } from "../../theme";
import { BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Duck } from "../../components/Duck";
import { Wordmark } from "../../components/Wordmark";
import { Terminal } from "../../components/Terminal";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, riseIn, useExitFade } from "../../lib/anim";
import { REPO_URL } from "../../content";
import type { SceneProps } from "../types";

export const Scene06Close: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const wm = useEntrance(48, 13);
  const meta = useEntrance(64, 16);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.05} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 36 }}>
        <Terminal
          title="$ pnpm revoke"
          width={1000}
          accent={COLORS.primary}
          lines={[
            { text: "$ pnpm revoke", at: 8, color: COLORS.primary },
            { text: "[revoke] removing 7702 delegation…", at: 22, color: COLORS.textMuted },
            { text: "[revoke] ✅ delegation removed — 1 transaction", at: 38, color: COLORS.success },
          ]}
        />

        <div style={{ ...riseIn(wm, 30), display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Wordmark size={130} />
          <Pill bg={COLORS.success} color={COLORS.inverse} style={{ fontSize: 32, padding: "14px 32px" }}>
            100% non-custodial · your funds, your keys
          </Pill>
        </div>

        <div style={{ ...riseIn(meta, 30), fontFamily: BODY, fontWeight: 600, fontSize: 30, color: COLORS.textMuted }}>
          {REPO_URL}
        </div>
      </AbsoluteFill>

      <Duck state="hero" delay={2} size={260} style={{ position: "absolute", bottom: 40, right: 90 }} />
    </AbsoluteFill>
  );
};
