import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { Problem } from "./sections/Problem";
import { Flip } from "./sections/Flip";
import { HowItWorks } from "./sections/HowItWorks";
import { Demo } from "./sections/Demo";
import { Architecture } from "./sections/Architecture";
import { Stack } from "./sections/Stack";
import { Footer } from "./sections/Footer";
import { Marquee } from "./components/Marquee";

function App() {
  return (
    <>
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border-[3px] focus:border-border focus:bg-primary focus:px-4 focus:py-2 focus:text-text-inverse"
      >
        Skip to content
      </a>
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Marquee />
        <Problem />
        <Flip />
        <Marquee />
        <HowItWorks />
        <Demo />
        <Marquee />
        <Architecture />
        <Stack />
      </main>
      <Footer />
    </>
  );
}

export default App;
