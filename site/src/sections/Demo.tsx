import { useState } from "react";
import { Section, SectionHeading, Pill } from "../components/ui";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { DualTerminal } from "../components/DualTerminal";
import { Duck } from "../components/Duck";
import {
  COMMANDS,
  ATTACKER_TERMINAL,
  GUARDIAN_TERMINAL,
  GUARDIAN_SUCCESS_INDEX,
  GITHUB_URL,
} from "../data";

export function Demo() {
  const [safe, setSafe] = useState(false);

  return (
    <Section id="demo">
      <SectionHeading
        eyebrow="LIVE DEMO · NOT A MOCKUP"
        eyebrowTone="safe"
        title="Watch the duck work"
        subtitle="This is the product. Three commands, one real on-chain exploit — the daemon detects it and rescues the funds on its own, live on Robinhood Chain Testnet."
      />

      {/* command cards */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {COMMANDS.map((c, i) => (
          <Reveal key={c.cmd} delay={i * 0.08}>
            <div className="comic-card h-full p-5">
              <Pill tone={i === 1 ? "action" : "brand"} className="mb-3">
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

      {/* two distinct terminals */}
      <Reveal delay={0.1} className="mt-8">
        <DualTerminal
          attacker={ATTACKER_TERMINAL}
          guardian={GUARDIAN_TERMINAL}
          guardianSuccessIndex={GUARDIAN_SUCCESS_INDEX}
          onSuccess={() => setSafe(true)}
          onReplay={() => setSafe(false)}
        />
        <p className="mt-3 font-body text-caption text-text-muted">
          Two separate processes. Nothing tells the guardian the exploit happened — it catches the
          real Drained log on its own and evacuates. No human in the loop.
        </p>
      </Reveal>

      {/* result panel — the green "funds safe" payoff */}
      <div
        className={`mt-8 grid items-center gap-6 rounded-xl border-[3px] p-6 transition-all duration-500 md:grid-cols-[1fr_auto] ${
          safe ? "border-success glow-green bg-surface" : "border-border bg-surface"
        }`}
      >
        <div>
          <h3 className="display text-[20px] text-text-primary">The result, onchain</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2" aria-hidden="true">
            <div>
              <div className="font-body text-caption uppercase tracking-wide text-text-muted">Victim wallet</div>
              <div className="mt-1 text-numeric-lg text-danger">
                {safe ? <CountUp from={500} to={0} suffix=" dUSD" /> : <span className="numeric">500 dUSD</span>}
              </div>
            </div>
            <div className="relative">
              <div className="font-body text-caption uppercase tracking-wide text-text-muted">Safe vault</div>
              <div className="mt-1 text-numeric-lg text-success">
                {safe ? <CountUp from={0} to={500} suffix=" dUSD" /> : <span className="numeric">0 dUSD</span>}
              </div>
              {safe && (
                <img
                  src="/hero-coins.png"
                  alt=""
                  aria-hidden="true"
                  className="mt-2 h-12 object-contain drop-shadow-[3px_4px_0_rgba(4,6,7,0.85)]"
                />
              )}
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={`mt-5 font-body text-body font-bold ${safe ? "text-success" : "text-text-muted"}`}
          >
            {safe ? "Funds safe. The duck did its job." : "Awaiting the rescue…"}
            {safe && <span className="sr-only"> Victim wallet is now 0 dUSD; 500 dUSD is safe in your vault.</span>}
          </p>
          <p className="mt-2 font-body text-caption text-text-muted">
            500 dUSD at rest, evacuated to the victim's own SafeVault — detected and executed by the
            daemon alone, live on Robinhood Chain Testnet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill tone="tech">Robinhood Chain Testnet</Pill>
            <Pill tone="tech">chain 46630</Pill>
            <Pill tone="tech">Arbitrum Orbit</Pill>
          </div>
        </div>
        {safe && <Duck state="hero" className="mx-auto w-40" />}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic">
          Run the demo
        </a>
        <a href={`${GITHUB_URL}/tree/main/watcher`} target="_blank" rel="noreferrer" className="btn-ghost">
          Read the watcher code
        </a>
      </div>
    </Section>
  );
}
