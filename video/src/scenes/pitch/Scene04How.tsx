import { AbsoluteFill, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER_THICK } from "../../theme";
import { BODY } from "../../fonts";
import { BrickBackground } from "../../components/BrickBackground";
import { Headline } from "../../components/Headline";
import { Pill } from "../../components/Pill";
import { SceneAudio } from "../../components/SceneAudio";
import { useEntrance, popIn, riseIn, useExitFade } from "../../lib/anim";
import type { SceneProps } from "../types";

const STEPS = [
  { icon: "eoa", title: "Your account", sub: "delegated via EIP-7702", color: COLORS.info },
  { icon: "keeper", title: "Guardian acts", sub: "exit DeFi → sweep tokens", color: COLORS.primary },
  { icon: "vault", title: "Your vault", sub: "funds only you control", color: COLORS.success },
];

export const Scene04How: React.FC<SceneProps> = ({ durationInFrames, audio, hasAudio }) => {
  const frame = useCurrentFrame();
  const pillsP = useEntrance(78, 16);
  const exit = useExitFade(durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <SceneAudio src={audio} has={hasAudio} />
      <BrickBackground />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 70 }}>
        <Headline delay={2} size={88}>How it works</Headline>

        {/* flow */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {STEPS.map((s, i) => (
            <Step key={s.icon} step={s} delay={18 + i * 18} arrow={i < STEPS.length - 1} arrowAt={30 + i * 18} frame={frame} />
          ))}
        </div>

        {/* differentiators */}
        <div style={{ display: "flex", gap: 26, ...riseIn(pillsP, 40) }}>
          <Pill bg={COLORS.primary}>At rest + in DeFi</Pill>
          <Pill bg={COLORS.info} color={COLORS.inverse}>Frozen vault</Pill>
          <Pill bg={COLORS.success} color={COLORS.inverse}>100% non-custodial</Pill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Step: React.FC<{
  step: { icon: string; title: string; sub: string; color: string };
  delay: number;
  arrow: boolean;
  arrowAt: number;
  frame: number;
}> = ({ step, delay, arrow, arrowAt, frame }) => {
  const p = useEntrance(delay, 12);
  const arrowP = interpolate(frame, [arrowAt, arrowAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          ...popIn(p),
          width: 300,
          background: COLORS.card,
          border: BORDER_THICK,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOW.bevel,
          padding: "30px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            margin: "0 auto 18px",
            borderRadius: RADIUS.lg,
            background: COLORS.surface,
            border: `4px solid ${step.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={staticFile(`img/icons/${step.icon}.png`)} style={{ width: 86, height: 86, objectFit: "contain" }} />
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: COLORS.text }}>{step.title}</div>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, color: COLORS.textMuted, marginTop: 6 }}>{step.sub}</div>
      </div>
      {arrow ? (
        <div style={{ width: 90, textAlign: "center", color: COLORS.primary, fontSize: 70, fontWeight: 900, opacity: arrowP, transform: `translateX(${(arrowP - 1) * 20}px)` }}>
          →
        </div>
      ) : null}
    </>
  );
};
