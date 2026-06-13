import { Section, SectionHeading } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { ARCH_UNITS, DOCS_URL } from "../data";

export function Architecture() {
  return (
    <Section id="architecture">
      <SectionHeading
        eyebrow="ARCHITECTURE"
        eyebrowTone="info"
        title="Five parts. No trust required."
        subtitle="Two contracts and three TypeScript pieces. The keeper never holds your funds and can only do one bounded thing."
      />

      <Reveal>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {ARCH_UNITS.map((u) => (
            <span
              key={u.name}
              className={`pill bg-surface ${u.tag === "Solidity" ? "border-warning text-warning" : "border-info text-info"}`}
            >
              {u.name}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="comic-card glow-green mt-6 !border-success p-6">
          <h3 className="display text-[18px] text-success">Self-custodial by construction</h3>
          <p className="mt-3 max-w-3xl font-body text-body-sm text-text-primary">
            The keeper's entire power is one call to one function with one fixed destination. There
            is no "send elsewhere" path in the code. Worst case, your funds end up safely in your own
            vault — and you can revoke the whole arrangement in a single transaction.
          </p>
          <a
            href={`${DOCS_URL}#arch`}
            className="mt-4 inline-block font-body text-body-sm font-semibold text-info underline-offset-2 hover:underline"
          >
            How each part works →
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
