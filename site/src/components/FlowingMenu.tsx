import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./FlowingMenu.css";

// React Bits "FlowingMenu" — typed, reskinned to the coincoin brand, reduced-motion aware.
// Each row reveals a marquee of the section title + an extracted cutout on hover.

export type FlowItem = { link: string; text: string; image: string };

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FlowingMenu({ items = [], speed = 18 }: { items?: FlowItem[]; speed?: number }) {
  return (
    <nav className="menu">
      {items.map((item, idx) => (
        <MenuItem key={idx} {...item} speed={speed} />
      ))}
    </nav>
  );
}

function MenuItem({ link, text, image, speed }: FlowItem & { speed: number }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const dx = x - x2;
    const dy = y - y2;
    return dx * dx + dy * dy;
  };
  const findClosestEdge = (mx: number, my: number, w: number, h: number) =>
    distMetric(mx, my, w / 2, 0) < distMetric(mx, my, w / 2, h) ? "top" : "bottom";

  useEffect(() => {
    const calc = () => {
      const content = marqueeInnerRef.current?.querySelector<HTMLElement>(".marquee__part");
      if (!content) return;
      const needed = Math.ceil(window.innerWidth / content.offsetWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [text, image]);

  useEffect(() => {
    if (prefersReduced()) return;
    const setup = () => {
      const inner = marqueeInnerRef.current;
      const content = inner?.querySelector<HTMLElement>(".marquee__part");
      if (!inner || !content) return;
      const w = content.offsetWidth;
      if (w === 0) return;
      animationRef.current?.kill();
      animationRef.current = gsap.to(inner, { x: -w, duration: speed, ease: "none", repeat: -1 });
    };
    const t = setTimeout(setup, 50);
    return () => {
      clearTimeout(t);
      animationRef.current?.kill();
    };
  }, [text, image, repetitions, speed]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (prefersReduced() || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (prefersReduced() || !itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);
    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  return (
    <div className="menu__item" ref={itemRef}>
      <a className="menu__item-link" href={link} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {text}
      </a>
      <div className="marquee" ref={marqueeRef}>
        <div className="marquee__inner-wrap">
          <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
            {Array.from({ length: repetitions }).map((_, idx) => (
              <div className="marquee__part" key={idx}>
                <span>{text}</span>
                <div className="marquee__img" style={{ backgroundImage: `url(${image})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
