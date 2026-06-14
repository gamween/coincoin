import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Springy 0→1 entrance value starting at `delay` frames. */
export const useEntrance = (delay = 0, damping = 14): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7, stiffness: 120 } });
};

/** Slide-up + fade-in transform string driven by a 0→1 progress. */
export const riseIn = (p: number, distance = 60): { transform: string; opacity: number } => ({
  transform: `translateY(${(1 - p) * distance}px)`,
  opacity: p,
});

/** Pop-in scale (slight overshoot) from a 0→1 progress. */
export const popIn = (p: number): { transform: string; opacity: number } => ({
  transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
  opacity: Math.min(1, p * 1.4),
});

/** Gentle continuous bob for mascots. */
export const useBob = (ampPx = 14, periodFrames = 70): number => {
  const frame = useCurrentFrame();
  return Math.sin((frame / periodFrames) * Math.PI * 2) * ampPx;
};

/** Fade out over the last `frames` of a clip of total length `duration`. */
export const useExitFade = (duration: number, frames = 14): number => {
  const frame = useCurrentFrame();
  return interpolate(frame, [duration - frames, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** Count from `from`→`to` over [startFrame, endFrame], eased. */
export const useCounter = (from: number, to: number, startFrame: number, endFrame: number): number => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3);
  return from + (to - from) * eased;
};
