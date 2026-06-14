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
        let seconds = d.min;
        let hasAudio = false;
        try {
          const voice = await getAudioDurationInSeconds(staticFile(`audio/${dir}/${d.id}.mp3`));
          seconds = Math.max(d.min, voice + PAD);
          hasAudio = true;
        } catch {
          // no voiceover yet → fall back to the scene's min length
        }
        return { id: d.id, frames: Math.ceil(seconds * FPS), hasAudio };
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

const fallback = (defs: SceneDef[]): CompProps => ({
  scenes: defs.map((d) => ({ id: d.id, frames: Math.ceil(d.min * FPS), hasAudio: false })),
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
      defaultProps={fallback(PITCH)}
      calculateMetadata={makeCalc("pitch", PITCH)}
    />
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={sumFallback(DEMO)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={fallback(DEMO)}
      calculateMetadata={makeCalc("demo", DEMO)}
    />
  </>
);
