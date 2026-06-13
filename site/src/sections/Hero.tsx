import { motion, useReducedMotion } from "framer-motion";
import { GITHUB_URL } from "../data";
import { Pill } from "../components/ui";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="hero" className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 md:pb-24 md:pt-36">
      {/* brick wash behind hero */}
      <div aria-hidden="true" className="bg-bricks pointer-events-none absolute inset-0 opacity-[0.18]" />
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* copy */}
        <div className="order-2 lg:order-1">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <Pill tone="info" className="mb-6">
              SELF-CUSTODIAL ONCHAIN FIREWALL · ARBITRUM
            </Pill>
            <h1 className="display text-[clamp(38px,7.5vw,72px)] leading-[0.92] text-text-primary">
              The duck that quacks{" "}
              <span className="text-primary text-stroke">before</span> you get drained
            </h1>
            <p className="mt-6 max-w-xl font-body text-body-lg text-text-muted">
              coincoin is a self-custodial firewall for your wallet. When a real threat hits the
              chain, it sweeps your funds to your own safe vault — automatically, and only ever to
              you. You keep your keys.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic">
                View on GitHub
              </a>
              <a href="#demo" className="btn-ghost">
                Run the demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Pill tone="brand">100% non-custodial</Pill>
              <Pill tone="brand">Bounded keeper</Pill>
              <Pill tone="brand">Revocable anytime</Pill>
            </div>
          </motion.div>
        </div>

        {/* illustration */}
        <motion.div
          className="order-1 lg:order-2"
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={reduce ? {} : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <div className="relative">
            <div className="comic-card overflow-hidden !rounded-xl !shadow-bevel-lg">
              <img
                src="/coincoin-illustration.png"
                alt="The coincoin duck shouting COIN COIN ! in front of a treasure chest as a hooded thief flees"
                className="block w-full"
                width={1200}
                height={675}
              />
            </div>
            {/* floating quack bubble */}
            <motion.div
              aria-hidden="true"
              className="absolute -right-3 -top-5 rotate-[-4deg] rounded-pill border-[3px] border-border bg-off-white px-4 py-2 shadow-bevel-sm sm:-right-5"
              animate={reduce ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="display text-[16px] text-text-inverse">COIN COIN !</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
