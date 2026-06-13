import { Section, SectionHeading } from "../components/ui";
import { Reveal } from "../components/Reveal";
import Stepper, { Step } from "../components/Stepper";
import { STEPPER_STEPS, DOCS_URL } from "../data";

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="HOW IT WORKS"
        eyebrowTone="info"
        title="Detect. Sweep. Safe."
        subtitle="A live feed watches the chain. When a real exploit fires, a bounded keeper sweeps your funds — to your vault, and nowhere else. Step through it:"
      />

      {/* interactive step-through */}
      <Reveal delay={0.06}>
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

      <p className="mt-8 text-center font-body text-body-sm text-text-muted">
        The keeper is never a custodian — one bounded action, your vault only.{" "}
        <a href={`${DOCS_URL}#how`} className="font-semibold text-info underline-offset-2 hover:underline">
          The guarantees in full →
        </a>
      </p>
    </Section>
  );
}
