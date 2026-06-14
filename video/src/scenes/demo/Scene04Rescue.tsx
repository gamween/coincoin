import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER_THICK } from "../../theme";
import { DISPLAY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Duck } from "../../components/Duck";
import { Terminal } from "../../components/Terminal";
import { SceneAudio } from "../../components/SceneAudio";
import { Sfx } from "../../components/Sfx";
import { useEntrance, popIn, useExitFade } from "../../lib/anim";
import { VICTIM_SHORT, TX_EXIT, TX_EVAC } from "../../content";
import type { SceneProps } from "../types";

const COINCOIN_AT = 14;
const EVAC_AT = 86;

export const Scene04Rescue: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const frame = useCurrentFrame();
  const bubble = useEntrance(COINCOIN_AT, 9);
  const exit = useExitFade(durationInFrames);
  const greenFlash = interpolate(frame, [EVAC_AT, EVAC_AT + 5, EVAC_AT + 26], [0, 0.45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <Sfx name="pop" at={COINCOIN_AT} volume={0.45} />
      <Sfx name="chime" at={EVAC_AT} volume={0.45} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.06} />

      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 60, padding: "0 110px" }}>
        <div style={{ position: "relative" }}>
          <Duck state="hero" delay={COINCOIN_AT - 4} size={500} />
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -40,
              ...popIn(bubble),
              background: COLORS.danger,
              color: COLORS.text,
              fontFamily: DISPLAY,
              fontSize: 58,
              padding: "18px 30px",
              borderRadius: RADIUS.lg,
              border: BORDER_THICK,
              boxShadow: SHADOW.bevel,
              transform: `${popIn(bubble).transform} rotate(8deg)`,
            }}
          >
            COIN COIN!
          </div>
        </div>

        <Terminal
          title="Terminal A — detection → rescue"
          width={1040}
          accent={COLORS.success}
          lines={[
            { text: `[coincoin] 🦆 COIN COIN ! threat detected → rescuing ${VICTIM_SHORT}`, at: COINCOIN_AT, color: COLORS.primary },
            { text: `[coincoin] ↩️  exited Aave position (tx ${TX_EXIT})`, at: 50, color: COLORS.info },
            { text: `[coincoin] ✅ evacuated to your vault (tx ${TX_EVAC})`, at: EVAC_AT, color: COLORS.success },
            { text: "[coincoin]    no human in the loop.", at: EVAC_AT + 22, color: COLORS.text, dim: true },
          ]}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: COLORS.success, opacity: greenFlash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
