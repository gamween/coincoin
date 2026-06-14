import { AbsoluteFill, staticFile } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER, BORDER_THICK } from "../../theme";
import { DISPLAY, BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Duck } from "../../components/Duck";
import { Wordmark } from "../../components/Wordmark";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, popIn, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene03Enter: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const wm = useEntrance(2, 13);
  const bubble = useEntrance(16, 9);
  const line = useEntrance(34, 16);
  const flip = useEntrance(58, 15);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.05} />

      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 120px", gap: 40 }}>
        {/* mascot + shout */}
        <div style={{ position: "relative", flex: "0 0 620px", display: "flex", justifyContent: "center" }}>
          <Duck state="hero" delay={6} size={560} />
          <div
            style={{
              position: "absolute",
              top: 40,
              right: -10,
              ...popIn(bubble),
              background: COLORS.primary,
              color: COLORS.inverse,
              fontFamily: DISPLAY,
              fontSize: 64,
              padding: "20px 34px",
              borderRadius: RADIUS.lg,
              border: BORDER_THICK,
              boxShadow: SHADOW.bevel,
              transform: `${popIn(bubble).transform} rotate(-6deg)`,
            }}
          >
            COIN COIN!
          </div>
        </div>

        {/* copy */}
        <div style={{ flex: 1 }}>
          <div style={{ ...popIn(wm) }}>
            <Wordmark size={130} />
          </div>
          <div
            style={{
              ...riseIn(line, 40),
              marginTop: 26,
              fontFamily: BODY,
              fontWeight: 600,
              fontSize: 50,
              lineHeight: 1.18,
              color: COLORS.text,
            }}
          >
            A self-custodial onchain firewall that detects the threat and{" "}
            <span style={{ color: COLORS.primary }}>moves your funds to safety — on its own.</span>
          </div>

          {/* eip-7702 flip */}
          <div
            style={{
              ...riseIn(flip, 40),
              marginTop: 38,
              display: "flex",
              alignItems: "center",
              gap: 24,
              background: COLORS.card,
              border: BORDER,
              borderRadius: RADIUS.lg,
              boxShadow: SHADOW.bevelSm,
              padding: "22px 26px",
            }}
          >
            <img src={staticFile("img/eip-7702-flip.png")} style={{ width: 150, borderRadius: 10, border: `3px solid ${COLORS.outline}` }} />
            <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: COLORS.text }}>
              EIP-7702: <span style={{ color: COLORS.danger }}>90% of delegations are sweepers.</span>
              <br /> We turned the attackers' weapon into <span style={{ color: COLORS.success }}>defense.</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
