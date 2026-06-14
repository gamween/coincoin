import { AbsoluteFill } from "remotion";
import { COLORS } from "../../theme";
import { BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Duck } from "../../components/Duck";
import { Wordmark } from "../../components/Wordmark";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, riseIn, useExitFade } from "../../lib/anim";
import { LIVE_URL, REPO_URL } from "../../content";
import type { SceneProps } from "../types";

export const Scene06Close: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const tag = useEntrance(20, 16);
  const meta = useEntrance(40, 16);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.06} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Duck state="hero" delay={2} size={360} />
        <Wordmark size={170} />
        <div
          style={{
            ...riseIn(tag, 40),
            maxWidth: 1280,
            textAlign: "center",
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: 44,
            lineHeight: 1.25,
            color: COLORS.text,
          }}
        >
          The onchain firewall that shouts{" "}
          <span style={{ color: COLORS.primary }}>COIN COIN</span> — and moves your funds to safety on its own.
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center", marginTop: 10, ...riseIn(meta, 30) }}>
          <Pill bg={COLORS.info} color={COLORS.inverse}>Arbitrum Open House London · Robinhood Chain</Pill>
        </div>
        <div style={{ ...riseIn(meta, 30), fontFamily: BODY, fontWeight: 600, fontSize: 32, color: COLORS.textMuted, marginTop: 4 }}>
          {LIVE_URL} &nbsp;·&nbsp; {REPO_URL}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
