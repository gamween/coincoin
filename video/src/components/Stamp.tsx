import { staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type StampKind = "boom" | "pow";

/** Comic stamp (BOOM/POW) that slams in with an overshoot + slight wobble. */
export const Stamp: React.FC<{
  kind: StampKind;
  delay?: number;
  size?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ kind, delay = 0, size = 420, rotate = -12, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 9, mass: 0.6, stiffness: 200 } });
  const scale = interpolate(s, [0, 1], [2.4, 1]);
  const wobble = Math.sin((frame - delay) / 6) * interpolate(s, [0, 1], [6, 0.6]);
  return (
    <img
      src={staticFile(`img/${kind}-stamp.png`)}
      style={{
        width: size,
        height: "auto",
        transform: `scale(${scale}) rotate(${rotate + wobble}deg)`,
        opacity: Math.min(1, s * 2),
        filter: "drop-shadow(8px 8px 0 rgba(4,6,7,0.6))",
        ...style,
      }}
    />
  );
};
