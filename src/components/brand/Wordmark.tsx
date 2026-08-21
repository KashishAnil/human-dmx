import logoNavy from "../../assets/logo.png";
import logoLight from "../../assets/logo-light.png";
import { cn } from "../../utils/Functions";

interface WordmarkProps {
  className?: string;
  /** Rendered height in px. The lockup keeps its 3.2:1 ratio. */
  size?: number;
  /** `navy` for light backgrounds, `light` for dark ones. */
  tone?: "navy" | "light";
  title?: string;
  /** Adds the hook GSAP uses for the intro and logo-motion sequences. */
  animated?: boolean;
}

/** Official HUMAN DMX APPAREL lockup, supplied by the client. */
const Wordmark = ({
  className,
  size = 34,
  tone = "navy",
  title = "HUMAN DMX APPAREL",
  animated = false,
}: WordmarkProps) => (
  <img
    src={tone === "light" ? logoLight : logoNavy}
    alt={title}
    className={cn("block w-auto select-none", animated && "wm-logo", className)}
    style={{ height: size }}
    draggable={false}
  />
);

export default Wordmark;
