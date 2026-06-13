import type { ReactNode } from "react";

/* ── Shield-medal logo (the canonical mark, BRAND §7). SVG placeholder until art lands. ── */
export function ShieldLogo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="shieldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3EB5F3" />
          <stop offset="0.5" stopColor="#036BC8" />
          <stop offset="1" stopColor="#0351A6" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L56 12 V30 C56 46 45 56 32 61 C19 56 8 46 8 30 V12 Z"
        fill="url(#shieldg)" stroke="#040607" strokeWidth="5" strokeLinejoin="round"
      />
      <path
        d="M32 13 L48 19 V31 C48 42 41 49 32 53 C23 49 16 42 16 31 V19 Z"
        fill="none" stroke="#AFD0C7" strokeWidth="2.5" opacity="0.7"
      />
      <path
        d="M34 19 L21 37 H31 L29 47 L43 27 H33 Z"
        fill="#F5D90A" stroke="#040607" strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Wordmark ── */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`display lowercase text-primary ${className}`}>coincoin</span>;
}

/* ── Pills / badges ── */
type Tone = "brand" | "action" | "threat" | "safe" | "info" | "tech" | "planned";
const pillTone: Record<Tone, string> = {
  brand: "border-border-soft bg-surface/60 text-text-primary",
  action: "border-border bg-primary text-text-inverse",
  threat: "border-border bg-danger text-text-inverse",
  safe: "border-border bg-success text-text-inverse",
  info: "border-info bg-surface text-info",
  tech: "border-info bg-surface text-text-primary",
  planned: "border-dashed border-info bg-transparent text-text-muted",
};
export function Pill({ tone = "brand", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`pill ${pillTone[tone]} ${className}`}>{children}</span>;
}

/* ── Section shell ── uniform background; depth comes from the framed cards, not bg bands. */
export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative scroll-mt-24 px-5 py-16 sm:px-8 md:py-20 ${className}`}>
      <div className="relative mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

/* ── Section heading pattern: eyebrow pill + big Bungee title + optional subtitle ── */
export function SectionHeading({
  eyebrow,
  eyebrowTone = "info",
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  eyebrowTone?: Tone;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <Pill tone={eyebrowTone} className="mb-5">
          {eyebrow}
        </Pill>
      )}
      <h2 className="display text-[clamp(30px,5.5vw,46px)] leading-[0.95] text-text-primary">
        <span className="text-stroke inline-block border-b-[5px] border-primary pb-1">{title}</span>
      </h2>
      {subtitle && <p className="mt-6 font-body text-body-lg text-text-muted">{subtitle}</p>}
    </div>
  );
}

/* ── Pixel-brick section divider ── */
export function BrickDivider() {
  return (
    <div aria-hidden="true" className="relative h-10 w-full overflow-hidden">
      <div className="bg-bricks absolute inset-0 opacity-50" />
      <div className="absolute inset-x-0 top-0 h-[3px] bg-border" />
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-border" />
    </div>
  );
}

/* ── Comic arrow chevron between pipeline nodes ── */
export function Chevron({ className = "", down = false }: { className?: string; down?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 24"
      className={`${className} ${down ? "rotate-90" : ""}`}
      width="40"
      height="24"
      aria-hidden="true"
    >
      <path d="M2 6 L22 6 L22 2 L38 12 L22 22 L22 18 L2 18 Z" fill="#F5D90A" stroke="#040607" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
