import { useEffect } from "react";
import { useActiveProducts, useSettings } from "../../hooks/useCommerce";
import { IMG } from "../../data/catalog";
import { resolveImage } from "../../utils/Functions";
import ProductCard from "../../components/shop/ProductCard";
import { Eyebrow, Marquee, SectionHeading } from "../../components/ui/Bits";
import { LinkButton } from "../../components/ui/Button";
import { BrickTexture, SprayUnderline } from "../../components/brand/HipHop";
import { gsap, prefersReducedMotion, reveal, useGsap } from "../../lib/gsap";
import type { Collection } from "../../types";

interface StoryPageProps {
  collection: Collection;
}

const CONTENT: Record<
  Collection,
  {
    kicker: string;
    heading: string;
    lead: string;
    chapters: { title: string; body: string; plate: string }[];
    marquee: string[];
  }
> = {
  HUMAN: {
    kicker: "Page One",
    heading: "HUMAN",
    lead: "The word on the back. Plain type, arched high, nothing underneath it.",
    chapters: [
      {
        title: "One word, no explanation",
        body: "HUMAN goes on the back in a bone-white varsity serif and stops there. No slogan, no year, no list of cities. It's the half of the brand that doesn't need to say anything twice — the piece you put on to leave the house, not to make a statement.",
        plate: "1986",
      },
    ],
    marquee: [
      "HUMAN",
      "Brooklyn, New York",
      "Ring-Spun Cotton",
      "Arched Back Print",
      "Small Batch",
    ],
  },
  DMX: {
    kicker: "Page Two",
    heading: "DMX",
    lead: "The b-boy in the blue snapback. He came off the record sleeves in 1986 and never sat down.",
    chapters: [
      {
        title: "Doing the Human Box",
        body: "The name comes from the move — the Human Box — the routine that put the Human DMX on records with Just-Ice back in the mid-eighties. Back To The Old School dropped in 1986, Kool & Deadly followed, and the character stitched on this apparel is the one that was there for both.",
        plate: "BKLYN",
      },
    ],
    marquee: [
      "DMX",
      "Est. 1986",
      "Doing The Human Box",
      "Back To The Old School",
      "Kool & Deadly",
    ],
  },
};

const ChapterPlate = ({ plate, label }: { plate: string; label: string }) => (
  <figure className="relative overflow-hidden rounded-2xl border border-line-dark bg-navy">
    <BrickTexture />
    <span aria-hidden className="halftone absolute inset-0 text-white/[0.07]" />
    <div className="relative flex aspect-4/3 flex-col items-center justify-center gap-3 p-8">
      <span className="display text-[clamp(3rem,9vw,5.5rem)] leading-none text-white">
        {plate}
      </span>
      <SprayUnderline className="w-40 text-gold/80" />
      <span className="eyebrow-type text-white/45">{label} Collection</span>
    </div>
  </figure>
);

const StoryPage = ({ collection }: StoryPageProps) => {
  const products = useActiveProducts();
  const settings = useSettings();
  const content = CONTENT[collection];
  const collectionProducts = products.filter(
    (p) => p.collection === collection,
  );

  useEffect(() => {
    document.title = `${content.heading} — HUMAN DMX APPAREL`;
  }, [content.heading]);

  const scope = useGsap<HTMLDivElement>(
    ({ scope }) => {
      scope.querySelectorAll<HTMLElement>(".story-chapter").forEach((row) => {
        reveal(row, ":scope > *", { y: 44, stagger: 0.12, start: "top 80%" });
      });

      if (prefersReducedMotion()) return;

      gsap
        .timeline({ delay: 0.1 })
        .from(".story-kicker", { opacity: 0, x: -20, duration: 0.5 })
        .from(
          ".story-title",
          { yPercent: 110, opacity: 0, duration: 0.9, ease: "power4.out" },
          "-=0.25",
        )
        .from(
          ".story-lead, .story-sub, .story-cta",
          { opacity: 0, y: 22, duration: 0.55, stagger: 0.09 },
          "-=0.45",
        )
        .from(
          ".story-art",
          { scale: 0.6, opacity: 0, duration: 0.8, ease: "back.out(1.5)" },
          "-=0.7",
        );
    },
    [collection],
  );

  return (
    <div ref={scope}>
      {/* hero — the one dark band on these pages */}
      <section className="relative isolate overflow-hidden bg-ink">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-ink via-navy to-royal-deep"
        />
        <BrickTexture />
        <span
          aria-hidden
          className="halftone absolute inset-0 text-white/[0.07]"
        />

        <div className="container-x relative grid items-center gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <div className="story-kicker flex items-center gap-4">
              <Eyebrow tone="dark">{content.kicker}</Eyebrow>
            </div>
            <h1 className="display mt-6 overflow-hidden pb-[0.04em] text-[clamp(4rem,15vw,11rem)] leading-[0.85] text-white">
              <span className="story-title block">{content.heading}</span>
            </h1>
            <SprayUnderline className="story-lead w-56 text-gold/80" />
            <p className="story-lead mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              {content.lead}
            </p>
            <p className="story-sub mt-4 max-w-xl text-sm leading-relaxed text-muted">
              {collection === "HUMAN" ? settings.storyHuman : settings.storyDmx}
            </p>
            <div className="story-cta mt-10 flex flex-wrap gap-3">
              <LinkButton
                to={`/shop?collection=${collection}`}
                size="lg"
                variant="gold"
              >
                Shop {content.heading}
              </LinkButton>
              <LinkButton
                to={collection === "HUMAN" ? "/dmx" : "/human"}
                size="lg"
                variant="outline-light"
              >
                {collection === "HUMAN" ? "Read DMX →" : "Read HUMAN →"}
              </LinkButton>
            </div>
          </div>

          <div className="story-art relative hidden justify-center lg:flex">
            <img
              src={resolveImage(IMG.mascot)}
              alt=""
              className="w-full max-w-[300px] object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </section>

      <Marquee items={content.marquee} speed="slow" tone="blue" />

      {/* chapters */}
      <section className="container-x py-16 lg:py-20">
        <div className="space-y-16">
          {content.chapters.map((chapter, i) => (
            <article
              key={chapter.title}
              className={`story-chapter grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? "lg:[&>figure]:order-first" : ""
              }`}
            >
              <div>
                <p className="display text-6xl text-line-strong">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="display mt-4 text-4xl text-head lg:text-5xl">
                  {chapter.title}
                </h2>
                <p className="mt-6 text-base leading-relaxed text-body">
                  {chapter.body}
                </p>
              </div>
              <ChapterPlate plate={chapter.plate} label={content.heading} />
            </article>
          ))}
        </div>
      </section>

      {/* collection products — the one place client photography belongs */}
      {collectionProducts.length > 0 && (
        <section className="container-x py-16 lg:py-20">
          <SectionHeading
            eyebrow={`${content.heading} Collection`}
            title={
              <>
                Wear the <span className="text-royal">{content.heading}</span>
              </>
            }
            action={
              <LinkButton
                to={`/shop?collection=${collection}`}
                variant="outline"
              >
                See all
              </LinkButton>
            }
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {collectionProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StoryPage;
