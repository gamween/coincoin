import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { GITHUB_URL } from "../data";
import { Pill } from "../components/ui";

/** One parallax cutout layer: translates with the pointer by `depth`, with a hard comic shadow. */
function Layer({
  src,
  alt,
  sx,
  sy,
  depth,
  rotate = 0,
  z,
  style,
}: {
  src: string;
  alt: string;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  depth: number;
  rotate?: number;
  z: number;
  style: React.CSSProperties;
}) {
  const x = useTransform(sx, (v) => v * depth * 18);
  const y = useTransform(sy, (v) => v * depth * 18);
  return (
    <motion.img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      loading="eager"
      style={{
        x,
        y,
        rotate,
        zIndex: z,
        position: "absolute",
        filter: "drop-shadow(5px 6px 0 rgba(4,6,7,0.85))",
        ...style,
      }}
    />
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 18 });
  const sy = useSpring(my, { stiffness: 110, damping: 18 });

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
      <div aria-hidden="true" className="bg-bricks pointer-events-none absolute inset-0 opacity-[0.18]" />
      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* copy */}
        <motion.div
          className="order-2 lg:order-1"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <Pill tone="info" className="mb-6">
            SELF-CUSTODIAL ONCHAIN FIREWALL · ARBITRUM
          </Pill>
          <h1 className="display text-[clamp(38px,7.5vw,72px)] leading-[0.92] text-text-primary">
            The duck that quacks <span className="text-primary text-stroke">before</span> you get drained
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

        {/* diorama */}
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
            className="relative mx-auto aspect-[4/3] w-full max-w-[560px]"
          >
            {/* speed-burst backdrop */}
            <img
              src="/speed-burst.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 w-[115%] -translate-x-1/2 -translate-y-1/2 opacity-[0.22] mix-blend-screen"
            />
            <Layer src="/hero-thief.png" alt="A blue hooded thief fleeing empty-handed" sx={sx} sy={sy} depth={0.35} rotate={-3} z={10} style={{ left: "-2%", top: "16%", width: "40%" }} />
            <Layer src="/hero-chest.png" alt="" sx={sx} sy={sy} depth={0.6} rotate={2} z={20} style={{ left: "26%", top: "42%", width: "52%" }} />
            <Layer src="/hero-duck.png" alt="The coincoin guardian duck" sx={sx} sy={sy} depth={0.95} rotate={3} z={30} style={{ left: "40%", top: "0%", width: "58%" }} />
            <Layer src="/hero-coins.png" alt="" sx={sx} sy={sy} depth={1.25} rotate={-5} z={40} style={{ left: "12%", top: "70%", width: "30%" }} />
            <Layer src="/hero-sparks.png" alt="" sx={sx} sy={sy} depth={1.1} rotate={0} z={45} style={{ left: "60%", top: "-2%", width: "22%" }} />
            {/* quack bubble */}
            <motion.div
              aria-hidden="true"
              className="absolute right-[-2%] top-[8%] z-50 rotate-[-4deg] rounded-pill border-[3px] border-border bg-off-white px-4 py-2 shadow-bevel-sm"
              animate={reduce ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="display text-[15px] text-text-inverse">COIN COIN !</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
