import { useMemo, useState } from "react";
import { useActiveProducts, useCategories } from "../../hooks/useCommerce";
import ProductCard from "../shop/ProductCard";
import { SectionHeading } from "../ui/Bits";
import { LinkButton } from "../ui/Button";
import { cn } from "../../utils/Functions";
import { reveal, useGsap } from "../../lib/gsap";

const FeaturedDrop = () => {
  const products = useActiveProducts();
  const categories = useCategories();
  // Tab strip: "Everything" plus whatever categories the merchant has live.
  const FILTERS = [{ slug: "all", name: "Everything" }, ...categories];
  const [filter, setFilter] = useState("all");

  const shown = useMemo(() => {
    const featured = products.filter((p) => p.featured);
    const pool = featured.length >= 4 ? featured : products;
    return (
      filter === "all" ? pool : pool.filter((p) => p.category === filter)
    ).slice(0, 8);
  }, [products, filter]);

  const scope = useGsap<HTMLElement>(({ scope }) => {
    reveal(scope, "article", { y: 46, stagger: 0.08, start: "top 78%" });
  }, []);

  return (
    <section
      ref={scope}
      className="border-y border-line bg-well/50 py-20 lg:py-24"
    >
      <div className="container-x">
        <SectionHeading
          eyebrow="In Stock Now"
          title={
            <>
              The current <span className="text-royal">drop</span>
            </>
          }
          copy="Hand-printed in small runs. When a size is gone, it's gone until the next batch."
        />

        <div className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => setFilter(f.slug)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition",
                filter === f.slug
                  ? "border-royal bg-royal text-white"
                  : "border-line bg-card text-body hover:border-line-strong hover:text-head",
              )}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {shown.length === 0 && (
          <p className="mt-12 text-center text-sm text-body">
            Nothing in this category right now — check back soon.
          </p>
        )}

        <div className="mt-14 flex justify-center">
          <LinkButton to="/shop" variant="dark" size="lg">
            Shop All Products →
          </LinkButton>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDrop;
