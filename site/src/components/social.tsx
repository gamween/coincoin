import { useState } from "react";

type Net = "x" | "telegram" | "github";

const PATHS: Record<Net, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  telegram:
    "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
  github:
    "M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.02c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.73 18.27.5 12 .5z",
};
const LABELS: Record<Net, string> = { x: "X", telegram: "Telegram", github: "GitHub" };

/** Comic icon-button link to a social profile. */
export function SocialLink({ net, href }: { net: Net; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={LABELS[net]}
      className="inline-flex items-center gap-2 rounded-pill border-[3px] border-border bg-surface px-4 py-2 font-body text-body-sm font-bold text-text-primary shadow-bevel-sm transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-card hover:text-primary hover:shadow-bevel"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d={PATHS[net]} />
      </svg>
      {LABELS[net]}
    </a>
  );
}

/** Owner avatar. Uses /founder.png; falls back to a comic initial if it's missing. */
export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full border-[3px] border-border bg-primary text-text-inverse shadow-bevel-sm"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="display text-[20px]">{name.charAt(0)}</span>
      </div>
    );
  }
  return (
    <img
      src="/founder.png"
      alt={name}
      width={size}
      height={size}
      onError={() => setOk(false)}
      className="shrink-0 rounded-full border-[3px] border-border object-cover shadow-bevel-sm"
      style={{ width: size, height: size }}
    />
  );
}
