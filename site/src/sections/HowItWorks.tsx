import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import Stepper, { Step } from "../components/Stepper";
import { STEPPER_STEPS, GUARANTEES } from "../data";

const STATUS = [
  { tone: "info", dot: "bg-info", text: "All quiet. coincoin is watching your wallets." },
  { tone: "danger", dot: "bg-danger", text: "COIN COIN ! Suspicious drain detected." },
  { tone: "success", dot: "bg-success", text: "Funds safe. The duck did its job." },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="panel">
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

      {/* interactive step-through */}
      <Reveal delay={0.06}>
        <p className="mt-12 text-center font-body text-caption uppercase tracking-[0.12em] text-text-muted">
          Step through it →
        </p>
        <Stepper initialStep={1} backButtonText="Back" nextButtonText="Next">
          {STEPPER_STEPS.map((s) => (
            <Step key={s.key}>
              <div className="step-head">
                <img src={s.icon} alt="" aria-hidden="true" className="step-icon" />
                <span className="step-title">{s.title}</span>
              </div>
              <p className="step-body">{s.body}</p>
            </Step>
          ))}
        </Stepper>
      </Reveal>

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
