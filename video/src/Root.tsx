import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { FPS, WIDTH, HEIGHT } from "./theme";
import { PITCH, DEMO, PAD, type SceneDef } from "./manifest";
import { Pitch, type CompProps } from "./Pitch";
import { Demo } from "./Demo";

/** Probe each scene's voiceover; size scenes to max(min, voice+PAD); sum total. */
const makeCalc =
  (dir: "pitch" | "demo", defs: SceneDef[]) =>
  async (): Promise<{ durationInFrames: number; props: CompProps }> => {
    const scenes = await Promise.all(
      defs.map(async (d) => {
        // Accept both zero-padded (01.mp3) and bare (1.mp3) fish.audio exports.
        const candidates = [`audio/${dir}/${d.id}.mp3`, `audio/${dir}/${parseInt(d.id, 10)}.mp3`];
        let seconds = d.min;
        let hasAudio = false;
        let audio = candidates[0];
        for (const c of candidates) {
          try {
            const voice = await getAudioDurationInSeconds(staticFile(c));
            seconds = Math.max(d.min, voice + PAD);
            audio = c;
            hasAudio = true;
            break;
          } catch {
            // try the next naming variant
          }
        }
        return { id: d.id, audio, frames: Math.ceil(seconds * FPS), hasAudio };
      }),
    );

    let music = false;
    try {
      await getAudioDurationInSeconds(staticFile("audio/music.mp3"));
      music = true;
    } catch {
      // optional background track absent
    }

    const durationInFrames = scenes.reduce((sum, s) => sum + s.frames, 0);
    return { durationInFrames, props: { scenes, music } };
  };

const fallback = (dir: "pitch" | "demo", defs: SceneDef[]): CompProps => ({
  scenes: defs.map((d) => ({ id: d.id, audio: `audio/${dir}/${d.id}.mp3`, frames: Math.ceil(d.min * FPS), hasAudio: false })),
  music: false,
});

const sumFallback = (defs: SceneDef[]) => defs.reduce((s, d) => s + Math.ceil(d.min * FPS), 0);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Pitch"
      component={Pitch}
      durationInFrames={sumFallback(PITCH)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={fallback("pitch", PITCH)}
      calculateMetadata={makeCalc("pitch", PITCH)}
    />
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={sumFallback(DEMO)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={fallback("demo", DEMO)}
      calculateMetadata={makeCalc("demo", DEMO)}
    />
  </>
);
