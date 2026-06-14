// Per-scene fallback length in SECONDS. This is also a floor: with a voiceover
// present, the scene runs for max(min, voiceLength + PAD). Without audio, `min`
// keeps every animation fully on screen so the silent cut still reads.
export type SceneDef = { id: string; min: number };

export const PITCH: SceneDef[] = [
  { id: "01", min: 7 }, // hook / stat
  { id: "02", min: 13 }, // the gap
  { id: "03", min: 13 }, // enter coincoin
  { id: "04", min: 14 }, // how it works
  { id: "05", min: 13 }, // proof
  { id: "06", min: 9 }, // close
];

export const DEMO: SceneDef[] = [
  { id: "01", min: 12 }, // setup + onboard
  { id: "02", min: 9 }, // watch
  { id: "03", min: 9 }, // attack
  { id: "04", min: 13 }, // rescue
  { id: "05", min: 13 }, // proof
  { id: "06", min: 10 }, // close + revoke
];

export const PAD = 0.6; // seconds of breathing room after each voiceover line
