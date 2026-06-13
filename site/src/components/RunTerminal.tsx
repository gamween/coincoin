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
const LINE_PAUSE_MS = 200;

/** A single terminal that types out one process's real log — the guardian running live. */
export function RunTerminal({ term }: { term: ProcTerminal }) {
  const reduce = useReducedMotion();
  const [runId, setRunId] = useState(0);
  const [printed, setPrinted] = useState(reduce ? term.lines.length : 0);
  const [partial, setPartial] = useState("");
  const [done, setDone] = useState(!!reduce);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const replay = useCallback(() => {
    clearTimers();
    setPartial("");
    if (reduce) {
      setPrinted(term.lines.length);
      setDone(true);
      return;
    }
    setPrinted(0);
    setDone(false);
    setRunId((r) => r + 1);
  }, [reduce, term.lines.length]);

  useEffect(() => {
    if (reduce) return; // initial state already shows every line
    let lineIdx = 0;
    let charIdx = 0;
    const step = () => {
      if (lineIdx >= term.lines.length) {
        setDone(true);
        return;
      }
      const full = term.lines[lineIdx].text;
      if (charIdx <= full.length) {
        setPartial(full.slice(0, charIdx));
        charIdx += 1;
        timers.current.push(setTimeout(step, CHAR_MS));
        return;
      }
      setPrinted(lineIdx + 1);
      setPartial("");
      lineIdx += 1;
      charIdx = 0;
      timers.current.push(setTimeout(step, LINE_PAUSE_MS));
    };
    timers.current.push(setTimeout(step, 400));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, reduce]);

  const activeTone = printed < term.lines.length ? term.lines[printed]?.tone : "normal";

  return (
    <div className="comic-card overflow-hidden !rounded-lg !border-[3px] !border-success !bg-near-black shadow-bevel-lg">
      <div className="flex items-center gap-3 border-b-[3px] border-success bg-surface px-4 py-2.5">
        <span className="flex gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-border bg-danger" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-warning" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-success" />
        </span>
        <span className="display text-[13px] text-success">{term.title}</span>
        <span className="ml-auto hidden rounded-pill border-2 border-border-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-text-muted sm:inline">
          {term.command}
        </span>
        <button
          type="button"
          onClick={replay}
          aria-label="Replay"
          className="rounded-pill border-2 border-border-soft px-3 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-info transition-colors hover:bg-card"
        >
          ↻
        </button>
      </div>
      <pre className="m-0 min-h-[250px] overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-[12.5px] leading-relaxed sm:text-body-sm">
        {term.lines.slice(0, printed).map((l, i) => (
          <div key={i} className={toneClass[l.tone]}>
            {l.text || " "}
          </div>
        ))}
        {!reduce && !done && (
          <div className={toneClass[activeTone ?? "normal"]}>
            {partial}
            <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.12em] animate-blink bg-primary align-baseline" />
          </div>
        )}
      </pre>
    </div>
  );
}
