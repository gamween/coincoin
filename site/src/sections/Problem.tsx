import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { Duck } from "../components/Duck";

function StatCard({
  children,
  label,
  source,
  delay,
  stamp,
  glow = false,
}: {
  children: React.ReactNode;
  label: string;
  source: string;
  delay: number;
  stamp?: string;
  glow?: boolean;
}) {
  return (
    <Reveal delay={delay}>
      <div className={`comic-card relative h-full !border-danger p-7 ${glow ? "glow-red" : ""}`}>
        {stamp && (
          <img
            src={stamp}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 -top-6 w-24 rotate-6 drop-shadow-[3px_4px_0_rgba(4,6,7,0.8)]"
          />
        )}
        <div className="display text-[clamp(34px,5vw,52px)] leading-none text-danger">{children}</div>
        <p className="mt-4 font-body text-body text-text-primary">{label}</p>
        <p className="mt-3 font-body text-caption uppercase tracking-wide text-text-muted">Source: {source}</p>
      </div>
    </Reveal>
  );
}

export function Problem() {
  return (
    <Section id="problem">
      <Duck
        state="alert"
        className="pointer-events-none absolute right-3 top-10 z-10 hidden w-48 -rotate-2 lg:block"
      />
      <SectionHeading
        eyebrow="THE PROBLEM"
        eyebrowTone="threat"
        title="Wallets get drained. Nobody catches you."
        subtitle="Prevention tools warn you before you sign. They do nothing the moment after you're compromised — and nothing for the money you've already deposited."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <StatCard label="stolen in 2025 via wallet drainers & phishing" source="Scam Sniffer" delay={0} stamp="/pow-stamp.png" glow>
          <CountUp to={83.85} decimals={2} prefix="$" suffix="M" />
        </StatCard>
        <StatCard label="victims in a single year" source="Scam Sniffer" delay={0.08}>
          <CountUp to={106106} />
        </StatCard>
        <StatCard label="the non-atomic response window exploits leave open" source="Defimon" delay={0.16} stamp="/boom-stamp.png">
          4 min → 5 days
        </StatCard>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Pill tone="threat">90%+ of EIP-7702 delegations are sweepers</Pill>
        <a
          href="/docs.html#problem"
          className="font-body text-body-sm font-semibold text-info underline-offset-2 hover:underline"
        >
          The full breakdown →
        </a>
      </div>
    </Section>
  );
}
