import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { closeCart } from "../../redux/slices/cartSlice";
import {
  useRemoveCartLineMutation,
  useUpdateCartLineMutation,
} from "../../redux/services/api";
import { useCart, useSettings } from "../../hooks/useCommerce";
import { cn, money, resolveImage } from "../../utils/Functions";
import { Button, LinkButton } from "../ui/Button";

const QtyStepper = ({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) => (
  <div className="inline-flex h-8 items-center rounded-full border border-line">
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      aria-label="Decrease quantity"
      className="flex h-8 w-8 items-center justify-center rounded-l-full text-body transition hover:text-head"
    >
      −
    </button>
    <span className="w-7 text-center text-xs font-bold tabular-nums text-head">
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      disabled={value >= max}
      aria-label="Increase quantity"
      className="flex h-8 w-8 items-center justify-center rounded-r-full text-body transition hover:text-head disabled:opacity-30"
    >
      +
    </button>
  </div>
);

const CartDrawer = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const open = useAppSelector((s) => s.cart.drawerOpen);
  const settings = useSettings();
  const { lines, totals, adjustments } = useCart();
  const [updateLine] = useUpdateCartLineMutation();
  const [removeLine] = useRemoveCartLineMutation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeCart());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const progress = settings.freeShippingThreshold
    ? Math.min(100, (totals.subtotal / settings.freeShippingThreshold) * 100)
    : 100;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={() => dispatch(closeCart())}
        className={cn(
          "absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="display text-2xl text-head">
            Your Bag <span className="text-royal">({totals.itemCount})</span>
          </h2>
          <button
            type="button"
            onClick={() => dispatch(closeCart())}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-body transition hover:bg-well hover:text-head"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {totals.itemCount > 0 && settings.freeShippingThreshold > 0 && (
          <div className="border-b border-line bg-well/60 px-6 py-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-body">
              {totals.freeShippingRemaining > 0 ? (
                <>
                  <span className="font-bold text-royal">
                    {money(totals.freeShippingRemaining)}
                  </span>{" "}
                  away from free shipping
                </>
              ) : (
                <span className="font-bold text-mint">
                  Free shipping unlocked ★
                </span>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-royal to-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* The server reconciles the cart against live stock and prices on
            every read; anything it changed is explained here. */}
        {adjustments.length > 0 && (
          <ul className="border-b border-coral/30 bg-coral/10 px-6 py-3">
            {adjustments.map((note) => (
              <li
                key={note}
                className="text-[11px] leading-relaxed text-[#b23a33]"
              >
                {note}
              </li>
            ))}
          </ul>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="display text-5xl text-line-strong">∅</span>
              <p className="display mt-4 text-2xl text-head">Bag's Empty</p>
              <p className="mt-2 text-sm text-body">
                Nothing in here yet. Go find something.
              </p>
              <LinkButton to="/shop" className="mt-6" size="sm">
                Shop The Drop
              </LinkButton>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => {
                const max = line.stock;
                return (
                  <li key={line.key} className="flex gap-4 py-5">
                    <Link
                      to={`/product/${line.slug}`}
                      onClick={() => dispatch(closeCart())}
                      className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-well"
                    >
                      <img
                        src={resolveImage(line.image)}
                        alt={line.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/product/${line.slug}`}
                          onClick={() => dispatch(closeCart())}
                          className="text-sm font-bold leading-snug text-head transition hover:text-royal"
                        >
                          {line.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            removeLine({
                              productId: line.productId,
                              size: line.size,
                            })
                          }
                          aria-label={`Remove ${line.name}`}
                          className="shrink-0 text-soft transition hover:text-coral"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4">
                            <path
                              d="M5 5l10 10M15 5L5 15"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-soft">
                        Size {line.size}
                      </p>
                      {max > 0 && max <= 3 && (
                        <p className="mt-1 text-[11px] font-semibold text-coral">
                          Only {max} left
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <QtyStepper
                          value={line.qty}
                          max={Math.max(1, max)}
                          onChange={(n) =>
                            updateLine({
                              productId: line.productId,
                              size: line.size,
                              qty: n,
                            })
                          }
                        />
                        <span className="text-sm font-bold text-head">
                          {money(line.lineTotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line bg-card px-6 py-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-body">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-head">
                  {money(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between font-semibold text-mint">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{money(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-body">
                <dt>Shipping</dt>
                <dd className="tabular-nums text-head">
                  {totals.shippingCost === 0
                    ? "Free"
                    : money(totals.shippingCost)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="display text-xl text-head">Total</dt>
                <dd className="display text-xl tabular-nums text-head">
                  {money(totals.total)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-soft">
              Tax calculated at checkout · Exchanges only, no refunds
            </p>
            <Button
              block
              size="lg"
              className="mt-4"
              onClick={() => {
                dispatch(closeCart());
                navigate("/checkout");
              }}
            >
              Checkout · {money(totals.total)}
            </Button>
            <button
              type="button"
              onClick={() => {
                dispatch(closeCart());
                navigate("/cart");
              }}
              className="mt-3 w-full text-center text-[11px] font-bold uppercase tracking-[0.16em] text-body transition hover:text-head"
            >
              View Full Bag
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
