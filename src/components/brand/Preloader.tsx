import { useEffect, useRef, useState } from "react";
import Wordmark from "./Wordmark";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

const SESSION_KEY = "humandmx:intro-played";

/**
 * First-load intro. The lockup wipes in behind a gold sweep, a brass rule
 * draws underneath it, then the panel splits and lifts.
 *
 * Plays once per browser session, and is skipped entirely for anyone who has
 * asked for reduced motion.
 */
const Preloader = ({ onDone }: { onDone?: () => void }) => {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  // Held in a ref so a parent re-render can't restart the intro mid-play.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const alreadyPlayed =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(SESSION_KEY) === "1";

    if (alreadyPlayed || prefersReducedMotion()) {
      setGone(true);
      done.current?.();
      return;
    }

    document.body.style.overflow = "hidden";

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.sessionStorage.setItem(SESSION_KEY, "1");
      document.body.style.overflow = "";
      setGone(true);
      done.current?.();
    };

    /**
     * GSAP runs on requestAnimationFrame, which browsers freeze in a
     * background tab — without this the intro could hold the page hostage
     * for anyone who opens the store in a tab they aren't looking at.
     */
    const failsafe = window.setTimeout(finish, 6000);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });

      tl.from(".pl-logo", {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.9,
        ease: "power3.inOut",
      })
        .from(".pl-logo", { scale: 1.08, duration: 1.1, ease: "power2.out" }, 0)
        .from(
          ".pl-sweep",
          { xPercent: -320, duration: 1, ease: "power2.inOut" },
          0.15,
        )
        .from(
          ".pl-rule",
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: "power2.inOut",
          },
          "-=0.5",
        )
        .from(
          ".pl-tag",
          { opacity: 0, letterSpacing: "0.9em", duration: 0.5 },
          "-=0.9",
        )
        .to(".pl-mark", { y: -16, duration: 0.32, ease: "power2.in" }, "+=0.2")
        .to(
          ".pl-mark",
          { opacity: 0, scale: 0.95, duration: 0.32, ease: "power2.in" },
          "<0.05",
        )
        .to(
          ".pl-curtain-top",
          { yPercent: -101, duration: 0.72, ease: "power4.inOut" },
          "-=0.12",
        )
        .to(
          ".pl-curtain-bottom",
          { yPercent: 101, duration: 0.72, ease: "power4.inOut" },
          "<",
        );
    }, root);

    return () => {
      window.clearTimeout(failsafe);
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 z-[200] overflow-hidden"
    >
      <div className="pl-curtain-top absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div className="pl-curtain-bottom absolute inset-x-0 bottom-0 h-1/2 bg-ink" />

      <div className="pl-mark absolute inset-0 flex flex-col items-center justify-center gap-10 px-6">
        <div className="relative overflow-hidden">
          <Wordmark
            tone="light"
            animated
            size={104}
            className="pl-logo max-w-[80vw] object-contain"
          />
          <span
            aria-hidden
            className="pl-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />
        </div>

        <span className="pl-rule block h-[3px] w-40 rounded-full bg-brass" />

        <p className="pl-tag text-[10px] font-bold uppercase tracking-[0.42em] text-white/40">
          Back To The Old School
        </p>
      </div>
    </div>
  );
};

export default Preloader;
