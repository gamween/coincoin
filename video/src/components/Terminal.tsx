import { useCurrentFrame } from "remotion";
import { COLORS, RADIUS, SHADOW, BORDER_THICK } from "../theme";
import { MONO } from "../fonts";

export type TermLine = {
  text: string;
  color?: string;
  at: number; // frame (scene-relative) when the line starts typing
  speed?: number; // chars per frame
  dim?: boolean;
};

/** Animated terminal window: lines type in char-by-char with a blinking cursor. */
export const Terminal: React.FC<{
  title: string;
  lines: TermLine[];
  width?: number;
  fontSize?: number;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ title, lines, width = 980, fontSize = 27, accent = COLORS.info, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width,
        background: "#02132E",
        border: BORDER_THICK,
        borderRadius: RADIUS.lg,
        boxShadow: SHADOW.bevel,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 22px",
          background: COLORS.surface,
          borderBottom: `4px solid ${COLORS.outline}`,
        }}
      >
        <Dot c="#FF5F56" />
        <Dot c="#FFBD2E" />
        <Dot c="#27C93F" />
        <span
          style={{
            marginLeft: 10,
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 600,
            color: accent,
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </span>
      </div>
      {/* body */}
      <div style={{ padding: "26px 30px", fontFamily: MONO, fontSize, lineHeight: 1.5, minHeight: 120 }}>
        {lines.map((l, i) => {
          const local = frame - l.at;
          if (local < 0) return <div key={i} style={{ height: fontSize * 1.5 }} />;
          const speed = l.speed ?? 1.4;
          const shown = Math.min(l.text.length, Math.floor(local * speed));
          const typing = shown < l.text.length;
          const cursorOn = Math.floor(frame / 8) % 2 === 0;
          return (
            <div
              key={i}
              style={{
                color: l.color ?? COLORS.text,
                opacity: l.dim ? 0.6 : 1,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {l.text.slice(0, shown)}
              {typing && cursorOn ? <span style={{ color: accent }}>▋</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: `2px solid ${COLORS.outline}` }} />
);
