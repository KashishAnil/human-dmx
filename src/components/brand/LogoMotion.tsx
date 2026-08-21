import { useState } from "react";
import Wordmark from "./Wordmark";
import { BrickTexture } from "./HipHop";
import { cn } from "../../utils/Functions";
import { gsap, prefersReducedMotion, useGsap } from "../../lib/gsap";

interface LogoMotionProps {
  /** Optional MP4/WebM set in Admin → Content. Takes over when present. */
  videoUrl?: string;
  className?: string;
  tone?: "light" | "blue";
}

/**
 * "Video on my logo" — the client's one custom ask.
 *
 * With a video URL configured in the admin portal, that plays here. Otherwise
 * this runs a GSAP sequence built from the wordmark itself: the record drops
 * and spins up, HUMAN slides in, DMX punches, the brass rule wipes across and
 * APPAREL settles. Click to replay.
 */
const LogoMotion = ({
  videoUrl,
  className,
  tone = "blue",
}: LogoMotionProps) => {
  const [take, setTake] = useState(0);

  const scope = useGsap<HTMLDivElement>(() => {
    if (videoUrl || prefersReducedMotion()) return;

    const tl = gsap.timeline();

    tl.from(
      ".wm-logo",
      {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.85,
        ease: "power3.inOut",
      },
      "-=0.4",
    )
      .from(".wm-logo", { scale: 1.06, duration: 1, ease: "power2.out" }, "<")
      .from(
        ".lm-sweep",
        { xPercent: -300, duration: 1.05, ease: "power2.inOut" },
        "-=0.6",
      );
  }, [take, videoUrl]);

  const shell =
    tone === "blue" ? "bg-navy text-white/10" : "bg-well text-head/[0.06]";

  if (videoUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-line",
          shell,
          className,
        )}
      >
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      ref={scope}
      role="button"
      tabIndex={0}
      onClick={() => setTake((t) => t + 1)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setTake((t) => t + 1);
      }}
      aria-label="Replay the Human DMX logo animation"
      className={cn(
        "group relative block w-full cursor-pointer overflow-hidden rounded-3xl",
        shell,
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            tone === "blue"
              ? "linear-gradient(150deg, #16244a 0%, #12388f 60%, #1f5fd0 120%)"
              : "linear-gradient(150deg, #f7f5ef 0%, #eceadf 100%)",
        }}
      />
      {tone === "blue" && <BrickTexture />}
      <span aria-hidden className="halftone absolute inset-0" />

      <div className="relative flex h-full flex-col items-center justify-center gap-6 p-8">
        <div className="lm-mark relative overflow-hidden">
          <Wordmark
            size={58}
            tone={tone === "blue" ? "light" : "navy"}
            animated
            className="max-w-full object-contain"
          />
          <span
            aria-hidden
            className="lm-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />
        </div>

        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.3em]",
            tone === "blue" ? "text-white/45" : "text-soft",
          )}
        >
          Doing the Human Box · Replay ↻
        </p>
      </div>
    </div>
  );
};

export default LogoMotion;
