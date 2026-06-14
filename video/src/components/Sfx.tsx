import { Audio, Sequence, staticFile } from "remotion";
import { SFX_GAIN } from "../audio";

type SfxName = "boom" | "pop" | "whoosh" | "alert" | "chime";

/** One-shot sound effect fired at a scene-local frame. Committed assets
 * (tools/gen-audio.mjs), so they're always present at render time. */
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.5 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`audio/sfx/${name}.mp3`)} volume={Math.max(0, volume * SFX_GAIN)} />
  </Sequence>
);
