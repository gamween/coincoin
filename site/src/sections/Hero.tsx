import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { GITHUB_URL } from "../data";
import { Pill } from "../components/ui";

export function Hero() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 16 });
  const sy = useSpring(my, { stiffness: 90, damping: 16 });

  // Whole-panel 3D tilt — the frame moves as one unit, so nothing separates into stickers.
  const rotateY = useTransform(sx, (v) => v * 7);
  const rotateX = useTransform(sy, (v) => v * -7);

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section id="hero" className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 md:pb-24 md:pt-36">
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* copy */}
        <motion.div
          className="order-2 lg:order-1"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <div className="mb-6 flex flex-wrap gap-2.5">
            <Pill tone="info">SELF-CUSTODIAL ONCHAIN FIREWALL</Pill>
            <Pill tone="action">🦆 ROBINHOOD CHAIN TRACK</Pill>
          </div>
          <h1 className="display text-[clamp(38px,7.5vw,72px)] leading-[0.92] text-text-primary text-stroke">
            The duck that quacks <span className="text-primary">before</span> you get drained
          </h1>
          <p className="mt-6 max-w-xl font-body text-body-lg text-text-muted">
            coincoin is a self-custodial firewall for your wallet. When a real threat hits the chain,
            it sweeps your funds to your own safe vault — automatically, and only ever to you. You keep
            your keys.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-comic">
              View on GitHub
            </a>
            <a href="#run" className="btn-ghost">
              Get started
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Pill tone="brand">100% non-custodial</Pill>
            <Pill tone="brand">Bounded keeper</Pill>
            <Pill tone="brand">Revocable anytime</Pill>
          </div>
        </motion.div>

        {/* framed hero illustration */}
        <motion.div
          className="order-1 lg:order-2"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={reduce ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <div
            ref={stageRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className="relative mx-auto w-full max-w-[560px] [perspective:1100px]"
          >
            {/* corner sticker badge (peeks out of the frame) */}
            <span className="absolute -left-3 -top-3 z-30 rotate-[-6deg] rounded-pill border-[3px] border-border bg-primary px-3.5 py-1.5 shadow-bevel-sm">
              <span className="display text-[12px] text-text-inverse">EIP-7702 · FLIPPED</span>
            </span>

            <motion.div
              style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="comic-card relative overflow-hidden !rounded-xl shadow-bevel-lg"
            >
              {/* energy burst, clipped inside the frame */}
              <img
                src="/speed-burst.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-25 mix-blend-screen"
              />
              <img
                src="/coincoin-illustration.png"
                alt="The coincoin guardian duck quacks COIN COIN beside a treasure chest as a thief recoils empty-handed"
                width={1672}
                height={941}
                loading="eager"
                className="relative z-10 block w-full"
              />
              {/* glossy top shine */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1/3 bg-gradient-to-b from-white/10 to-transparent"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
