import { useState } from "react";
import { ImageUrl, cn } from "../../utils/Functions";
import Wordmark from "./Wordmark";

/** Where the badge artwork lives in `public/`. */
export const CREST_SRC = "/images/brand/crest.png";

interface CrestProps {
  className?: string;
  /** Rendered height in px. The badge keeps its ~3:4 ratio. */
  size?: number;
  title?: string;
  /** Adds the hook GSAP uses for the intro and logo-motion sequences. */
  animated?: boolean;
  /** Tone handed to the wordmark if the badge can't be loaded. */
  tone?: "navy" | "light";
}

/**
 * The HUMAN DMX APPAREL badge — the illustrated crest, used as the primary
 * brand mark.
 *
 * Falls back to the wide text lockup if the artwork is missing. That matters
 * because the badge is a `public/` asset rather than a bundled import: a bad
 * FTP sync would otherwise leave a broken-image icon in the header of every
 * page instead of a logo.
 */
const Crest = ({
  className,
  size = 64,
  title = "HUMAN DMX APPAREL",
  animated = false,
  tone = "navy",
}: CrestProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Wordmark
        className={className}
        size={Math.round(size * 0.55)}
        tone={tone}
        title={title}
        animated={animated}
      />
    );
  }

  return (
    <img
      src={ImageUrl(CREST_SRC)}
      alt={title}
      onError={() => setFailed(true)}
      className={cn(
        "block w-auto select-none",
        animated && "wm-logo",
        className,
      )}
      style={{ height: size }}
      draggable={false}
    />
  );
};

export default Crest;
