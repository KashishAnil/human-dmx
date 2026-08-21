import { useState } from "react";
import { ImageUrl, cn } from "../../utils/Functions";

interface ArtworkProps {
  /** Path under `public/`, e.g. "/images/brand/back-to-the-old-school.jpg". */
  src: string;
  alt: string;
  className?: string;
  /** Shown in place of the image until the file is added. */
  placeholder?: string;
}

/**
 * A `public/` image with a visible stand-in when the file isn't there yet.
 *
 * Sleeve scans and brand artwork are dropped in by hand rather than bundled,
 * so a missing one would otherwise render as a broken-image icon in the middle
 * of a finished page. The stand-in says what belongs there instead.
 */
const Artwork = ({ src, alt, className, placeholder }: ArtworkProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border border-dashed border-white/25 bg-white/5 p-6 text-center",
          className,
        )}
      >
        <span className="text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
          {placeholder ?? alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={ImageUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
    />
  );
};

export default Artwork;
