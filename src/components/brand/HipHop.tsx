import { cn } from "../../utils/Functions";

/* ──────────────────────────────────────────────────────────────
   Brand textures. Surface treatment only — no illustrated props, so the
   client's own photography carries the imagery.
   ────────────────────────────────────────────────────────────── */

/** Spray-can underline used beneath section headings. */
export const SprayUnderline = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 240 18"
    className={cn("block h-3 w-40", className)}
    aria-hidden
    preserveAspectRatio="none"
  >
    <path
      d="M4 12c34-7 62 2 96-3 30-4 64 6 96-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M18 16c30-4 58 1 88-2 26-3 56 3 84-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

/** Brick-wall texture for dark hip-hop bands. */
export const BrickTexture = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("pointer-events-none absolute inset-0", className)}
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 42px), repeating-linear-gradient(90deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 86px)",
      backgroundPosition: "0 0, 43px 21px",
    }}
  />
);
