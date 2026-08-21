import { LinkButton } from "../ui/Button";
import { useSettings } from "../../hooks/useCommerce";
import { gsap, prefersReducedMotion, useGsap } from "../../lib/gsap";
import { ImageUrl } from "../../utils/Functions";

const PROMISES = [
  { title: "Free over $75", copy: "Standard shipping, all 50 states" },
  { title: "Exchanges open", copy: "30 days, tags on — no refunds" },
  { title: "Small batch", copy: "Printed in short runs, Brooklyn" },
  { title: "From the artist", copy: "Packed by the man on the hoodie" },
];

/**
 * Hero banner — the client's banner artwork, untouched, with live text laid
 * over it.
 *
 * The artwork already carries its own headline on the left (top, on the
 * square crop), so a scrim tinted to the banner's own navy sits over that
 * region: the baked-in type is covered, the subject stays clear, and the copy
 * on top comes from Admin → Content so it stays editable and selectable.
 */
const Hero = () => {
  const settings = useSettings();
  const [line1, line2] = settings.heroTitle.split("\n");

  const scope = useGsap<HTMLElement>(({ scope }) => {
    if (prefersReducedMotion()) return;

    const INTRO =
      ".hero-eyebrow, .hero-line, .hero-sub, .hero-cta, .hero-stat, .hero-art";

    const guard = window.setTimeout(() => {
      gsap.set(scope.querySelectorAll(INTRO), {
        clearProps: "opacity,transform",
      });
    }, 3000);

    gsap
      .timeline({ delay: 0.1, onComplete: () => window.clearTimeout(guard) })
      .from(".hero-art", {
        opacity: 0,
        scale: 1.05,
        duration: 1,
        ease: "power3.out",
      })
      .from(
        ".hero-eyebrow",
        { opacity: 0, x: -22, duration: 0.55, ease: "power3.out" },
        0.15,
      )
      .from(
        ".hero-line",
        {
          yPercent: 115,
          opacity: 0,
          duration: 0.8,
          ease: "power4.out",
          stagger: 0.1,
        },
        "-=0.3",
      )
      .from(".hero-sub", { opacity: 0, y: 20, duration: 0.55 }, "-=0.4")
      .from(
        ".hero-cta",
        { opacity: 0, y: 18, duration: 0.5, stagger: 0.09 },
        "-=0.3",
      )
      .from(
        ".hero-stat",
        { opacity: 0, y: 16, duration: 0.45, stagger: 0.08 },
        "-=0.28",
      );
  }, []);

  return (
    <>
      <section
        ref={scope}
        className="relative isolate flex min-h-[600px] items-start overflow-hidden bg-navy md:min-h-[520px] md:items-center lg:min-h-[580px]"
      >
        {/* the banner artwork, unchanged */}
        <picture className="hero-art absolute inset-0">
          <source
            media="(min-width: 768px)"
            srcSet={ImageUrl("/images/banners/hero-wide.jpg")}
          />
          <img
            src={ImageUrl("/images/banners/hero-square.jpg")}
            alt="Human DMX Apparel — new drop, streetwear essentials"
            fetchPriority="high"
            className="h-full w-full object-cover object-bottom md:object-right"
          />
        </picture>

        {/* scrim over the artwork's own lettering */}
        <div
          aria-hidden
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(19,32,68,0.99) 0%, rgba(19,32,68,0.99) 44%, rgba(19,32,68,0.85) 53%, rgba(19,32,68,0.4) 63%, rgba(19,32,68,0.04) 76%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(19,32,68,0.99) 0%, rgba(19,32,68,0.99) 46%, rgba(19,32,68,0.9) 54%, rgba(19,32,68,0.45) 63%, rgba(19,32,68,0.04) 76%)",
          }}
        />

        <div className="container-x relative w-full py-12 md:py-14">
          <div className="max-w-xl">
            <p className="hero-eyebrow eyebrow-type flex items-center gap-3 text-gold">
              <span className="h-px w-9 bg-gold/60" />
              {settings.heroEyebrow}
            </p>

            <h1 className="display mt-5 text-[clamp(2.7rem,7vw,5.2rem)] text-white">
              <span className="block overflow-hidden pb-[0.05em]">
                <span className="hero-line block">{line1}</span>
              </span>
              {line2 && (
                <span className="block overflow-hidden pb-[0.05em]">
                  <span className="hero-line block text-gold">{line2}</span>
                </span>
              )}
            </h1>

            <p className="hero-sub mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              {settings.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton
                to="/shop"
                variant="gold"
                size="lg"
                className="hero-cta"
              >
                {settings.heroCta}
                <span aria-hidden>→</span>
              </LinkButton>
              <LinkButton
                to="/dmx"
                variant="outline-light"
                size="lg"
                className="hero-cta"
              >
                The Story
              </LinkButton>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/20 pt-6">
              {[
                { v: "1986", l: "Debut year" },
                { v: "$20", l: "Tees, hats & beanies" },
                { v: "$40", l: "Hoodies" },
              ].map((stat) => (
                <div key={stat.l} className="hero-stat">
                  <dt className="display text-2xl text-white sm:text-3xl">
                    {stat.v}
                  </dt>
                  <dd className="eyebrow-type mt-1 text-white/55">{stat.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* promise strip */}
      <section className="border-b border-line bg-card">
        <div className="container-x grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="px-1 py-6 lg:px-7">
              <p className="flex items-center gap-2.5 text-sm font-bold text-head">
                <span className="text-brass">◆</span>
                {promise.title}
              </p>
              <p className="mt-1.5 pl-6 text-xs text-body">{promise.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Hero;
