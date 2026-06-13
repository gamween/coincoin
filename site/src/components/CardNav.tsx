import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ShieldLogo, Wordmark } from "./ui";
import { DEPLOY_PROOF } from "../data";
import "./CardNav.css";

// React Bits "CardNav" — typed and reskinned to the coincoin comic/brutalist brand.
// Pinned top-left; the hamburger expands a card dropdown with the standalone pages.

export type NavPage = { label: string; href: string; blurb: string; bg: string };

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="nav-card-link-icon">
      <path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CardNav({ items, ease = "power3.out" }: { items: NavPage[]; ease?: string }) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLAnchorElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 280;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector<HTMLElement>(".card-nav-content");
      if (contentEl) {
        const prev = {
          v: contentEl.style.visibility,
          p: contentEl.style.pointerEvents,
          pos: contentEl.style.position,
          h: contentEl.style.height,
        };
        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";
        void contentEl.offsetHeight;
        const total = 60 + contentEl.scrollHeight + 16;
        contentEl.style.visibility = prev.v;
        contentEl.style.pointerEvents = prev.p;
        contentEl.style.position = prev.pos;
        contentEl.style.height = prev.h;
        return total;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 40, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, "-=0.1");
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLAnchorElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className="card-nav-container">
      <nav ref={navRef} className={`card-nav ${isExpanded ? "open" : ""}`}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleMenu()}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </div>

          <a href="#hero" className="logo-container" aria-label="coincoin home">
            <ShieldLogo size={30} />
            <Wordmark className="text-[19px]" />
          </a>

          <a
            href={DEPLOY_PROOF.explorer}
            target="_blank"
            rel="noreferrer"
            className="card-nav-live"
            aria-label="Live on Robinhood Chain — view the GuardianModule on the explorer"
            title="GuardianModule on the Robinhood Chain explorer"
          >
            <span className="dot" />
            Live · Robinhood Chain
          </a>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {items.map((item, idx) => (
            <a
              key={item.label}
              href={item.href}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bg }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                <span className="nav-card-link">
                  <ArrowUpRight />
                  {item.blurb.replace(" ↗", "")}
                </span>
              </div>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
