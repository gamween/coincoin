import { AbsoluteFill } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER, BORDER_THICK } from "../../theme";
import { DISPLAY, BODY, MONO } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Headline } from "../../components/Headline";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { Sfx } from "../../components/Sfx";
import { useEntrance, popIn, riseIn, useExitFade, useCounter } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene05Proof: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const card = useEntrance(16, 12);
  const pills = useEntrance(46, 16);
  const addr = useEntrance(70, 16);
  const exit = useExitFade(durationInFrames);
  const vault = Math.round(useCounter(0, 800, 24, 70));

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <Sfx name="pop" at={46} volume={0.25} />
      <Sfx name="chime" at={66} volume={0.4} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.06} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
        <Headline delay={2} size={84}>Not a mockup.</Headline>

        {/* rescue counter */}
        <div
          style={{
            ...popIn(card),
            display: "flex",
            alignItems: "center",
            gap: 50,
            background: COLORS.card,
            border: BORDER_THICK,
            borderRadius: RADIUS.xl,
            boxShadow: `${SHADOW.bevel}, ${SHADOW.greenGlow}`,
            padding: "30px 56px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Rescued to your vault
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 130, lineHeight: 1, color: COLORS.success, textShadow: `6px 6px 0 ${COLORS.outline}`, fontVariantNumeric: "tabular-nums" }}>
              ${vault}
            </div>
          </div>
          <div style={{ fontFamily: BODY, fontSize: 40, color: COLORS.textMuted }}>
            <span style={{ color: COLORS.text, fontWeight: 700 }}>500</span> at rest
            <br />+ <span style={{ color: COLORS.text, fontWeight: 700 }}>300</span> in Aave
          </div>
        </div>

        {/* proof pills */}
        <div style={{ display: "flex", gap: 22, ...riseIn(pills, 40) }}>
          <Pill bg={COLORS.success} color={COLORS.inverse}>● Live on Robinhood Chain</Pill>
          <Pill bg={COLORS.primary}>90 tests pass</Pill>
          <Pill bg={COLORS.info} color={COLORS.inverse}>Real Aave V3 exit · fork-verified</Pill>
        </div>

        {/* addresses */}
        <div
          style={{
            ...riseIn(addr, 30),
            display: "flex",
            gap: 18,
            fontFamily: MONO,
            fontSize: 24,
            color: COLORS.textMuted,
          }}
        >
          <AddrChip label="GuardianModule" addr="0xd0d3…3b77" />
          <AddrChip label="RulesEngineV1" addr="0xc20A…bc52" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AddrChip: React.FC<{ label: string; addr: string }> = ({ label, addr }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, background: COLORS.surface, border: BORDER, borderRadius: RADIUS.pill, padding: "10px 22px" }}>
    <span style={{ color: COLORS.borderSoft }}>{label}</span>
    <span style={{ color: COLORS.text, fontWeight: 600 }}>{addr}</span>
  </div>
);
