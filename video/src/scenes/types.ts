export type SceneProps = {
  /** This scene's length in frames (for exit fades / local timing). */
  durationInFrames: number;
  /** staticFile-relative path to this scene's voiceover, e.g. "audio/pitch/01.mp3". */
  audio: string;
  /** Whether that audio file exists (probed in calculateMetadata). */
  hasAudio: boolean;
};
