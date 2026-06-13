import { Section, SectionHeading } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { ARCH_UNITS } from "../data";

function Tag({ kind }: { kind: string }) {
  const cls = kind === "Solidity" ? "border-warning text-warning" : "border-info text-info";
  return <span className={`pill bg-surface ${cls}`}>{kind}</span>;
}

export function Architecture() {
  return (
    <Section id="architecture" tone="panel">
      <SectionHeading
        eyebrow="ARCHITECTURE"
        eyebrowTone="info"
        title="Five parts. No trust required."
        subtitle="Two contracts and three TypeScript pieces. The keeper never holds your funds and can only do one bounded thing."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {ARCH_UNITS.map((u, i) => (
          <Reveal key={u.name} delay={i * 0.06}>
            <div className="comic-card h-full p-6">
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-h3 font-bold text-text-primary">{u.name}</code>
                <Tag kind={u.tag} />
              </div>
              <p className="mt-3 font-body text-body-sm text-text-muted">{u.body}</p>
            </div>
          </Reveal>
        ))}

        {/* guarantee callout */}
        <Reveal delay={0.12}>
          <div className="comic-card glow-green flex h-full flex-col justify-center !border-success p-6">
            <h3 className="display text-[18px] text-success">Self-custodial by construction</h3>
            <p className="mt-3 font-body text-body-sm text-text-primary">
              The keeper's entire power is one call to one function with one fixed destination.
              There is no "send elsewhere" path in the code. Worst case, your funds end up safely in
              your own vault — and you can revoke the whole arrangement in a single transaction.
            </p>
          </div>
        </Reveal>
      </div>

      <p className="mt-8 font-body text-caption uppercase tracking-wide text-text-muted">
        Self-custodial by construction, not by promise.
      </p>
    </Section>
  );
}
