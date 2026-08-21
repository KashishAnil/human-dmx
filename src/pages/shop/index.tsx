import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  useActiveProducts,
  useCategories,
  useCategoryLabel,
} from "../../hooks/useCommerce";
import ProductCard from "../../components/shop/ProductCard";
import { EmptyState } from "../../components/ui/Bits";
import { Button, LinkButton } from "../../components/ui/Button";
import { cn, isSoldOut, totalStock } from "../../utils/Functions";
import type { Product } from "../../types";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
];

const ALL_SIZES = ["One Size", "S", "M", "L", "XL", "XXL"];

const sortProducts = (list: Product[], key: SortKey) => {
  const copy = [...list];
  switch (key) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    default:
      return copy.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) || b.rating - a.rating,
      );
  }
};

const Shop = () => {
  const { category } = useParams<{ category?: string }>();
  const [params, setParams] = useSearchParams();
  const products = useActiveProducts();
  const categories = useCategories();
  const categoryLabel = useCategoryLabel();

  const query = params.get("q") ?? "";
  const sort = (params.get("sort") as SortKey) || "featured";
  const sizeParam = params.get("size") ?? "";
  const activeSizes = useMemo(
    () => sizeParam.split(",").filter(Boolean),
    [sizeParam],
  );
  const collection = params.get("collection") ?? "";
  const inStockOnly = params.get("stock") === "in";

  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = category
      ? `${categoryLabel(category)} — HUMAN DMX APPAREL`
      : "Shop — HUMAN DMX APPAREL";
  }, [category, categoryLabel]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const toggleSize = (size: string) => {
    const next = activeSizes.includes(size)
      ? activeSizes.filter((s) => s !== size)
      : [...activeSizes, size];
    setParam("size", next.join(",") || null);
  };

  const results = useMemo(() => {
    let list = products;

    if (category) list = list.filter((p) => p.category === category);
    if (collection) list = list.filter((p) => p.collection === collection);
    if (inStockOnly) list = list.filter((p) => !isSoldOut(p));

    if (activeSizes.length) {
      list = list.filter((p) =>
        p.variants.some((v) => activeSizes.includes(v.size) && v.stock > 0),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        [
          p.name,
          p.blurb,
          p.description,
          p.collection,
          categoryLabel(p.category),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return sortProducts(list, sort);
  }, [
    products,
    category,
    categoryLabel,
    collection,
    inStockOnly,
    activeSizes,
    query,
    sort,
  ]);

  const activeFilterCount =
    activeSizes.length + (collection ? 1 : 0) + (inStockOnly ? 1 : 0);

  const heading = category ? categoryLabel(category) : "All Products";

  const clearAll = () =>
    setParams(query ? { q: query } : {}, { replace: true });

  return (
    <>
      {/* header band */}
      <section className="grain relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 90% at 20% 0%, rgba(47,111,224,0.18) 0%, transparent 60%)",
          }}
        />
        <div className="container-x relative py-14 lg:py-20">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-soft">
            <Link to="/" className="transition hover:text-royal">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="transition hover:text-royal">
              Shop
            </Link>
            {category && (
              <>
                <span>/</span>
                <span className="text-head">{heading}</span>
              </>
            )}
          </nav>

          <h1 className="display mt-5 text-5xl text-head lg:text-7xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-body">
            {query
              ? `Results for "${query}" — ${results.length} ${results.length === 1 ? "piece" : "pieces"}.`
              : "Every piece printed on black, shipped from Brooklyn. Exchanges only."}
          </p>

          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
            <Link
              to="/shop"
              className={cn(
                "shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                !category
                  ? "border-royal bg-royal text-white"
                  : "border-line text-body hover:border-line-strong hover:text-head",
              )}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/shop/${c.slug}`}
                className={cn(
                  "shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                  category === c.slug
                    ? "border-royal bg-royal text-white"
                    : "border-line text-body hover:border-line-strong hover:text-head",
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          {/* filters */}
          <aside className={cn("lg:block", filtersOpen ? "block" : "hidden")}>
            <div className="sticky top-28 space-y-8 rounded-xl border border-line bg-card p-6 lg:border-0 lg:bg-transparent lg:p-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-head">
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] uppercase tracking-[0.14em] text-royal transition hover:text-head"
                  >
                    Clear ({activeFilterCount})
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                  Size
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition",
                        activeSizes.includes(size)
                          ? "border-royal bg-royal text-white"
                          : "border-line text-body hover:border-line-strong hover:text-head",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                  Collection
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["HUMAN", "DMX"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setParam("collection", collection === c ? null : c)
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                        collection === c
                          ? "border-royal bg-royal text-white"
                          : "border-line text-body hover:border-line-strong hover:text-head",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                  Availability
                </h3>
                <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-body">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) =>
                      setParam("stock", e.target.checked ? "in" : null)
                    }
                    className="h-4 w-4 accent-[#1f5fd0]"
                  />
                  In stock only
                </label>
              </div>

              <div className="rounded-xl border border-line bg-well/60 p-5 lg:mt-2">
                <p className="display text-lg text-head">Need a size swap?</p>
                <p className="mt-2 text-xs leading-relaxed text-body">
                  Exchanges are open for 30 days with tags on.
                </p>
                <LinkButton
                  to="/exchanges"
                  size="sm"
                  variant="outline"
                  className="mt-4"
                >
                  How it works
                </LinkButton>
              </div>
            </div>
          </aside>

          {/* results */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  {filtersOpen ? "Hide" : "Filters"}
                  {activeFilterCount > 0 && ` (${activeFilterCount})`}
                </Button>
                <p className="text-[11px] uppercase tracking-[0.16em] text-body">
                  {results.length} {results.length === 1 ? "piece" : "pieces"}
                </p>
              </div>

              <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-body">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="h-10 rounded-full border border-line bg-card px-4 text-[11px] uppercase tracking-[0.14em] text-head focus:border-royal focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon="✕"
                title="Nothing matches"
                copy="Try clearing a filter or searching for something else."
                action={
                  <Button onClick={clearAll} variant="outline">
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {results.length > 0 && (
              <p className="mt-14 border-t border-line pt-6 text-center text-[11px] uppercase tracking-[0.16em] text-soft">
                {results.reduce((sum, p) => sum + totalStock(p), 0)} units in
                stock across {results.length} styles
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Shop;
