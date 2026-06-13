import type { ReactNode } from "react";
import { Section, SectionHeading, Pill, ShieldLogo, Wordmark } from "../components/ui";
import { Footer } from "../sections/Footer";
import { PIPELINE, GUARANTEES, COMMANDS, ARCH_UNITS, CHAINS, PROBLEM_BULLETS, GITHUB_URL } from "../data";

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="comic-card !bg-near-black my-4 overflow-x-auto !rounded-md p-4 font-mono text-body-sm leading-relaxed text-text-primary">
      {children}
    </pre>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="display mt-10 text-[18px] text-primary">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 font-body text-body text-text-primary">{children}</p>;
}

export function Docs() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b-[3px] border-border bg-surface/95 shadow-bevel-sm backdrop-blur">
        <nav className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3 sm:px-8">
          <a href="/" className="flex items-center gap-2.5" aria-label="coincoin home">
            <ShieldLogo size={36} />
            <Wordmark className="text-[20px]" />
            <span className="font-mono text-caption uppercase tracking-[0.1em] text-text-muted">/ docs</span>
          </a>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" className="font-body text-body-sm font-medium text-text-primary hover:text-info">
              ← Back to site
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-ghost !px-5 !py-2.5">
              GitHub
            </a>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <Section className="pt-16">
          <Pill tone="info" className="mb-5">DOCUMENTATION</Pill>
          <h1 className="display text-[clamp(34px,7vw,60px)] leading-[0.95] text-text-primary">
            Run &amp; understand <span className="text-primary">coincoin</span>
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg text-text-muted">
            What it is, how the EIP-7702 guardian works, how to run the live demo end-to-end, and the
            architecture behind it.
          </p>
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2.5">
            {[
              ["Overview", "#overview"],
              ["The problem", "#problem"],
              ["How it works", "#how"],
              ["Run it", "#run"],
              ["Architecture", "#arch"],
              ["Deployment", "#deploy"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="pill border-border-soft bg-surface text-text-primary hover:text-info">
                {label}
              </a>
            ))}
          </nav>
        </Section>

        {/* Overview */}
        <Section id="overview" className="!py-12">
          <SectionHeading eyebrow="OVERVIEW" eyebrowTone="info" title="What coincoin is" />
          <P>
            coincoin is a self-custodial onchain firewall on Arbitrum. Your wallet delegates to a
            GuardianModule via EIP-7702. When a verifiable threat hits the chain, a bounded keeper can
            do exactly one thing — sweep your funds to your own SafeVault. It never holds your keys,
            never reaches any other address, and you can revoke the delegation in one transaction.
          </P>
          <P>
            It turns the attacker's own primitive against them: 90%+ of EIP-7702 delegations today are
            drainers — coincoin points the same mechanism at safety instead of theft.
          </P>
        </Section>

        {/* The problem */}
        <Section id="problem" className="!py-12">
          <SectionHeading eyebrow="THE PROBLEM" eyebrowTone="threat" title="Drained, with no way to react" />
          <P>
            $83.85M was stolen via wallet drainers and phishing in 2025, across 106,106 victims
            (Scam Sniffer). Protocol exploits aren't instant — they leave a window, anywhere from
            four minutes to five days, between the first malicious move and the final drain. That's
            reaction time, and until now nobody tooled it for the person whose funds are on the line.
            The gap isn't detection — it's response, at the account level, in time.
          </P>
          <ul className="mt-4 flex flex-col gap-3">
            {PROBLEM_BULLETS.map((b) => (
              <li key={b} className="comic-card !shadow-bevel-sm flex gap-3 p-4">
                <span className="mt-0.5 text-danger" aria-hidden="true">✕</span>
                <span className="font-body text-body-sm text-text-primary">{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* How it works */}
        <Section id="how" className="!py-12">
          <SectionHeading eyebrow="HOW IT WORKS" eyebrowTone="info" title="Detect. Sweep. Safe." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PIPELINE.map((s) => (
              <div key={s.key} className="comic-card p-5">
                <div className="display text-[15px] text-primary">{s.label}</div>
                <p className="mt-2 font-body text-body-sm text-text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {GUARANTEES.map((g) => (
              <div key={g.label} className="comic-card flex items-start gap-3 p-5">
                <Pill tone="safe">{g.label}</Pill>
                <p className="font-body text-body-sm text-text-primary">{g.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Run it */}
        <Section id="run" className="!py-12">
          <SectionHeading
            eyebrow="RUN IT"
            eyebrowTone="safe"
            title="Run the guardian on Robinhood Chain"
            subtitle="The TypeScript watcher in watcher/, run with pnpm. Connect your wallet, run the guardian — live on Robinhood Chain Testnet (chain 46630, Arbitrum Orbit, EIP-7702 confirmed)."
          />

          <H3>1 · Prerequisites</H3>
          <P>
            Fund your deployer, wallet, and keeper accounts with gas on Robinhood Chain, and fill
            <code className="mx-1 rounded bg-near-black px-1.5 py-0.5 font-mono text-body-sm text-primary">.env</code>
            (RPC + the three private keys + <code className="font-mono text-primary">VICTIM_ADDRESS</code>, your protected wallet).
          </P>

          <H3>2 · Deploy the contracts</H3>
          <Code>{`cd contracts && set -a && source ../.env && set +a
# shared GuardianModule implementation
forge script script/Deploy.s.sol:DeployGuardian \\
  --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --gas-estimate-multiplier 800 --slow
# your set: token + SafeVault (+ a throwaway protocol for local testing)
forge script script/SetupDemo.s.sol:SetupDemo \\
  --rpc-url "$ROBINHOOD_TESTNET_RPC" --broadcast --gas-estimate-multiplier 800 --slow`}</Code>
          <P>
            Copy the printed addresses into <code className="font-mono text-primary">.env</code>:
            <code className="ml-1 font-mono text-primary">GUARDIAN_IMPL</code>,
            <code className="ml-1 font-mono text-primary">DEMO_TOKEN</code>,
            <code className="ml-1 font-mono text-primary">DEMO_PROTO</code>,
            <code className="ml-1 font-mono text-primary">DEMO_VAULT</code>.
          </P>

          <H3>3 · Connect and run</H3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {COMMANDS.map((c, i) => (
              <div key={c.cmd} className="comic-card h-full p-5">
                <Pill tone={i === 1 ? "action" : "brand"} className="mb-3">{c.badge}</Pill>
                <code className="block font-mono text-body font-bold text-primary">
                  <span aria-hidden="true">$ </span>
                  {c.cmd}
                </code>
                <p className="mt-3 font-body text-body-sm text-text-muted">{c.body}</p>
              </div>
            ))}
          </div>
          <P>
            Run <code className="font-mono text-primary">pnpm onboard</code> once to connect, then
            leave <code className="font-mono text-primary">pnpm watch</code> running. The guardian
            catches a real on-chain <code className="font-mono text-primary">Drained</code> log itself
            and evacuates to your vault — no human in the loop:
          </P>
          <Code>{`🦆 COIN COIN ! threat detected → evacuating 0xFD0A…Ea89
→ evacuated to your SafeVault 0xF60c…Fe7A (EIP-7702 guardian context)
✓ funds safe in your own vault. Daemon still watching.`}</Code>
          <P>
            Want to see it react on your own machine? <code className="font-mono text-primary">pnpm exploit</code>{" "}
            is an optional dev tool that fires a test threat at a throwaway protocol — it's for local
            testing, not part of using coincoin.
          </P>
        </Section>

        {/* Architecture */}
        <Section id="arch" className="!py-12">
          <SectionHeading eyebrow="ARCHITECTURE" eyebrowTone="info" title="Five parts, no trust required" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {ARCH_UNITS.map((u) => (
              <div key={u.name} className="comic-card h-full p-6">
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-h3 font-bold text-text-primary">{u.name}</code>
                  <span className={`pill bg-surface ${u.tag === "Solidity" ? "border-warning text-warning" : "border-info text-info"}`}>
                    {u.tag}
                  </span>
                </div>
                <p className="mt-3 font-body text-body-sm text-text-muted">{u.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Deployment */}
        <Section id="deploy" className="!py-12">
          <SectionHeading eyebrow="DEPLOYMENT" eyebrowTone="info" title="Chains" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CHAINS.map((c) => (
              <div key={c.name} className="comic-card flex items-center gap-4 p-5">
                <span className="display text-[22px] text-primary">▲</span>
                <div>
                  <div className="font-body text-body font-bold text-text-primary">{c.name}</div>
                  <div className="font-body text-caption uppercase tracking-wide text-text-muted">{c.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic">View the code</a>
            <a href={`${GITHUB_URL}/tree/main/watcher`} target="_blank" rel="noreferrer" className="btn-ghost">
              The watcher
            </a>
            <a href="/" className="btn-ghost">← Back to site</a>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
