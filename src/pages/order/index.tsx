import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useSettings } from "../../hooks/useCommerce";
import {
  apiError,
  useRequestExchangeMutation,
  useTrackOrderQuery,
} from "../../redux/services/api";
import { emailForOrder } from "../../utils/recentOrders";
import { Badge, EmptyState } from "../../components/ui/Bits";
import { Button, LinkButton } from "../../components/ui/Button";
import {
  cn,
  formatDate,
  formatDateTime,
  money,
  resolveImage,
} from "../../utils/Functions";
import type { OrderStatus } from "../../types";
import { STATUS_LABEL, STATUS_TONE } from "../../utils/orderStatus";

const TRACK_STEPS: OrderStatus[] = [
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const OrderDetail = () => {
  const { number } = useParams<{ number: string }>();
  const settings = useSettings();

  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeNote, setExchangeNote] = useState("");
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  /**
   * Orders are fetched by number *plus* the email they were placed with — the
   * API won't serve one on the number alone. For a guest that email comes from
   * what this device recorded at checkout; without it we send them to the
   * lookup form rather than showing someone else's receipt.
   */
  const email = emailForOrder(number);
  const { data: order, isLoading } = useTrackOrderQuery(
    { number: number ?? "", email: email ?? "" },
    { skip: !number || !email },
  );

  const [requestExchange, { isLoading: submittingExchange }] =
    useRequestExchangeMutation();

  useEffect(() => {
    document.title = order
      ? `Order ${order.number} — HUMAN DMX APPAREL`
      : "Order — HUMAN DMX APPAREL";
  }, [order]);

  if (isLoading) {
    return (
      <div className="container-x py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-soft">
          Loading order…
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-x py-24">
        <EmptyState
          icon="?"
          title="Order not found"
          copy={`We couldn't find an order numbered ${number}. Check the number on your confirmation email.`}
          action={<LinkButton to="/track">Look it up again</LinkButton>}
        />
      </div>
    );
  }

  const stepIndex = TRACK_STEPS.indexOf(order.status);
  const isTerminal = order.status === "cancelled";
  const toneClass = STATUS_TONE[order.status];

  return (
    <div className="container-x py-14 lg:py-20">
      <div className="rounded-2xl border border-line bg-gradient-to-b from-royal-tint to-transparent p-8 lg:p-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-royal">
          {order.status === "pending" ? "Order received" : "Thank you"}
        </p>
        <h1 className="display mt-4 text-4xl text-head lg:text-6xl">
          Order {order.number}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-body">
          Placed {formatDate(order.createdAt)} · confirmation sent to{" "}
          <span className="text-head">{order.customer.email}</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]",
              toneClass,
            )}
          >
            {STATUS_LABEL[order.status]}
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-soft">
            {order.lines.reduce((s, l) => s + l.qty, 0)} items ·{" "}
            {money(order.total)}
          </span>
        </div>
      </div>

      {/* progress */}
      {!isTerminal && (
        <div className="mt-8 rounded-2xl border border-line bg-card p-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
            Where it's at
          </h2>
          <ol className="mt-7 grid gap-6 sm:grid-cols-4">
            {TRACK_STEPS.map((step, i) => {
              const done = stepIndex >= i || order.status === "exchange";
              return (
                <li key={step} className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                        done
                          ? "bg-gold text-ink"
                          : "border border-line text-soft",
                      )}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    {i < TRACK_STEPS.length - 1 && (
                      <span
                        className={cn(
                          "hidden h-px flex-1 sm:block",
                          stepIndex > i ? "bg-gold" : "bg-line",
                        )}
                      />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      done ? "text-head" : "text-soft",
                    )}
                  >
                    {STATUS_LABEL[step]}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-line bg-card p-7">
            <h2 className="display text-xl text-head">Items</h2>
            <ul className="mt-6 divide-y divide-line">
              {order.lines.map((line, i) => (
                <li
                  key={`${line.productId}-${line.size}-${i}`}
                  className="flex gap-4 py-4"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line">
                    <img
                      src={resolveImage(line.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-head">
                      {line.name}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-soft">
                      Size {line.size} · Qty {line.qty}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-royal">
                    {money(line.price * line.qty)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-card p-7">
            <h2 className="display text-xl text-head">History</h2>
            <ol className="mt-6 space-y-5">
              {[...order.timeline].reverse().map((event, i) => (
                <li key={`${event.at}-${i}`} className="flex gap-4">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <p className="text-sm text-head">{event.note}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-soft">
                      {formatDateTime(event.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* exchange request */}
          {["delivered", "shipped"].includes(order.status) && (
            <section className="rounded-2xl border border-line bg-card p-7">
              <h2 className="display text-xl text-head">
                Need a different size?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {settings.exchangePolicy}
              </p>
              {exchangeOpen ? (
                <div className="mt-5">
                  <textarea
                    value={exchangeNote}
                    onChange={(e) => setExchangeNote(e.target.value)}
                    rows={3}
                    placeholder="Tell us which piece and which size you'd like instead."
                    className="w-full rounded-lg border border-line bg-paper p-4 text-sm text-head placeholder:text-soft focus:border-royal focus:outline-none"
                  />
                  <div className="mt-3 flex gap-3">
                    <Button
                      size="sm"
                      disabled={!exchangeNote.trim() || submittingExchange}
                      onClick={async () => {
                        setExchangeError(null);
                        try {
                          await requestExchange({
                            id: order.id,
                            note: exchangeNote.trim(),
                            // Proves ownership for a guest with no session.
                            email: order.customer.email,
                          }).unwrap();
                          setExchangeOpen(false);
                          setExchangeNote("");
                        } catch (error) {
                          setExchangeError(
                            apiError(error, "Couldn't submit that request."),
                          );
                        }
                      }}
                    >
                      {submittingExchange ? "Sending…" : "Submit request"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExchangeOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {exchangeError && (
                    <p className="mt-3 text-xs text-coral">{exchangeError}</p>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={() => setExchangeOpen(true)}
                >
                  Request an exchange
                </Button>
              )}
            </section>
          )}

          {order.status === "exchange" && order.exchangeNote && (
            <section className="rounded-2xl border border-coral/40 bg-coral/5 p-7">
              <Badge tone="coral">Exchange in progress</Badge>
              <p className="mt-4 text-sm leading-relaxed text-body">
                {order.exchangeNote}
              </p>
              <p className="mt-3 text-xs text-soft">
                We'll email a prepaid label to {order.customer.email}.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-card p-7">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
              Totals
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-body">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-head">
                  {money(order.subtotal)}
                </dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-royal">
                  <dt>{order.promoCode}</dt>
                  <dd className="tabular-nums">−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-body">
                <dt>Shipping</dt>
                <dd className="tabular-nums text-head">
                  {order.shippingCost === 0
                    ? "Free"
                    : money(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between text-body">
                <dt>Tax</dt>
                <dd className="tabular-nums text-head">{money(order.tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="display text-lg text-head">Total</dt>
                <dd className="display text-xl tabular-nums text-royal">
                  {money(order.total)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-soft">
              Card ending {order.paymentLast4}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-7">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
              Shipping to
            </h2>
            <address className="mt-4 text-sm not-italic leading-relaxed text-body">
              {order.customer.firstName} {order.customer.lastName}
              <br />
              {order.shipping.address1}
              {order.shipping.address2 && (
                <>
                  <br />
                  {order.shipping.address2}
                </>
              )}
              <br />
              {order.shipping.city}, {order.shipping.state} {order.shipping.zip}
              <br />
              {order.shipping.country}
            </address>
          </div>

          <div className="rounded-2xl border border-line bg-card p-7">
            <p className="text-sm text-body">Questions about this order?</p>
            <a
              href={`mailto:${settings.supportEmail}?subject=Order ${order.number}`}
              className="mt-2 block text-sm font-semibold text-royal transition hover:text-head"
            >
              {settings.supportEmail}
            </a>
          </div>

          <LinkButton to="/shop" variant="outline" block>
            Keep Shopping
          </LinkButton>
        </aside>
      </div>

      <p className="mt-12 text-center text-[11px] uppercase tracking-[0.16em] text-soft">
        <Link to="/" className="transition hover:text-royal">
          ← Back to Human DMX Apparel
        </Link>
      </p>
    </div>
  );
};

export default OrderDetail;
