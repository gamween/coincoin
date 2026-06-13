import { Section, Pill, ShieldLogo, Wordmark } from "../components/ui";
import { SocialLink, Avatar } from "../components/social";
import { Footer } from "../sections/Footer";
import { GITHUB_URL, DOCS_URL, CONTACTS, OWNER_NAME } from "../data";

const CHANNELS = [
  {
    net: "x" as const,
    href: CONTACTS.x,
    label: "X / Twitter",
    handle: "@gamween",
    note: "DMs open — fastest for a quick question.",
  },
  {
    net: "telegram" as const,
    href: CONTACTS.telegram,
    label: "Telegram",
    handle: "@dvb_fianso",
    note: "DMs open — good for a longer thread.",
  },
  {
    net: "github" as const,
    href: CONTACTS.github,
    label: "GitHub",
    handle: "gamween",
    note: "Issues & PRs on the coincoin repo.",
  },
];

export function Contact() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b-[3px] border-border bg-surface/95 shadow-bevel-sm backdrop-blur">
        <nav className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3 sm:px-8">
          <a href="/" className="flex items-center gap-2.5" aria-label="coincoin home">
            <ShieldLogo size={36} />
            <Wordmark className="text-[20px]" />
            <span className="font-mono text-caption uppercase tracking-[0.1em] text-text-muted">/ contact</span>
          </a>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" className="font-body text-body-sm font-medium text-text-primary hover:text-info">
              ← Back to site
            </a>
            <a href={DOCS_URL} className="btn-ghost !px-5 !py-2.5">
              Docs
            </a>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <Section className="pt-16">
          <Pill tone="info" className="mb-5">CONTACT</Pill>
          <h1 className="display text-[clamp(34px,7vw,60px)] leading-[0.95] text-text-primary text-stroke">
            Talk to the <span className="text-primary">builder</span>
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg text-text-muted">
            coincoin is built in the open. Questions about the EIP-7702 guardian, the live demo, the
            Robinhood Chain track, or want to collaborate? Reach out — DMs are open.
          </p>
        </Section>

        <Section className="!pt-4 !pb-12">
          {/* builder card */}
          <div className="comic-card !shadow-bevel-lg flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center">
            <Avatar name={OWNER_NAME} size={84} />
            <div>
              <div className="display text-[22px] text-text-primary">{OWNER_NAME}</div>
              <div className="mt-1 font-body text-caption uppercase tracking-wide text-text-muted">
                Builder · coincoin
              </div>
              <p className="mt-3 max-w-md font-body text-body-sm text-text-primary">
                Solo build for the Arbitrum Open House London buildathon. Self-custodial onchain
                firewall, running live on Robinhood Chain Testnet.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <SocialLink net="x" href={CONTACTS.x} />
                <SocialLink net="telegram" href={CONTACTS.telegram} />
                <SocialLink net="github" href={CONTACTS.github} />
              </div>
            </div>
          </div>

          {/* channels */}
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CHANNELS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="comic-card group h-full p-6 transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:!shadow-bevel-lg"
              >
                <div className="display text-[15px] text-primary">{c.label}</div>
                <div className="mt-1 font-mono text-body-sm text-text-primary group-hover:text-info">{c.handle}</div>
                <p className="mt-3 font-body text-body-sm text-text-muted">{c.note}</p>
              </a>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic">View on GitHub</a>
            <a href={DOCS_URL} className="btn-ghost">Read the docs</a>
            <a href="/" className="btn-ghost">← Back to site</a>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
