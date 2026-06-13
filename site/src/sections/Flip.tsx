import { Section, SectionHeading, Pill, Chevron } from "../components/ui";
import { Reveal } from "../components/Reveal";

function FlowNode({ label, tone }: { label: string; tone: "danger" | "success" }) {
  const border = tone === "danger" ? "!border-danger" : "!border-success";
  return (
    <div className={`comic-card ${border} !shadow-bevel-sm px-4 py-3 text-center`}>
      <span className="font-mono text-body-sm font-bold uppercase tracking-wide text-text-primary">{label}</span>
    </div>
  );
}

function Flow({ nodes, tone }: { nodes: string[]; tone: "danger" | "success" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {nodes.map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <FlowNode label={n} tone={tone} />
          {i < nodes.length - 1 && <Chevron className={tone === "danger" ? "rotate-0 opacity-90" : ""} />}
        </div>
      ))}
    </div>
  );
}

export function Flip() {
  return (
    <Section id="flip">
      <SectionHeading
        eyebrow="THE FLIP"
        eyebrowTone="action"
        title="Same weapon. Our side."
        subtitle="Attackers already use EIP-7702 to drain wallets. coincoin turns the exact same primitive into a bodyguard."
      />

      <div className="relative mt-12 grid gap-6 lg:grid-cols-2">
        {/* lightning divider (desktop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 left-1/2 hidden w-1 -translate-x-1/2 lg:block"
          style={{
            background:
              "repeating-linear-gradient(180deg,#F5D90A 0 14px,#040607 14px 20px,#F5D90A 20px 30px,#040607 30px 36px)",
            clipPath: "polygon(40% 0,60% 0,45% 50%,60% 100%,40% 100%,55% 50%)",
          }}
        />

        {/* DRAINER */}
        <Reveal>
          <div className="comic-card glow-red h-full !border-danger p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="display text-[22px] text-danger">The drainer</h3>
              <Pill tone="threat">90%+ ARE SWEEPERS</Pill>
            </div>
            <Flow nodes={["EOA", "SWEEPER"]} tone="danger" />
            <p className="mt-5 font-body text-body text-text-muted">
              They delegate your account to a sweeper contract. One signature, and everything you
              hold flows out to them.
            </p>
          </div>
        </Reveal>

        {/* GUARDIAN */}
        <Reveal delay={0.12}>
          <div className="comic-card glow-green h-full !border-success p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="display text-[22px] text-success">coincoin</h3>
              <Pill tone="safe">YOUR SIDE</Pill>
            </div>
            <Flow nodes={["EOA", "GUARDIAN", "VAULT"]} tone="success" />
            <p className="mt-5 font-body text-body text-text-muted">
              We delegate your account to a GuardianModule instead. The only move it can make is to
              push your funds into your own vault. Same mechanism, opposite outcome.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <div className="comic-card mx-auto mt-8 max-w-4xl overflow-hidden !rounded-xl !shadow-bevel-lg">
          <img
            src="/eip-7702-flip.png"
            alt="EIP-7702 flip: a drainer routes an EOA to a SWEEPER (90%+ are sweepers), while coincoin routes the EOA through a GUARDIAN to your VAULT"
            className="block w-full"
            width={1200}
            height={675}
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mx-auto mt-10 max-w-3xl text-center font-body text-body-lg text-text-primary">
          EIP-7702 lets an EOA temporarily run a contract's code. A drainer points that code at
          theft. coincoin points it at safety — bounded so it can never send anywhere but your
          vault.
        </p>
      </Reveal>
    </Section>
  );
}
