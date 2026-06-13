import { ShieldLogo, Wordmark } from "../components/ui";
import { GITHUB_URL } from "../data";

const FOOTER_LINKS = [
  { label: "The problem", href: "#problem" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Live demo", href: "#demo" },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t-[3px] border-border bg-near-black">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="inline-block rotate-[-3deg] rounded-pill border-[3px] border-border bg-off-white px-4 py-1.5 shadow-bevel-sm">
            <span className="display text-[15px] text-text-inverse">COIN COIN !</span>
          </span>
          <p className="max-w-2xl font-body text-body-lg text-text-primary">
            100% non-custodial. You keep your keys, the keeper can only evacuate to your own vault,
            and you can revoke anytime.
          </p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic mt-2">
            View on GitHub
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t-[3px] border-surface pt-8 sm:flex-row">
          <a href="#hero" className="flex items-center gap-2.5" aria-label="coincoin home">
            <ShieldLogo size={34} />
            <Wordmark className="text-[20px]" />
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="font-body text-body-sm text-text-muted transition-colors hover:text-info">
                {l.label}
              </a>
            ))}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-body text-body-sm text-info hover:text-primary">
              GitHub ↗
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-1 text-center sm:text-left">
          <p className="font-body text-body-sm text-text-muted">
            Built for the <span className="text-text-primary">Arbitrum Open House London</span> buildathon · Submission June 14, 2026.
          </p>
          <p className="font-body text-caption uppercase tracking-wide text-text-muted">
            coincoin — the canary that quacks before the drain finishes.
          </p>
          <p className="mt-2 font-body text-caption text-text-muted/70">
            Testnet software, built for a buildathon. Not audited. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
