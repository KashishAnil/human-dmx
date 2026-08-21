import { Link } from "react-router";
import { useSettings } from "../../hooks/useCommerce";
import { SectionHeading } from "../ui/Bits";
import { BrickTexture, SprayUnderline } from "../brand/HipHop";
import { reveal, useGsap } from "../../lib/gsap";

/** The two named pages, as a dark split panel. Type-led — no photography. */
const StorySplit = () => {
  const settings = useSettings();

  const scope = useGsap<HTMLElement>(({ scope }) => {
    reveal(scope, ".split-panel", { y: 46, stagger: 0.14, start: "top 76%" });
  }, []);

  const panels = [
    {
      key: "HUMAN",
      to: "/human",
      copy: settings.storyHuman,
      accent: "text-white",
      wash: "from-ink via-ink to-ink-3",
      art: (
        <span
          aria-hidden
          className="display pointer-events-none absolute -right-6 bottom-2 select-none text-[9rem] leading-none text-white/[0.05] lg:text-[13rem]"
        >
          H
        </span>
      ),
    },
    {
      key: "DMX",
      to: "/dmx",
      copy: settings.storyDmx,
      accent: "text-gold",
      wash: "from-royal-deep via-ink to-ink",
      art: (
        <span
          aria-hidden
          className="display pointer-events-none absolute -right-6 bottom-2 select-none text-[9rem] leading-none text-white/[0.05] lg:text-[13rem]"
        >
          D
        </span>
      ),
    },
  ];

  return (
    <section
      ref={scope}
      className="relative overflow-hidden bg-ink py-20 lg:py-24"
    >
      <BrickTexture />
      <span
        aria-hidden
        className="halftone absolute inset-0 text-white/[0.06]"
      />

      <div className="container-x relative">
        <SectionHeading
          tone="dark"
          align="center"
          eyebrow="Two Pages, Two Sides"
          title={
            <>
              Human <span className="text-gold">&</span> DMX
            </>
          }
          copy="One word on the back, one character on the front. The whole brand lives between them."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {panels.map((panel) => (
            <Link
              key={panel.key}
              to={panel.to}
              className={`split-panel group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl border border-line-dark bg-gradient-to-br p-8 lg:min-h-[26rem] lg:p-10 ${panel.wash}`}
            >
              {panel.art}

              <div className="relative">
                <p className="eyebrow-type text-white/45">The Two Sides</p>
                <h3
                  className={`display mt-3 text-6xl lg:text-7xl ${panel.accent}`}
                >
                  {panel.key}
                </h3>
                <SprayUnderline className="mt-2 text-gold/70" />
                <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                  {panel.copy}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition group-hover:text-gold">
                  Read the page
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorySplit;
