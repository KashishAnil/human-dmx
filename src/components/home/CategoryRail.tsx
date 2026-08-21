import { Link } from "react-router";
import { SectionHeading } from "../ui/Bits";
import { LinkButton } from "../ui/Button";
import { useActiveProducts, useCategories } from "../../hooks/useCommerce";
import { reveal, useGsap } from "../../lib/gsap";
import { resolveImage } from "../../utils/Functions";

const CategoryRail = () => {
  const products = useActiveProducts();
  const categories = useCategories();

  const scope = useGsap<HTMLElement>(({ scope }) => {
    reveal(scope, ".cat-tile", { stagger: 0.09 });
  }, []);

  return (
    <section ref={scope} className="container-x py-20 lg:py-24">
      <SectionHeading
        eyebrow="The Racks"
        title={
          <>
            Four ways to
            <br />
            wear <span className="text-royal">the name</span>
          </>
        }
        copy="Everything is printed and stitched on black. Pick your weight."
        action={
          <LinkButton to="/shop" variant="outline">
            All Products
          </LinkButton>
        }
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const count = products.filter(
            (p) => p.category === category.slug,
          ).length;
          return (
            <Link
              key={category.slug}
              to={`/shop/${category.slug}`}
              className="cat-tile group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(11,17,32,0.45)]"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-card">
                <img
                  src={resolveImage(category.image)}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-5 transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-royal px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  From ${category.price}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="display text-2xl text-head">{category.name}</h3>
                <p className="mt-1.5 text-xs text-body">{category.tagline}</p>
                <p className="mt-4 flex items-center gap-2 border-t border-line pt-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-head transition group-hover:text-royal">
                  {count} {count === 1 ? "style" : "styles"}
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryRail;
