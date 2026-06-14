import { AbsoluteFill, Series, Audio, staticFile } from "remotion";
import { GRADIENT } from "./theme";
import { Scene01Hook } from "./scenes/pitch/Scene01Hook";
import { Scene02Gap } from "./scenes/pitch/Scene02Gap";
import { Scene03Enter } from "./scenes/pitch/Scene03Enter";
import { Scene04How } from "./scenes/pitch/Scene04How";
import { Scene05Proof } from "./scenes/pitch/Scene05Proof";
import { Scene06Close } from "./scenes/pitch/Scene06Close";
import type { SceneProps } from "./scenes/types";

export type RenderScene = { id: string; frames: number; hasAudio: boolean };
export type CompProps = { scenes: RenderScene[]; music: boolean };

const COMPONENTS: React.FC<SceneProps>[] = [
  Scene01Hook,
  Scene02Gap,
  Scene03Enter,
  Scene04How,
  Scene05Proof,
  Scene06Close,
];

export const Pitch: React.FC<CompProps> = ({ scenes, music }) => (
  <AbsoluteFill style={{ background: GRADIENT }}>
    <Series>
      {scenes.map((s, i) => {
        const Comp = COMPONENTS[i];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <Comp durationInFrames={s.frames} audio={`audio/pitch/${s.id}.mp3`} hasAudio={s.hasAudio} />
          </Series.Sequence>
        );
      })}
    </Series>
    {music ? <Audio src={staticFile("audio/music.mp3")} volume={0.1} /> : null}
  </AbsoluteFill>
);
