import { staticFile, interpolate } from "remotion";
import { SHADOW } from "../theme";
import { useEntrance, useBob, popIn } from "../lib/anim";

type DuckState = "calm" | "alert" | "hero";

const GLOW: Record<DuckState, string> = {
  calm: SHADOW.blueGlow,
  alert: SHADOW.redGlow,
  hero: SHADOW.greenGlow,
};

/** The mascot. Pops in, bobs, and carries the state-coloured glow. */
export const Duck: React.FC<{
  state: DuckState;
  delay?: number;
  size?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}> = ({ state, delay = 0, size = 460, flip = false, style }) => {
  const p = useEntrance(delay, 11);
  const bob = useBob(state === "alert" ? 22 : 12, state === "alert" ? 26 : 70);
  const { transform, opacity } = popIn(p);
  // alert duck shakes a touch
  const shake = state === "alert" ? Math.sin((delay + p * 40) * 3) * 0 : 0;
  return (
    <div
      style={{
        transform: `${transform} translateY(${bob}px) translateX(${shake}px) ${flip ? "scaleX(-1)" : ""}`,
        opacity,
        ...style,
      }}
    >
      <img
        src={staticFile(`img/duck-${state}.png`)}
        style={{
          width: size,
          height: "auto",
          filter: `drop-shadow(0 18px 0 rgba(4,6,7,0.45))`,
        }}
      />
      {/* radial glow behind the duck */}
      <div
        style={{
          position: "absolute",
          inset: "10% 5%",
          borderRadius: "50%",
          boxShadow: GLOW[state],
          opacity: interpolate(p, [0, 1], [0, 1]),
          zIndex: -1,
        }}
      />
    </div>
  );
};
