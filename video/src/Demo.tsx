import { AbsoluteFill, Series, Audio, staticFile } from "remotion";
import { GRADIENT } from "./theme";
import { Scene01Setup } from "./scenes/demo/Scene01Setup";
import { Scene02Watch } from "./scenes/demo/Scene02Watch";
import { Scene03Attack } from "./scenes/demo/Scene03Attack";
import { Scene04Rescue } from "./scenes/demo/Scene04Rescue";
import { Scene05Proof } from "./scenes/demo/Scene05Proof";
import { Scene06Close } from "./scenes/demo/Scene06Close";
import type { SceneProps } from "./scenes/types";
import type { CompProps } from "./Pitch";

const COMPONENTS: React.FC<SceneProps>[] = [
  Scene01Setup,
  Scene02Watch,
  Scene03Attack,
  Scene04Rescue,
  Scene05Proof,
  Scene06Close,
];

export const Demo: React.FC<CompProps> = ({ scenes, music }) => (
  <AbsoluteFill style={{ background: GRADIENT }}>
    <Series>
      {scenes.map((s, i) => {
        const Comp = COMPONENTS[i];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames}>
            <Comp durationInFrames={s.frames} audio={`audio/demo/${s.id}.mp3`} hasAudio={s.hasAudio} />
          </Series.Sequence>
        );
      })}
    </Series>
    {music ? <Audio src={staticFile("audio/music.mp3")} volume={0.1} /> : null}
  </AbsoluteFill>
);
