import { ShieldLogo, Wordmark } from "../components/ui";
import { SocialLink, Avatar } from "../components/social";
import { GITHUB_URL, DOCS_URL, CONTACTS, OWNER_NAME } from "../data";

const PRODUCT_LINKS = [
  { label: "The problem", href: "#problem" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Live demo", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "Docs", href: DOCS_URL },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t-[3px] border-border bg-near-black">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8">
        {/* quack + reassurance */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="inline-block rotate-[-3deg] rounded-pill border-[3px] border-border bg-off-white px-4 py-1.5 shadow-bevel-sm">
            <span className="display text-[15px] text-text-inverse">COIN COIN !</span>
          </span>
          <p className="max-w-2xl font-body text-body-lg text-text-primary">
            100% non-custodial. You keep your keys, the keeper can only evacuate to your own vault,
            and you can revoke anytime.
          </p>
        </div>

        {/* columns */}
        <div className="mt-14 grid gap-10 border-t-[3px] border-surface pt-12 md:grid-cols-3">
          {/* brand */}
          <div>
            <a href="#hero" className="flex items-center gap-2.5" aria-label="coincoin home">
              <ShieldLogo size={40} />
              <Wordmark className="text-[22px]" />
            </a>
            <p className="mt-4 max-w-xs font-body text-body-sm text-text-muted">
              The self-custodial onchain firewall. You keep your keys.
            </p>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic mt-5">
              View on GitHub
            </a>
          </div>

          {/* product / docs */}
          <nav aria-label="Product" className="md:justify-self-center">
            <h2 className="display text-[14px] text-primary">Product</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="font-body text-body-sm text-text-muted transition-colors hover:text-info">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* connect */}
          <div className="md:justify-self-end">
            <h2 className="display text-[14px] text-primary">Connect</h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={OWNER_NAME} size={56} />
              <div>
                <div className="font-body text-body font-bold text-text-primary">{OWNER_NAME}</div>
                <div className="font-body text-caption uppercase tracking-wide text-text-muted">
                  Builder · coincoin
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <SocialLink net="x" href={CONTACTS.x} />
              <SocialLink net="telegram" href={CONTACTS.telegram} />
              <SocialLink net="github" href={CONTACTS.github} />
            </div>
            <p className="mt-3 font-body text-caption text-text-muted">DMs open on X &amp; Telegram.</p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-12 flex flex-col gap-1 border-t-[3px] border-surface pt-8 text-center sm:text-left">
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
