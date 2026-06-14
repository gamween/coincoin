import { AbsoluteFill, staticFile } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER, BORDER_THICK } from "../../theme";
import { BODY, MONO } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Headline } from "../../components/Headline";
import { Terminal } from "../../components/Terminal";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, popIn, riseIn, useExitFade } from "../../lib/anim";
import { VICTIM_SHORT } from "../../content";
import type { SceneProps } from "../types";

export const Scene01Setup: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const cardP = useEntrance(14, 12);
  const onboardP = useEntrance(54, 14);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground />

      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 80, gap: 44 }}>
        <Headline delay={2} size={76}>Meet the user</Headline>

        <div style={{ display: "flex", gap: 50, alignItems: "center" }}>
          {/* account card */}
          <div
            style={{
              ...popIn(cardP),
              width: 720,
              background: COLORS.card,
              border: BORDER_THICK,
              borderRadius: RADIUS.xl,
              boxShadow: SHADOW.bevel,
              padding: 36,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <img src={staticFile("img/icons/eoa.png")} style={{ width: 60, height: 60 }} />
              <div>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: COLORS.text }}>Protected account</div>
                <div style={{ fontFamily: MONO, fontSize: 26, color: COLORS.borderSoft }}>{VICTIM_SHORT}</div>
              </div>
            </div>
            <BalanceRow label="Idle in wallet" amount="500 dUSD" />
            <BalanceRow label="Deposited in Aave" amount="300 dUSD" accent={COLORS.info} />
          </div>

          {/* onboarding terminal */}
          <div style={{ ...riseIn(onboardP, 40) }}>
            <Terminal
              title="$ pnpm onboard"
              width={760}
              fontSize={24}
              lines={[
                { text: "$ pnpm onboard", at: 56, color: COLORS.primary },
                { text: `[onboard] 7702 delegation ${VICTIM_SHORT} → coincoin`, at: 70, color: COLORS.textMuted },
                { text: "[onboard] ✅ delegated + configured", at: 92, color: COLORS.success },
                { text: "           vault locked · keeper armed", at: 108, color: COLORS.text },
              ]}
            />
          </div>
        </div>

        <div style={{ ...riseIn(onboardP, 30) }}>
          <Pill bg={COLORS.primary}>One command · EIP-7702 delegation</Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BalanceRow: React.FC<{ label: string; amount: string; accent?: string }> = ({ label, amount, accent = COLORS.primary }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: COLORS.surface,
      border: BORDER,
      borderRadius: RADIUS.md,
      padding: "18px 24px",
      marginTop: 14,
    }}
  >
    <span style={{ fontFamily: BODY, fontWeight: 500, fontSize: 30, color: COLORS.textMuted }}>{label}</span>
    <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 34, color: accent, fontVariantNumeric: "tabular-nums" }}>{amount}</span>
  </div>
);
