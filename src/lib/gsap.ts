import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Respect the OS "reduce motion" setting everywhere GSAP is used. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scopes a GSAP timeline to a container ref and cleans it up on unmount.
 * `gsap.context` handles selector scoping plus revert, so nothing leaks
 * between route changes.
 */
export const useGsap = <T extends HTMLElement = HTMLDivElement>(
  build: (ctx: { scope: T }) => void,
  deps: unknown[] = [],
) => {
  const scope = useRef<T>(null);

  useLayoutEffect(() => {
    if (!scope.current) return;
    const el = scope.current;
    const ctx = gsap.context(() => build({ scope: el }), el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
};

/**
 * The house scroll reveal.
 *
 * Deliberately NOT a bare `gsap.from(..., { scrollTrigger })`: that hides the
 * targets on creation and only shows them again if the tween actually runs.
 * If rAF is throttled (background tab), ScrollTrigger measures a locked-scroll
 * page, or JS errors later in the timeline, the content is stranded invisible.
 *
 * Instead the resting state is the visible one. We only hide targets once the
 * trigger is wired up, animate them in on enter, and keep a timer that clears
 * the inline styles if that never happens — so the worst case is "no
 * animation", never "no content".
 */
export const reveal = (
  scope: Element,
  selector: string,
  options: {
    y?: number;
    x?: number;
    scale?: number;
    stagger?: number;
    duration?: number;
    start?: string;
  } = {},
) => {
  const targets = Array.from(scope.querySelectorAll<HTMLElement>(selector));
  if (!targets.length) return;

  const {
    y = 38,
    x = 0,
    scale = 1,
    stagger = 0.08,
    duration = 0.8,
    start = "top 82%",
  } = options;

  const show = () => gsap.set(targets, { clearProps: "opacity,transform" });

  if (prefersReducedMotion()) {
    show();
    return;
  }

  gsap.set(targets, { opacity: 0, y, x, scale });

  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      ease: "power3.out",
      stagger,
      clearProps: "transform",
    });
  };

  ScrollTrigger.create({ trigger: scope, start, once: true, onEnter: play });

  // Safety net: whatever happens, the content is on screen within 2.5s.
  const guard = window.setTimeout(() => {
    if (!played) show();
  }, 2500);

  return () => window.clearTimeout(guard);
};

export { gsap, ScrollTrigger };
