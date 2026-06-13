import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { STACK_LIVE, STACK_PLANNED, CHAINS } from "../data";

export function Stack() {
  return (
    <Section id="stack">
      <SectionHeading
        eyebrow="BUILT WITH"
        eyebrowTone="info"
        title="On-chain, end to end"
        subtitle="Account-level enforcement via EIP-7702 — the primitive that arrived after Harpie, doing what front-run racing never could."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Reveal>
          <div className="comic-card h-full p-6">
            <h3 className="display text-[16px] text-primary">Live today</h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {STACK_LIVE.map((t) => (
                <Pill key={t} tone="tech">
                  {t}
                </Pill>
              ))}
            </div>
            <h3 className="display mt-6 text-[16px] text-text-muted">Roadmap</h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {STACK_PLANNED.map((t) => (
                <Pill key={t} tone="planned">
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex h-full flex-col gap-4">
            {CHAINS.map((c) => (
              <div
                key={c.name}
                className={`comic-card p-5 ${c.primary ? "!border-success glow-green" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="display text-[24px] text-primary">▲</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-body font-bold text-text-primary">{c.name}</span>
                      {c.primary && <Pill tone="safe">TRACK</Pill>}
                    </div>
                    <div className="font-body text-caption uppercase tracking-wide text-text-muted">{c.note}</div>
                  </div>
                </div>
                {c.address && c.explorer && (
                  <a
                    href={c.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-2 font-mono text-caption text-info underline-offset-2 hover:underline"
                  >
                    <span className="truncate">{c.address}</span>
                    <span aria-hidden="true" className="shrink-0">↗ Arbiscan</span>
                  </a>
                )}
              </div>
            ))}
            <div className="comic-card !shadow-bevel-sm grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <div className="font-body text-caption uppercase tracking-wide text-success">Live</div>
                <p className="mt-1 font-body text-body-sm text-text-primary">Funds at rest in your wallet.</p>
              </div>
              <div>
                <div className="font-body text-caption uppercase tracking-wide text-info">Roadmap</div>
                <p className="mt-1 font-body text-body-sm text-text-primary">
                  Deposited DeFi positions, with auto-exit from Aave V3 and GMX.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <p className="mt-8 font-body text-caption uppercase tracking-wide text-text-muted">
        Planned items are clearly marked. Everything else, you can run today.
      </p>
    </Section>
  );
}
