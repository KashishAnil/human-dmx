import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  useActiveProducts,
  useCategoryLabel,
  useSettings,
} from "../../hooks/useCommerce";
import { useAppDispatch } from "../../redux/hooks";
import { openCart } from "../../redux/slices/cartSlice";
import {
  apiError,
  useAddToCartMutation,
  useGetProductQuery,
} from "../../redux/services/api";
import {
  Badge,
  EmptyState,
  SectionHeading,
  Stars,
} from "../../components/ui/Bits";
import { Button, LinkButton } from "../../components/ui/Button";
import ProductCard from "../../components/shop/ProductCard";
import {
  cn,
  isSoldOut,
  money,
  resolveImage,
  totalStock,
} from "../../utils/Functions";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  /**
   * Fetched by slug rather than filtered out of the catalog list, so the page
   * can tell "still loading" apart from "no such product" — the list-based
   * lookup flashed a 404 on every first paint.
   */
  const { data: product, isLoading } = useGetProductQuery(slug ?? "", {
    skip: !slug,
  });
  const products = useActiveProducts();
  const settings = useSettings();
  const categoryLabel = useCategoryLabel();
  const dispatch = useAppDispatch();
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openPanel, setOpenPanel] = useState<string | null>("details");
  const [flash, setFlash] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
    const firstAvailable = product?.variants.find((v) => v.stock > 0);
    setSize(firstAvailable ? firstAvailable.size : null);
    if (product) document.title = `${product.name} — HUMAN DMX APPAREL`;
  }, [product]);

  const related = useMemo(
    () =>
      products
        .filter((p) => p.id !== product?.id)
        .sort((a, b) => {
          const score = (x: typeof a) =>
            (x.category === product?.category ? 2 : 0) +
            (x.collection === product?.collection ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, 4),
    [products, product],
  );

  if (isLoading) {
    return (
      <div className="container-x py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-soft">
          Loading…
        </p>
      </div>
    );
  }

  if (!product || !product.active) {
    return (
      <div className="container-x py-24">
        <EmptyState
          icon="?"
          title="We can't find that piece"
          copy="It may have sold out and come off the site. Take a look at what's in stock now."
          action={<LinkButton to="/shop">Back to shop</LinkButton>}
        />
      </div>
    );
  }

  const soldOut = isSoldOut(product);
  const selectedStock =
    product.variants.find((v) => v.size === size)?.stock ?? 0;
  const onSale =
    product.compareAt !== null && product.compareAt > product.price;
  const oneSize = product.variants.length === 1;

  /**
   * The server is the authority on stock, so a failure here is real (someone
   * took the last one) rather than a validation slip — surface it instead of
   * optimistically showing the item as added.
   */
  const handleAdd = async () => {
    if (!size || selectedStock === 0) return;
    setAddError(null);
    try {
      await addToCart({ productId: product.id, size, qty }).unwrap();
      setFlash(true);
      dispatch(openCart());
      window.setTimeout(() => setFlash(false), 1400);
    } catch (error) {
      setAddError(apiError(error, "Couldn't add that to your bag."));
    }
  };

  const panels = [
    { key: "details", label: "Details & Fit", body: product.details },
    {
      key: "shipping",
      label: "Shipping",
      body: [settings.shippingPolicy],
    },
    {
      key: "exchanges",
      label: "Exchanges",
      body: [settings.exchangePolicy],
    },
  ];

  return (
    <>
      <div className="container-x pt-8">
        <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-soft">
          <Link to="/" className="transition hover:text-royal">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="transition hover:text-royal">
            Shop
          </Link>
          <span>/</span>
          <Link
            to={`/shop/${product.category}`}
            className="transition hover:text-royal"
          >
            {categoryLabel(product.category)}
          </Link>
          <span>/</span>
          <span className="text-head">{product.name}</span>
        </nav>
      </div>

      <section className="container-x grid gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14">
        {/* gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
            <div className="aspect-4/5 w-full bg-card">
              <img
                key={activeImage}
                src={resolveImage(product.images[activeImage])}
                alt={`${product.name} — view ${activeImage + 1}`}
                className="h-full w-full object-contain p-6"
                style={{ animation: "dmx-rise 400ms ease-out both" }}
              />
            </div>
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.badge && <Badge tone="gold">{product.badge}</Badge>}
              {onSale && (
                <Badge tone="coral">
                  Save {money(product.compareAt! - product.price)}
                </Badge>
              )}
              {soldOut && <Badge tone="muted">Sold Out</Badge>}
            </div>
            <span className="absolute right-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
              {product.collection} Collection
            </span>
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.map((image, i) => (
                <button
                  key={image + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "overflow-hidden rounded-lg border transition",
                    activeImage === i
                      ? "border-royal"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <img
                    src={resolveImage(image)}
                    alt=""
                    className="aspect-square w-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* buy box */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-soft">
            {categoryLabel(product.category)}
          </p>
          <h1 className="display mt-3 text-4xl text-head sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Stars rating={product.rating} count={product.reviewCount} />
            <span className="text-[11px] uppercase tracking-[0.16em] text-soft">
              {soldOut ? "Sold out" : `${totalStock(product)} in stock`}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="display text-4xl text-royal">
              {money(product.price)}
            </span>
            {onSale && (
              <span className="text-lg text-soft line-through">
                {money(product.compareAt!)}
              </span>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-body">
            {product.description}
          </p>

          {/* size */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
                {oneSize ? "Fit" : "Select Size"}
              </h2>
              {!oneSize && (
                <Link
                  to="/exchanges"
                  className="text-[11px] uppercase tracking-[0.14em] text-body transition hover:text-royal"
                >
                  Size swap policy
                </Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const disabled = variant.stock === 0;
                return (
                  <button
                    key={variant.size}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSize(variant.size);
                      setQty(1);
                    }}
                    className={cn(
                      "min-w-[4.5rem] rounded-full border px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition",
                      disabled &&
                        "cursor-not-allowed border-line text-soft line-through opacity-50",
                      !disabled && size === variant.size
                        ? "border-royal bg-royal text-white"
                        : !disabled &&
                            "border-line text-head hover:border-line-strong hover:bg-well",
                    )}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
            {size && selectedStock > 0 && selectedStock <= 5 && (
              <p className="mt-3 text-xs text-coral">
                Only {selectedStock} left in {size} — moving fast.
              </p>
            )}
          </div>

          {/* qty + add */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-14 items-center rounded-full border border-line">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-14 w-12 items-center justify-center rounded-l-full text-lg text-body transition hover:text-head"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold tabular-nums text-head">
                {qty}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQty((q) => Math.min(selectedStock || 1, q + 1))
                }
                disabled={qty >= selectedStock}
                aria-label="Increase quantity"
                className="flex h-14 w-12 items-center justify-center rounded-r-full text-lg text-body transition hover:text-head disabled:opacity-30"
              >
                +
              </button>
            </div>

            <Button
              size="lg"
              className="min-w-[15rem] flex-1"
              disabled={soldOut || !size || selectedStock === 0 || adding}
              onClick={handleAdd}
            >
              {soldOut
                ? "Sold Out"
                : flash
                  ? "Added ★"
                  : adding
                    ? "Adding…"
                    : `Add to Bag · ${money(product.price * qty)}`}
            </Button>
          </div>

          {addError && <p className="mt-3 text-xs text-coral">{addError}</p>}

          <ul className="mt-6 grid gap-2 text-[11px] uppercase tracking-[0.14em] text-soft">
            <li>
              ▲ Free shipping over {money(settings.freeShippingThreshold)} ·
              ships in 2 business days
            </li>
            <li>⇄ Exchanges only — 30 days, tags attached, no refunds</li>
            <li>★ Packed in Brooklyn by the artist</li>
          </ul>

          {/* accordions */}
          <div className="mt-10 divide-y divide-line border-y border-line">
            {panels.map((panel) => (
              <div key={panel.key}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPanel(openPanel === panel.key ? null : panel.key)
                  }
                  aria-expanded={openPanel === panel.key}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
                    {panel.label}
                  </span>
                  <span
                    className={cn(
                      "text-lg text-body transition-transform duration-300",
                      openPanel === panel.key && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                {openPanel === panel.key && (
                  <ul className="space-y-2 pb-6 text-sm leading-relaxed text-body">
                    {panel.body.map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-well/50 py-20">
          <div className="container-x">
            <SectionHeading
              eyebrow="Goes With It"
              title={
                <>
                  Complete the <span className="text-royal">fit</span>
                </>
              }
            />
            <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;
