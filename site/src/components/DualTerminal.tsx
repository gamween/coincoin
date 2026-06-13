import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { ProcTerminal, TermLine } from "../data";

const toneClass: Record<TermLine["tone"], string> = {
  cmd: "text-info font-bold",
  muted: "text-text-muted",
  normal: "text-text-primary",
  warn: "text-warning font-bold",
  danger: "text-danger font-bold",
  success: "text-success font-bold",
};

const CHAR_MS = 12;
const LINE_PAUSE_MS = 180;
const HANDOFF_MS = 750; // beat between the attacker finishing and the guardian reacting

type Stream = "A" | "B";

/** Two genuinely separate processes, side by side: the attacker fires, then the guardian —
 *  watching the chain on its own — detects the same Drained log and evacuates. */
export function DualTerminal({
  attacker,
  guardian,
  guardianSuccessIndex,
  onSuccess,
  onReplay,
}: {
  attacker: ProcTerminal;
  guardian: ProcTerminal;
  guardianSuccessIndex: number;
  onSuccess?: () => void;
  onReplay?: () => void;
}) {
  const reduce = useReducedMotion();
  const [runId, setRunId] = useState(0);
  const [printedA, setPrintedA] = useState(reduce ? attacker.lines.length : 0);
  const [printedB, setPrintedB] = useState(reduce ? guardian.lines.length : 0);
  const [partial, setPartial] = useState("");
  const [active, setActive] = useState<Stream | null>(reduce ? null : "A");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firedSuccess = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const replay = useCallback(() => {
    clearTimers();
    firedSuccess.current = false;
    onReplay?.();
    setPrintedA(0);
    setPrintedB(0);
    setPartial("");
    setActive("A");
    setRunId((r) => r + 1);
  }, [onReplay]);

  useEffect(() => {
    if (reduce) {
      if (!firedSuccess.current) {
        firedSuccess.current = true;
        onSuccess?.();
      }
      return;
    }
    let stream: Stream = "A";
    let lineIdx = 0;
    let charIdx = 0;

    const step = () => {
      const lines = stream === "A" ? attacker.lines : guardian.lines;
      if (lineIdx >= lines.length) {
        if (stream === "A") {
          // hand off to the guardian after a visible beat
          stream = "B";
          lineIdx = 0;
          charIdx = 0;
          setActive("B");
          timers.current.push(setTimeout(step, HANDOFF_MS));
        } else {
          setActive(null);
        }
        return;
      }
      const full = lines[lineIdx].text;
      if (charIdx <= full.length) {
        setPartial(full.slice(0, charIdx));
        charIdx += 1;
        timers.current.push(setTimeout(step, CHAR_MS));
        return;
      }
      // line complete
      if (stream === "A") setPrintedA(lineIdx + 1);
      else setPrintedB(lineIdx + 1);
      setPartial("");
      if (stream === "B" && lineIdx === guardianSuccessIndex && !firedSuccess.current) {
        firedSuccess.current = true;
        onSuccess?.();
      }
      lineIdx += 1;
      charIdx = 0;
      timers.current.push(setTimeout(step, LINE_PAUSE_MS));
    };

    timers.current.push(setTimeout(step, 450));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, reduce]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-caption uppercase tracking-wide text-text-muted">
          Two separate processes · one chain
        </span>
        <button
          type="button"
          onClick={replay}
          className="rounded-pill border-2 border-border-soft px-3 py-1 font-mono text-caption font-semibold uppercase tracking-wide text-info transition-colors hover:bg-card"
        >
          ↻ Replay
        </button>
      </div>

      <div className="relative grid gap-5 lg:grid-cols-2">
        <Panel
          term={attacker}
          printed={printedA}
          partial={active === "A" ? partial : ""}
          showCursor={active === "A"}
          reduce={!!reduce}
        />
        <Panel
          term={guardian}
          printed={printedB}
          partial={active === "B" ? partial : ""}
          showCursor={active === "B"}
          reduce={!!reduce}
        />

        {/* connecting cue: the guardian reacts to the attacker's on-chain event */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-pill border-[3px] border-border bg-off-white px-3 py-1 shadow-bevel-sm lg:inline-block"
        >
          <span className="display text-[12px] text-text-inverse">🦆 reacts →</span>
        </span>
      </div>
    </div>
  );
}

function Panel({
  term,
  printed,
  partial,
  showCursor,
  reduce,
}: {
  term: ProcTerminal;
  printed: number;
  partial: string;
  showCursor: boolean;
  reduce: boolean;
}) {
  const accent = term.accent === "danger" ? "border-danger" : "border-success";
  const accentText = term.accent === "danger" ? "text-danger" : "text-success";
  const activeTone = printed < term.lines.length ? term.lines[printed]?.tone : "normal";
  return (
    <div className={`comic-card overflow-hidden !rounded-lg !border-[3px] ${accent} !bg-near-black shadow-bevel-lg`}>
      {/* title bar */}
      <div className={`flex items-center gap-3 border-b-[3px] ${accent} bg-surface px-4 py-2.5`}>
        <span className="flex gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-border bg-danger" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-warning" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-success" />
        </span>
        <span className={`display text-[13px] ${accentText}`}>{term.title}</span>
        <span className="ml-auto rounded-pill border-2 border-border-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-text-muted">
          {term.command}
        </span>
      </div>

      <p className="border-b-[3px] border-surface bg-near-black px-4 py-2 font-body text-[12px] leading-snug text-text-muted">
        {term.role}
      </p>

      <pre
        className="m-0 min-h-[230px] overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-[12.5px] leading-relaxed sm:text-body-sm"
      >
        {term.lines.slice(0, printed).map((l, i) => (
          <div key={i} className={toneClass[l.tone]}>
            {l.text || " "}
          </div>
        ))}
        {!reduce && showCursor && (
          <div className={toneClass[activeTone ?? "normal"]}>
            {partial}
            <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.12em] animate-blink bg-primary align-baseline" />
          </div>
        )}
      </pre>
    </div>
  );
}
