import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { TermLine } from "../data";

const toneClass: Record<TermLine["tone"], string> = {
  prompt: "text-info",
  muted: "text-text-muted",
  info: "text-text-primary",
  alert: "text-danger font-bold",
  success: "text-success font-bold",
};

const CHAR_MS = 18;
const LINE_PAUSE_MS = 320;

export function Terminal({
  lines,
  successIndex,
  onSuccess,
  onReplay,
  title = "coincoin watch — Robinhood Chain Testnet",
}: {
  lines: TermLine[];
  successIndex: number;
  onSuccess?: () => void;
  onReplay?: () => void;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const [runId, setRunId] = useState(0);
  // How many lines are fully printed, and the partial text of the line in progress.
  const [printed, setPrinted] = useState(reduce ? lines.length : 0);
  const [partial, setPartial] = useState("");
  const [finished, setFinished] = useState(reduce);
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
    setPrinted(0);
    setPartial("");
    setFinished(false);
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
    let lineIdx = 0;
    let charIdx = 0;

    const step = () => {
      if (lineIdx >= lines.length) {
        setFinished(true);
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
      setPrinted(lineIdx + 1);
      setPartial("");
      if (lineIdx === successIndex && !firedSuccess.current) {
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

  const activeTone = printed < lines.length ? lines[printed]?.tone : "info";

  return (
    <div className="comic-card overflow-hidden !rounded-lg border-[3px] !bg-near-black shadow-bevel-lg">
      {/* title bar */}
      <div className="flex items-center gap-3 border-b-[3px] border-border bg-surface px-4 py-2.5">
        <span className="flex gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-border bg-danger" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-warning" />
          <span className="h-3 w-3 rounded-full border-2 border-border bg-success" />
        </span>
        <span className="font-mono text-caption text-text-muted">{title}</span>
        <button
          type="button"
          onClick={replay}
          className="ml-auto rounded-pill border-2 border-border-soft px-3 py-1 font-mono text-caption font-semibold uppercase tracking-wide text-info transition-colors hover:bg-card"
        >
          ↻ Replay
        </button>
      </div>

      {/* Screen-reader announcement: one completed line at a time (avoids the char-by-char flood). */}
      <div className="sr-only" aria-live="polite">
        {reduce ? lines.map((l) => l.text).join(". ") : printed > 0 ? lines[printed - 1].text : ""}
      </div>

      {/* body (visual only — animated, hidden from AT) */}
      <pre
        aria-hidden="true"
        className="m-0 min-h-[260px] overflow-x-auto whitespace-pre-wrap break-words p-5 font-mono text-body-sm leading-relaxed sm:text-body"
      >
        {lines.slice(0, printed).map((l, i) => (
          <div key={i} className={toneClass[l.tone]}>
            {l.text}
          </div>
        ))}
        {!finished && (
          <div className={toneClass[activeTone ?? "info"]}>
            {partial}
            <span className="ml-0.5 inline-block h-[1em] w-[0.6em] translate-y-[0.12em] animate-blink bg-primary align-baseline" />
          </div>
        )}
      </pre>
    </div>
  );
}
