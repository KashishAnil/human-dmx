import { useEffect } from "react";
import { useSettings } from "../../hooks/useCommerce";
import { Eyebrow, SectionHeading } from "../../components/ui/Bits";
import { LinkButton } from "../../components/ui/Button";
import Artwork from "../../components/brand/Artwork";
import { BrickTexture, SprayUnderline } from "../../components/brand/HipHop";

/** Sleeve scan of the 1986 debut. Drop the file in to replace the stand-in. */
const SLEEVE = "/images/brand/back-to-the-old-school.jpg";

const HIGHLIGHTS = [
  {
    year: "1986",
    title: "Back To The Old School",
    body: "Performed the human beatbox tracks on Just-Ice's debut album — the record that put the sound on wax — including “Gangster of Hip Hop.”",
  },
  {
    year: "Studio",
    title: "Mantronix & the electro wave",
    body: "Worked alongside the early electro and hip-hop production pioneers, including Kurtis Mantronik of Mantronix.",
  },
  {
    year: "Legacy",
    title: "Roots of the beatbox",
    body: "Part of the early roots of human beatboxing in New York hip-hop, alongside his contemporaries from the golden era.",
  },
];

const About = () => {
  const settings = useSettings();

  useEffect(() => {
    document.title = "About — HUMAN DMX APPAREL";
  }, []);

  return (
    <>
      {/* who he is */}
      <section className="relative overflow-hidden bg-navy py-20 text-white lg:py-28">
        <BrickTexture className="absolute inset-0 opacity-[0.06]" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 15%, rgba(47,111,224,0.28) 0%, transparent 65%)",
          }}
        />

        <div className="container-x relative grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20">
          <div>
            <Eyebrow className="text-gold">Brooklyn, New York</Eyebrow>
            <h1 className="display mt-5 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              Ben Paynes
              <span className="mt-2 block text-gold">Human DMX</span>
              <SprayUnderline className="mt-4 w-56 text-gold/70" />
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/80">
              Ben Paynes — better known by his stage name{" "}
              <span className="font-semibold text-white">Human DMX</span> — is
              an American hip-hop artist and beatboxer from Brooklyn, New York.
              He is best known for providing the human beatbox sounds for rapper{" "}
              <span className="font-semibold text-white">Just-Ice</span> on
              classic 1980s golden-era hip-hop tracks.
            </p>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60">
              Everything in this store comes off that history. The b-boy on the
              patch came off the record sleeves in 1986 and he hasn't aged a day
              since — now he's stitched on something you can wear.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton to="/shop" size="lg">
                Shop The Drop
              </LinkButton>
              <LinkButton to="/dmx" size="lg" variant="outline">
                The DMX Story
              </LinkButton>
            </div>
          </div>

          {/* the record */}
          <figure className="lg:justify-self-end">
            <div className="overflow-hidden rounded-xl border border-white/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
              <Artwork
                src={SLEEVE}
                alt="Just-Ice — Back To The Old School, 1986"
                className="aspect-square w-full max-w-[440px] object-cover"
                placeholder="Just-Ice — Back To The Old School (1986) · sleeve artwork goes here"
              />
            </div>
            <figcaption className="mt-4 max-w-[440px] text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/45">
              Just-Ice · Back To The Old School · Fresh Records, 1986 — the
              debut Human DMX beatboxed on.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* career */}
      <section className="border-b border-line bg-paper py-20 lg:py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="Career Highlights"
            title={
              <>
                On the <span className="text-royal">record</span>
              </>
            }
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-line bg-card p-7 transition hover:border-line-strong hover:shadow-[0_24px_50px_-34px_rgba(11,17,32,0.4)]"
              >
                <span className="display text-3xl text-gold">{item.year}</span>
                <h3 className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-head">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-body">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* the two halves of the brand */}
      <section className="bg-well/50 py-20 lg:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-8 lg:p-10">
            <Eyebrow className="text-royal">HUMAN</Eyebrow>
            <p className="mt-5 text-sm leading-relaxed text-body">
              {settings.storyHuman}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-8 lg:p-10">
            <Eyebrow className="text-gold-ink">DMX</Eyebrow>
            <p className="mt-5 text-sm leading-relaxed text-body">
              {settings.storyDmx}
            </p>
          </div>
        </div>

        <div className="container-x mt-12 text-center">
          <p className="text-sm text-body">
            Questions, wholesale or press —{" "}
            <a
              href={`mailto:${settings.supportEmail}`}
              className="font-semibold text-royal underline-offset-4 hover:underline"
            >
              {settings.supportEmail}
            </a>
          </p>
        </div>
      </section>
    </>
  );
};

export default About;
