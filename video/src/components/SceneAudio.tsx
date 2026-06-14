import { Audio, staticFile } from "remotion";

/**
 * Plays a scene's fish.audio voiceover if present. `has` is computed in
 * calculateMetadata (the file is probed there), so we never mount <Audio>
 * with a missing src.
 */
export const SceneAudio: React.FC<{ src?: string; has?: boolean }> = ({ src, has }) => {
  if (!has || !src) return null;
  return <Audio src={staticFile(src)} />;
};
