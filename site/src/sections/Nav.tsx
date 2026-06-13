import { useEffect, useState } from "react";
import { NAV_LINKS, GITHUB_URL } from "../data";
import { ShieldLogo, Wordmark } from "../components/ui";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled ? "border-b-[3px] border-border bg-surface/95 shadow-bevel-sm backdrop-blur" : "border-b-[3px] border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1180px] items-center px-5 py-3 sm:px-8">
        <a href="#hero" className="flex items-center gap-2.5" aria-label="coincoin home">
          <ShieldLogo size={38} />
          <Wordmark className="text-[22px]" />
        </a>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-pill px-3 py-2 font-body text-body-sm font-medium text-text-primary transition-colors hover:text-info"
            >
              {l.label}
            </a>
          ))}
          <span className="ml-2 inline-flex items-center gap-2 rounded-pill border-2 border-info bg-surface px-3 py-1.5 font-body text-caption font-semibold uppercase tracking-wide text-info">
            <span className="h-2 w-2 rounded-full bg-success shadow-green-glow" />
            Watching
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic ml-2 !px-5 !py-2.5">
            View on GitHub
          </a>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md border-[3px] border-border bg-primary text-text-inverse shadow-bevel-sm lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="display text-[20px] leading-none">{open ? "✕" : "≡"}</span>
        </button>
      </nav>

      {open && (
        <div className="border-t-[3px] border-border bg-surface px-5 pb-6 pt-2 lg:hidden">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="comic-card !shadow-bevel-sm px-4 py-3 font-body text-body font-semibold text-text-primary"
              >
                {l.label}
              </a>
            ))}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic mt-2 w-full">
              View on GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
