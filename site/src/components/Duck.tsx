import { useState } from "react";

type DuckState = "calm" | "alert" | "hero";

const SRC: Record<DuckState, string> = {
  calm: "/duck-calm.png",
  alert: "/duck-alert.png",
  hero: "/duck-hero.png",
};
const ALT: Record<DuckState, string> = {
  calm: "The coincoin duck, calm, watching your wallets",
  alert: "The coincoin duck shouting COIN COIN! as a threat is detected",
  hero: "The coincoin duck, triumphant — funds are safe",
};

/**
 * State-driven mascot. The standalone duck PNGs (duck-alert/calm/hero.png) live in /public;
 * the onError fallback keeps a section safe if one is ever missing.
 */
export function Duck({ state, className = "" }: { state: DuckState; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={SRC[state]}
      alt={ALT[state]}
      className={className}
      loading="lazy"
      onError={() => setOk(false)}
    />
  );
}
