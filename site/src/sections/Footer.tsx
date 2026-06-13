import { ShieldLogo, Wordmark } from "../components/ui";
import { SocialLink } from "../components/social";
import { GITHUB_URL, DOCS_URL, CONTACT_URL, CONTACTS, LICENSE } from "../data";

export function Footer() {
  return (
    <footer className="relative z-10 border-t-[3px] border-border bg-near-black">
      {/* tactile brick baseboard */}
      <div
        aria-hidden="true"
        className="h-3 w-full border-b-[3px] border-border bg-[url('/bg-brick-tile.png')] bg-repeat opacity-60"
      />

      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 sm:px-8">
        {/* closing quack */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="inline-block rotate-[-3deg] rounded-pill border-[3px] border-border bg-off-white px-4 py-1.5 shadow-bevel-sm">
            <span className="display text-[15px] text-text-inverse">COIN COIN !</span>
          </span>
          <p className="max-w-2xl font-body text-body-lg text-text-primary">
            100% non-custodial. You keep your keys, the keeper can only evacuate to your own vault,
            and you can revoke anytime.
          </p>
        </div>

        {/* brand + the two pages + socials */}
        <div className="mt-12 flex flex-col items-center gap-8 border-t-[3px] border-surface pt-10 md:flex-row md:items-center md:justify-between">
          <a href="#hero" className="flex items-center gap-2.5" aria-label="coincoin home">
            <ShieldLogo size={40} />
            <div>
              <Wordmark className="text-[22px]" />
              <p className="font-body text-caption text-text-muted">The self-custodial onchain firewall.</p>
            </div>
          </a>

          <div className="flex flex-col items-center gap-5 md:items-end">
            <nav aria-label="Footer" className="flex items-center gap-5 font-body text-body-sm font-semibold">
              <a href={DOCS_URL} className="text-text-primary transition-colors hover:text-info">Docs</a>
              <a href={CONTACT_URL} className="text-text-primary transition-colors hover:text-info">Contact</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-text-primary transition-colors hover:text-info">GitHub</a>
            </nav>
            <div className="flex flex-wrap justify-center gap-2.5">
              <SocialLink net="x" href={CONTACTS.x} />
              <SocialLink net="telegram" href={CONTACTS.telegram} />
              <SocialLink net="github" href={CONTACTS.github} />
            </div>
          </div>
        </div>

        {/* license / copyright */}
        <div className="mt-10 flex flex-col gap-1 border-t-[3px] border-surface pt-8 text-center sm:text-left">
          <p className="font-body text-caption uppercase tracking-wide text-text-muted">
            © 2026 coincoin ·{" "}
            <a
              href={`${GITHUB_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="text-text-primary underline-offset-2 hover:text-info hover:underline"
            >
              {LICENSE} License
            </a>{" "}
            · Built for the Arbitrum Open House London buildathon.
          </p>
          <p className="font-body text-caption text-text-muted/70">
            Testnet software, built for a buildathon. Not audited. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
