import { loadFont as loadBungee } from "@remotion/google-fonts/Bungee";
import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

// Display (uppercase headlines), body, and terminal mono.
export const { fontFamily: DISPLAY } = loadBungee();
export const { fontFamily: BODY } = loadSans("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
