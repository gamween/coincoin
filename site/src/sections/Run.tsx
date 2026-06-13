import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { RunTerminal } from "../components/RunTerminal";
import { COMMANDS, GUARDIAN_TERMINAL, GITHUB_URL, DOCS_URL } from "../data";

const SETUP = COMMANDS.slice(0, 2); // connect, run — how you use it

export function Run() {
  return (
    <Section id="run">
      <SectionHeading
        eyebrow="GET STARTED"
        eyebrowTone="safe"
        title="Two commands to get protected"
        subtitle="coincoin is a CLI. Connect your wallet once, then run the guardian — it watches the chain and moves your funds to your own vault the moment a real threat hits. You keep your keys the whole time."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SETUP.map((c, i) => (
          <Reveal key={c.cmd} delay={i * 0.08}>
            <div className="comic-card h-full p-5">
              <Pill tone={i === 0 ? "brand" : "action"} className="mb-3">
                {c.badge}
              </Pill>
              <code className="block font-mono text-body font-bold text-primary">
                <span aria-hidden="true">$ </span>
                {c.cmd}
              </code>
              <p className="mt-3 font-body text-body-sm text-text-muted">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-8">
        <p className="mb-4 font-mono text-caption uppercase tracking-wide text-text-muted">
          The guardian, running live:
        </p>
        <RunTerminal term={GUARDIAN_TERMINAL} />
        <p className="mt-3 font-body text-caption text-text-muted">
          No human in the loop — it sees the on-chain event itself and evacuates to your vault. Live
          on Robinhood Chain Testnet (chain 46630, Arbitrum Orbit).
        </p>
      </Reveal>

      <div className="mt-8 flex flex-wrap gap-4">
        <a href={DOCS_URL} className="btn-comic">
          Full setup guide
        </a>
        <a href={`${GITHUB_URL}/tree/main/watcher`} target="_blank" rel="noreferrer" className="btn-ghost">
          Read the watcher code
        </a>
      </div>
    </Section>
  );
}
