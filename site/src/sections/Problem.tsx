import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { Duck } from "../components/Duck";
import { PROBLEM_BULLETS } from "../data";

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
    <Section id="problem" tone="dark">
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

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="font-body text-body-lg text-text-primary">
            Protocol exploits aren't instant. They leave a window — anywhere from four minutes to
            five days — between the first malicious move and the final drain. That's reaction time.
            Until now, nobody tooled it for the person whose funds are on the line.
          </p>
          <p className="mt-6 font-body text-body-sm uppercase tracking-wide text-text-muted">
            The gap isn't detection. It's response — at the account level, in time.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="flex flex-col gap-3">
            {PROBLEM_BULLETS.map((b) => (
              <li key={b} className="comic-card !shadow-bevel-sm flex gap-3 p-4">
                <span className="mt-0.5 text-danger" aria-hidden="true">✕</span>
                <span className="font-body text-body-sm text-text-primary">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="mt-10">
        <Pill tone="threat">90%+ of EIP-7702 delegations are sweepers →</Pill>
      </div>
    </Section>
  );
}
