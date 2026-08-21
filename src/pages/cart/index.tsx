import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  apiError,
  useApplyPromoMutation,
  useChangeCartSizeMutation,
  useRemoveCartLineMutation,
  useRemovePromoMutation,
  useUpdateCartLineMutation,
} from "../../redux/services/api";
import {
  useActiveProducts,
  useCart,
  useSettings,
} from "../../hooks/useCommerce";
import { cn, money, resolveImage } from "../../utils/Functions";
import { Button, LinkButton } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Bits";

const Cart = () => {
  const { lines, totals, promo, adjustments } = useCart();
  const settings = useSettings();
  const products = useActiveProducts();

  const [updateLine] = useUpdateCartLineMutation();
  const [removeLine] = useRemoveCartLineMutation();
  const [changeSize] = useChangeCartSizeMutation();
  const [applyPromo, { isLoading: applying }] = useApplyPromoMutation();
  const [removePromo] = useRemovePromoMutation();

  const [code, setCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Your Bag — HUMAN DMX APPAREL";
  }, []);

  /**
   * Validation happens server-side — it's the only place that knows the true
   * subtotal, whether the code is still active and how many times it has been
   * redeemed.
   */
  const submitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = code.trim().toUpperCase();
    if (!entered) return;

    try {
      await applyPromo(entered).unwrap();
      setPromoError(null);
      setCode("");
    } catch (error) {
      setPromoError(apiError(error, "That code isn't valid right now."));
    }
  };

  if (lines.length === 0) {
    return (
      <div className="container-x py-24">
        <h1 className="display mb-10 text-5xl text-head">Your Bag</h1>
        <EmptyState
          icon="∅"
          title="Nothing in the bag"
          copy="Hoodies run $40, everything else is $20. Go pick something out."
          action={<LinkButton to="/shop">Shop The Drop</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="container-x py-14 lg:py-20">
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-soft">
        <Link to="/" className="transition hover:text-royal">
          Home
        </Link>
        <span>/</span>
        <span className="text-head">Bag</span>
      </nav>

      <h1 className="display mt-5 text-5xl text-head lg:text-6xl">
        Your Bag <span className="text-royal">({totals.itemCount})</span>
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => {
              const max = line.stock;
              // Sibling sizes come from the catalog, for the size switcher.
              const variants =
                products.find((p) => p.id === line.productId)?.variants ?? [];
              return (
                <li key={line.key} className="flex gap-5 py-6">
                  <Link
                    to={`/product/${line.slug}`}
                    className="h-36 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-well sm:h-40 sm:w-32"
                  >
                    <img
                      src={resolveImage(line.image)}
                      alt={line.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${line.slug}`}
                          className="display text-xl text-head transition hover:text-royal"
                        >
                          {line.name}
                        </Link>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="display text-xl text-royal">
                          {money(line.lineTotal)}
                        </p>
                        {line.qty > 1 && (
                          <p className="text-[11px] text-soft">
                            {money(line.price)} each
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
                      {variants.length > 1 ? (
                        <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-body">
                          Size
                          <select
                            value={line.size}
                            onChange={(e) =>
                              changeSize({
                                productId: line.productId,
                                size: line.size,
                                newSize: e.target.value,
                              })
                            }
                            className="h-9 rounded-full border border-line bg-card px-3 text-[11px] font-semibold uppercase text-head focus:border-royal focus:outline-none"
                          >
                            {variants.map((v) => (
                              <option
                                key={v.size}
                                value={v.size}
                                disabled={v.stock === 0}
                              >
                                {v.size}
                                {v.stock === 0 ? " — sold out" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <span className="text-[11px] uppercase tracking-[0.14em] text-body">
                          One Size
                        </span>
                      )}

                      <div className="inline-flex h-9 items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() =>
                            updateLine({
                              productId: line.productId,
                              size: line.size,
                              qty: line.qty - 1,
                            })
                          }
                          aria-label="Decrease quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-l-full text-body transition hover:text-head"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums text-head">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          disabled={line.qty >= max}
                          onClick={() =>
                            updateLine({
                              productId: line.productId,
                              size: line.size,
                              qty: line.qty + 1,
                            })
                          }
                          aria-label="Increase quantity"
                          className="flex h-9 w-9 items-center justify-center rounded-r-full text-body transition hover:text-head disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeLine({
                            productId: line.productId,
                            size: line.size,
                          })
                        }
                        className="text-[11px] uppercase tracking-[0.14em] text-soft transition hover:text-coral"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-body transition hover:text-royal"
          >
            ← Keep shopping
          </Link>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-7">
            <h2 className="display text-2xl text-head">Summary</h2>

            <form onSubmit={submitPromo} className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                Promo code
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="OLDSCHOOL86"
                  className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm uppercase text-head placeholder:text-soft focus:border-royal focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={applying}
                >
                  {applying ? "…" : "Apply"}
                </Button>
              </div>
              {promoError && (
                <p className="mt-2 text-xs text-coral">{promoError}</p>
              )}
              {promo && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-royal/30 bg-royal-tint px-4 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-royal">
                    {promo.code} applied
                  </span>
                  <button
                    type="button"
                    onClick={() => removePromo()}
                    className="text-xs text-body transition hover:text-head"
                  >
                    Remove
                  </button>
                </div>
              )}
              {adjustments.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {adjustments.map((note) => (
                    <li key={note} className="text-xs text-coral">
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </form>

            <dl className="mt-7 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between text-body">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-head">
                  {money(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-royal">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{money(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-body">
                <dt>Shipping</dt>
                <dd
                  className={cn(
                    "tabular-nums",
                    totals.shippingCost === 0 ? "text-royal" : "text-head",
                  )}
                >
                  {totals.shippingCost === 0
                    ? "Free"
                    : money(totals.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between text-body">
                <dt>Estimated tax</dt>
                <dd className="tabular-nums text-head">{money(totals.tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="display text-xl text-head">Total</dt>
                <dd className="display text-2xl tabular-nums text-royal">
                  {money(totals.total)}
                </dd>
              </div>
            </dl>

            {totals.freeShippingRemaining > 0 && (
              <p className="mt-4 rounded-lg bg-well px-4 py-3 text-xs text-body">
                Add{" "}
                <span className="font-bold text-royal">
                  {money(totals.freeShippingRemaining)}
                </span>{" "}
                more for free shipping.
              </p>
            )}

            <LinkButton to="/checkout" size="lg" block className="mt-6">
              Checkout
            </LinkButton>

            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.16em] text-soft">
              Exchanges only · No refunds · Ships to all 50 states
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-head">
              Shipping
            </p>
            <p className="mt-2 text-xs leading-relaxed text-body">
              {settings.shippingPolicy}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
