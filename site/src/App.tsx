import CardNav from "./components/CardNav";
import FlowingMenu from "./components/FlowingMenu";
import { Hero } from "./sections/Hero";
import { Problem } from "./sections/Problem";
import { Flip } from "./sections/Flip";
import { HowItWorks } from "./sections/HowItWorks";
import { Demo } from "./sections/Demo";
import { Architecture } from "./sections/Architecture";
import { Stack } from "./sections/Stack";
import { Footer } from "./sections/Footer";
import { Marquee } from "./components/Marquee";
import { NAV_PAGES, FLOW_MENU } from "./data";

function App() {
  return (
    <>
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border-[3px] focus:border-border focus:bg-primary focus:px-4 focus:py-2 focus:text-text-inverse"
      >
        Skip to content
      </a>
      <CardNav items={[...NAV_PAGES]} />
      <main className="relative z-10">
        <Hero />

        {/* on-page section index — replaces the old top nav row */}
        <section id="explore" className="relative px-5 pb-8 sm:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="display text-[clamp(20px,3vw,28px)] text-text-primary">Find your way around</h2>
              <span className="font-body text-caption uppercase tracking-[0.12em] text-text-muted">
                Hover to preview · click to jump
              </span>
            </div>
            <div className="comic-card h-[clamp(420px,62vh,560px)] overflow-hidden !rounded-xl shadow-bevel-lg">
              <FlowingMenu items={FLOW_MENU.map((m) => ({ link: m.href, text: m.label, image: m.image }))} />
            </div>
          </div>
        </section>

        {/* the CLI is the product — show it working first */}
        <Demo />
        <Marquee />
        <Problem />
        <Flip />
        <Marquee />
        <HowItWorks />
        <Architecture />
        <Stack />
      </main>
      <Footer />
    </>
  );
}

export default App;
