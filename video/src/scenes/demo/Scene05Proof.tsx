import { AbsoluteFill } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER, BORDER_THICK } from "../../theme";
import { DISPLAY, BODY, MONO } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Headline } from "../../components/Headline";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { Sfx } from "../../components/Sfx";
import { useEntrance, popIn, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

export const Scene05Proof: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const status = useEntrance(14, 11);
  const tiles = useEntrance(30, 13);
  const fw = useEntrance(62, 14);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <Sfx name="chime" at={14} volume={0.4} />
      <Sfx name="pop" at={30} volume={0.25} />
      <BrickBackground tint={COLORS.success} tintOpacity={0.05} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 38 }}>
        <Headline delay={2} size={74}>The result, on-chain</Headline>

        <div style={{ ...popIn(status) }}>
          <Pill bg={COLORS.success} color={COLORS.inverse} style={{ fontSize: 34, padding: "16px 36px" }}>
            ✓ Account protected
          </Pill>
        </div>

        {/* balance tiles */}
        <div style={{ display: "flex", gap: 28, ...riseIn(tiles, 40) }}>
          <Tile label="Wallet" value="0" unit="dUSD" color={COLORS.textMuted} note="swept" />
          <Tile label="Your vault" value="800" unit="dUSD" color={COLORS.success} note="rescued" glow />
          <Tile label="Aave position" value="0" unit="dUSD" color={COLORS.textMuted} note="unwound" />
        </div>

        {/* firewall card */}
        <div
          style={{
            ...riseIn(fw, 40),
            display: "flex",
            alignItems: "center",
            gap: 26,
            width: 1180,
            background: COLORS.card,
            border: BORDER_THICK,
            borderRadius: RADIUS.xl,
            boxShadow: SHADOW.bevel,
            padding: "26px 36px",
          }}
        >
          <div style={{ fontSize: 60 }}>🛡️</div>
          <div style={{ flex: 1, fontFamily: BODY, fontSize: 32, color: COLORS.text }}>
            Firewall · malicious <span style={{ fontFamily: MONO, color: COLORS.warning }}>setApprovalForAll(…, true)</span> to an untrusted operator
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 36, color: COLORS.danger, textShadow: `3px 3px 0 ${COLORS.outline}` }}>
            REVERTED
          </div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: COLORS.textMuted }}>score 100</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Tile: React.FC<{ label: string; value: string; unit: string; color: string; note: string; glow?: boolean }> = ({
  label,
  value,
  unit,
  color,
  note,
  glow,
}) => (
  <div
    style={{
      width: 374,
      background: COLORS.surface,
      border: BORDER_THICK,
      borderRadius: RADIUS.xl,
      boxShadow: glow ? `${SHADOW.bevel}, ${SHADOW.greenGlow}` : SHADOW.bevel,
      padding: "26px 30px",
      textAlign: "center",
    }}
  >
    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    <div style={{ fontFamily: DISPLAY, fontSize: 96, lineHeight: 1, color, textShadow: `5px 5px 0 ${COLORS.outline}`, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    <div style={{ fontFamily: MONO, fontSize: 24, color: COLORS.textMuted }}>{unit}</div>
    <div style={{ marginTop: 10, display: "inline-block", fontFamily: BODY, fontWeight: 600, fontSize: 22, color: COLORS.inverse, background: glow ? COLORS.success : COLORS.borderSoft, padding: "4px 16px", borderRadius: RADIUS.pill, border: BORDER }}>{note}</div>
  </div>
);
