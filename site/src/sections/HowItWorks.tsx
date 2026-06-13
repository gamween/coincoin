import { Section, SectionHeading, Pill, Chevron } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { PIPELINE, GUARANTEES } from "../data";

const ICON: Record<string, string> = {
  alerts: "/icons/alerts.png",
  keeper: "/icons/keeper.png",
  guardian: "/icons/eoa.png",
  vault: "/icons/vault.png",
};

const STATUS = [
  { tone: "info", dot: "bg-info", text: "All quiet. coincoin is watching your wallets." },
  { tone: "danger", dot: "bg-danger", text: "COIN COIN ! Suspicious drain detected." },
  { tone: "success", dot: "bg-success", text: "Funds safe. The duck did its job." },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="HOW IT WORKS"
        eyebrowTone="info"
        title="Detect. Sweep. Safe."
        subtitle="A live threat feed watches the chain. When a real exploit fires, a bounded keeper sweeps your funds — to your vault, and nowhere else."
      />

      {/* the campaign pipeline illustration */}
      <Reveal>
        <div className="comic-card mx-auto mt-10 max-w-4xl overflow-hidden !rounded-xl !shadow-bevel-lg">
          <img
            src="/how-it-works.png"
            alt="Pipeline: ALERTS to KEEPER to your EOA and GUARDIAN to your VAULT, with ONLY YOUR VAULT and REVOCABLE guarantees"
            className="block w-full"
            width={1200}
            height={675}
          />
        </div>
      </Reveal>

      {/* step nodes */}
      <div className="mt-10 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {PIPELINE.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center gap-3">
            <Reveal delay={i * 0.08} className="flex-1">
              <div className="comic-card h-full p-5">
                <img src={ICON[step.key]} alt="" aria-hidden="true" className="mb-3 h-16 w-16 object-contain" />
                <div className="display text-[15px] text-primary">{step.label}</div>
                <p className="mt-2 font-body text-body-sm text-text-muted">{step.body}</p>
              </div>
            </Reveal>
            {i < PIPELINE.length - 1 && <Chevron className="hidden shrink-0 lg:block" />}
          </div>
        ))}
      </div>

      {/* guarantees */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {GUARANTEES.map((g, i) => (
          <Reveal key={g.label} delay={i * 0.08}>
            <div className="comic-card flex items-start gap-4 p-5">
              <Pill tone="safe">{g.label}</Pill>
              <p className="font-body text-body-sm text-text-primary">{g.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mx-auto mt-10 max-w-3xl text-center font-body text-body-lg text-text-primary">
          The keeper isn't a custodian and it isn't trusted with your money. It can trigger one
          bounded action — evacuate to the vault you configured — and that's the whole list. You
          hold the keys the entire time.
        </p>
      </Reveal>

      {/* status microcopy strip */}
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {STATUS.map((s) => (
          <div key={s.text} className="comic-card !shadow-bevel-sm flex items-center gap-3 p-4">
            <span className={`h-3 w-3 shrink-0 rounded-full ${s.dot}`} />
            <span className="font-body text-body-sm text-text-primary">{s.text}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
