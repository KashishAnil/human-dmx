import { LOOKBOOK } from "../../data/catalog";
import { resolveImage } from "../../utils/Functions";
import { SectionHeading } from "../ui/Bits";
import { reveal, useGsap } from "../../lib/gsap";

/** Asymmetric product wall — the client's own shots, given room to breathe. */
const SPANS = [
  "sm:col-span-2 sm:row-span-2",
  "",
  "",
  "sm:row-span-2",
  "sm:col-span-2",
  "",
  "",
  "",
];

const Lookbook = () => {
  const scope = useGsap<HTMLElement>(({ scope }) => {
    reveal(scope, "figure", {
      y: 40,
      scale: 0.96,
      stagger: 0.07,
      start: "top 78%",
    });
  }, []);

  return (
    <section ref={scope} className="container-x py-20 lg:py-24">
      <SectionHeading
        eyebrow="The Lookbook"
        title={
          <>
            Shot on the <span className="text-royal">block</span>
          </>
        }
        copy="No studio, no models. Just the pieces on the man who made them."
        align="center"
      />

      <div className="mt-12 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-4">
        {LOOKBOOK.map((shot, i) => (
          <figure
            key={shot.src + i}
            className={`group relative overflow-hidden rounded-xl border border-line bg-card ${SPANS[i] ?? ""}`}
          >
            <img
              src={resolveImage(shot.src)}
              alt={shot.caption}
              loading="lazy"
              className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <figcaption className="absolute bottom-3 left-4 translate-y-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {shot.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

export default Lookbook;
