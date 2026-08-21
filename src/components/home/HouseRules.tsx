import { Link } from "react-router";
import { useSettings } from "../../hooks/useCommerce";
import { LinkButton } from "../ui/Button";
import { SectionHeading } from "../ui/Bits";
import { BrickTexture } from "../brand/HipHop";
import { money } from "../../utils/Functions";
import { reveal, useGsap } from "../../lib/gsap";

const HouseRules = () => {
  const settings = useSettings();

  const points = [
    {
      title: "Ships to all 50 states",
      copy: `Out of Brooklyn within 2 business days. Free over ${money(settings.freeShippingThreshold)}.`,
      icon: "▲",
    },
    {
      title: "Exchanges only",
      copy: "Wrong size? Swap it inside 30 days, tags on. No refunds — that's the house rule.",
      icon: "⇄",
    },
    {
      title: "Small batch runs",
      copy: "Printed in short runs so the pieces stay rare. Restocks are never guaranteed.",
      icon: "◆",
    },
    {
      title: "Straight from the artist",
      copy: "No middleman, no licensing. Every order is packed by the man on the hoodie.",
      icon: "★",
    },
  ];

  const scope = useGsap<HTMLElement>(({ scope }) => {
    reveal(scope, ".rule-card", { stagger: 0.09 });
  }, []);

  return (
    <section
      ref={scope}
      className="border-t border-line bg-well/50 py-20 lg:py-24"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="How We Run It"
          title={
            <>
              The house <span className="text-royal">rules</span>
            </>
          }
          align="center"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <div
              key={point.title}
              className="rule-card rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-32px_rgba(11,17,32,0.4)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-royal-tint text-lg text-royal">
                {point.icon}
              </span>
              <h3 className="display mt-5 text-xl text-head">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {point.copy}
              </p>
            </div>
          ))}
        </div>

        {/* closing banner */}
        <div className="relative mt-16 overflow-hidden rounded-3xl bg-royal-deep">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, #12388f 0%, #1f5fd0 55%, #12388f 100%)",
            }}
          />
          <BrickTexture />
          <span
            aria-hidden
            className="halftone absolute inset-0 text-white/10"
          />

          <div className="relative grid items-center gap-8 px-8 py-14 sm:px-12 lg:py-16">
            <div>
              <h3 className="display text-4xl text-white sm:text-5xl">
                Ready to get{" "}
                <span className="script normal-case text-gold">fitted?</span>
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75">
                Tees, hats and sweater hats start at $20. Hoodies are $40. Pick
                your piece and we'll get it out the door.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <LinkButton to="/shop" variant="gold" size="lg">
                  Shop The Drop
                </LinkButton>
                <Link
                  to="/exchanges"
                  className="inline-flex h-14 items-center px-5 text-xs font-bold uppercase tracking-[0.16em] text-white/80 transition hover:text-gold"
                >
                  Exchange Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HouseRules;
