import { useReducedMotion } from "framer-motion";

const ITEMS = [
  "$83.85M DRAINED IN 2025",
  "106,106 VICTIMS",
  "90%+ ARE SWEEPERS",
  "EIP-7702, FLIPPED",
  "DUCK ON GUARD",
  "ONLY YOUR VAULT",
  "100% NON-CUSTODIAL",
  "REVOCABLE ANYTIME",
];

function Sequence({ tone }: { tone: "a" | "b" }) {
  return (
    <>
      {ITEMS.map((t, i) => (
        <span key={`${tone}-${i}`} className="flex shrink-0 items-center gap-4">
          <span
            className={`font-body text-body-sm font-bold uppercase tracking-[0.08em] ${
              i % 2 === 0 ? "text-primary" : "text-info"
            }`}
          >
            {t}
          </span>
          <span aria-hidden="true" className="text-text-muted">
            🦆
          </span>
        </span>
      ))}
    </>
  );
}

/** Neo-brutalist scrolling ticker. Two copies for a seamless loop; pauses on hover; static under reduced motion. */
export function Marquee() {
  const reduce = useReducedMotion();
  return (
    <div className="relative overflow-hidden border-y-[3px] border-border bg-near-black py-3" aria-hidden="true">
      <div
        className={`flex w-max items-center gap-4 pl-4 ${
          reduce ? "" : "animate-marquee hover:[animation-play-state:paused]"
        }`}
      >
        <Sequence tone="a" />
        {!reduce && <Sequence tone="b" />}
      </div>
    </div>
  );
}
