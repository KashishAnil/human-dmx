import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart, useSettings } from "../../hooks/useCommerce";
import { apiError, useCheckoutMutation } from "../../redux/services/api";
import { rememberOrder } from "../../utils/recentOrders";
import Crest from "../../components/brand/Crest";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Bits";
import { cn, money, resolveImage } from "../../utils/Functions";

const STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

const STEPS = ["Contact", "Shipping", "Payment"] as const;

interface Form {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  notes: string;
}

const EMPTY: Form = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "NY",
  zip: "",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  notes: "",
};

const Field = ({
  label,
  error,
  className,
  ...rest
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className={cn("block", className)}>
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
      {label}
    </span>
    <input
      {...rest}
      className={cn(
        "mt-2 h-12 w-full rounded-lg border bg-paper px-4 text-sm text-head placeholder:text-soft focus:outline-none",
        error ? "border-coral" : "border-line focus:border-royal",
      )}
    />
    {error && <span className="mt-1.5 block text-xs text-coral">{error}</span>}
  </label>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { lines, totals, promo } = useCart();
  const settings = useSettings();
  const [checkout, { isLoading: placing }] = useCheckoutMutation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [placed, setPlaced] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Checkout — HUMAN DMX APPAREL";
  }, []);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (index: number) => {
    const next: Partial<Record<keyof Form, string>> = {};

    if (index === 0) {
      if (!/^\S+@\S+\.\S+$/.test(form.email))
        next.email = "Enter a valid email.";
      if (form.phone.replace(/\D/g, "").length < 10)
        next.phone = "Enter a 10-digit phone number.";
    }

    if (index === 1) {
      if (!form.firstName.trim()) next.firstName = "Required.";
      if (!form.lastName.trim()) next.lastName = "Required.";
      if (!form.address1.trim()) next.address1 = "Required.";
      if (!form.city.trim()) next.city = "Required.";
      if (!/^\d{5}(-\d{4})?$/.test(form.zip)) next.zip = "Enter a 5-digit ZIP.";
    }

    if (index === 2) {
      if (!form.cardName.trim()) next.cardName = "Required.";
      if (form.cardNumber.replace(/\D/g, "").length < 15)
        next.cardNumber = "Enter a valid card number.";
      if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(form.expiry))
        next.expiry = "Use MM/YY.";
      if (!/^\d{3,4}$/.test(form.cvc)) next.cvc = "3 or 4 digits.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const advance = () => {
    if (!validate(step)) return;
    if (step < 2) setStep(step + 1);
  };

  /**
   * The server builds the order: it reprices every line against the live
   * catalog, decrements stock atomically and returns the finished record.
   * Nothing about the money is decided here — the totals rendered alongside
   * are the same ones the API computed for this cart.
   */
  const submit = async () => {
    if (!validate(2)) return;
    setSubmitError(null);

    try {
      const order = await checkout({
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
        },
        shipping: {
          address1: form.address1.trim(),
          address2: form.address2.trim(),
          city: form.city.trim(),
          state: form.state,
          zip: form.zip.trim(),
          country: "United States",
        },
        // Only the last four ever leave the browser.
        paymentLast4: form.cardNumber.replace(/\D/g, "").slice(-4),
      }).unwrap();

      // Lets a guest reopen the confirmation later without signing in.
      rememberOrder(order.number, order.customer.email);
      setPlaced(true);
      navigate(`/order/${order.number}`, { replace: true });
    } catch (error) {
      // 409 means the cart shifted underneath us (something sold out).
      setSubmitError(
        apiError(error, "We couldn't place that order. Please try again."),
      );
      setStep(2);
    }
  };

  if (lines.length === 0 && !placing && !placed) {
    return (
      <div className="container-x py-24">
        <EmptyState
          icon="∅"
          title="Nothing to check out"
          copy="Your bag is empty — add a piece and come back."
          action={
            <Link
              to="/shop"
              className="inline-flex h-11 items-center rounded-full bg-gold px-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink"
            >
              Shop The Drop
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="container-x flex h-[88px] items-center justify-between">
          <Link to="/" aria-label="HUMAN DMX APPAREL — home">
            <Crest size={56} />
          </Link>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Secure checkout
          </p>
        </div>
      </header>

      <div className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_400px] lg:gap-16 lg:py-16">
        <div>
          <nav className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="flex flex-1 items-center gap-2.5 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                    i < step && "bg-gold text-ink",
                    i === step && "bg-royal text-head ring-4 ring-royal/20",
                    i > step && "border border-line text-soft",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] font-semibold uppercase tracking-[0.16em] sm:block",
                    i <= step ? "text-head" : "text-soft",
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="ml-1 hidden h-px flex-1 bg-line sm:block" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-10">
            {step === 0 && (
              <section>
                <h1 className="display text-3xl text-head">Contact</h1>
                <p className="mt-2 text-sm text-body">
                  We'll send the order confirmation and tracking here.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={set("email")}
                    error={errors.email}
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(347) 555-0123"
                    value={form.phone}
                    onChange={set("phone")}
                    error={errors.phone}
                  />
                </div>
              </section>
            )}

            {step === 1 && (
              <section>
                <h1 className="display text-3xl text-head">Shipping Address</h1>
                <p className="mt-2 text-sm text-body">
                  We ship to all 50 states. Orders leave Brooklyn within 2
                  business days.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="First name"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={set("firstName")}
                    error={errors.firstName}
                  />
                  <Field
                    label="Last name"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={set("lastName")}
                    error={errors.lastName}
                  />
                  <Field
                    label="Address"
                    autoComplete="address-line1"
                    className="sm:col-span-2"
                    placeholder="2925 W 16th St"
                    value={form.address1}
                    onChange={set("address1")}
                    error={errors.address1}
                  />
                  <Field
                    label="Apt, suite (optional)"
                    autoComplete="address-line2"
                    className="sm:col-span-2"
                    placeholder="Apt 515"
                    value={form.address2}
                    onChange={set("address2")}
                  />
                  <Field
                    label="City"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={set("city")}
                    error={errors.city}
                  />
                  <div className="grid grid-cols-2 gap-5">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                        State
                      </span>
                      <select
                        value={form.state}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, state: e.target.value }))
                        }
                        className="mt-2 h-12 w-full rounded-lg border border-line bg-paper px-3 text-sm text-head focus:border-royal focus:outline-none"
                      >
                        {STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="ZIP"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="11224"
                      value={form.zip}
                      onChange={set("zip")}
                      error={errors.zip}
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h1 className="display text-3xl text-head">Payment</h1>
                <p className="mt-2 text-sm text-body">
                  Demo checkout — no card is charged and nothing is sent
                  anywhere. Wire this step to your processor before launch.
                </p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Name on card"
                    className="sm:col-span-2"
                    value={form.cardName}
                    onChange={set("cardName")}
                    error={errors.cardName}
                  />
                  <Field
                    label="Card number"
                    className="sm:col-span-2"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={form.cardNumber}
                    onChange={set("cardNumber")}
                    error={errors.cardNumber}
                  />
                  <Field
                    label="Expiry"
                    placeholder="12/28"
                    value={form.expiry}
                    onChange={set("expiry")}
                    error={errors.expiry}
                  />
                  <Field
                    label="CVC"
                    inputMode="numeric"
                    placeholder="123"
                    value={form.cvc}
                    onChange={set("cvc")}
                    error={errors.cvc}
                  />
                  <Field
                    label="Order notes (optional)"
                    className="sm:col-span-2"
                    placeholder="Leave with the doorman"
                    value={form.notes}
                    onChange={set("notes")}
                  />
                </div>

                <div className="mt-6 rounded-lg border border-line bg-card p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-royal">
                    Before you place it
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-body">
                    {settings.exchangePolicy}
                  </p>
                </div>
              </section>
            )}
          </div>

          <div className="mt-9 flex items-center gap-4">
            {step > 0 && (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={placing}
              >
                ← Back
              </Button>
            )}
            {step < 2 ? (
              <Button
                size="lg"
                onClick={advance}
                className="ml-auto min-w-[12rem]"
              >
                Continue
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={submit}
                disabled={placing}
                className="ml-auto min-w-[15rem]"
              >
                {placing
                  ? "Placing order…"
                  : `Place Order · ${money(totals.total)}`}
              </Button>
            )}
          </div>

          {submitError && (
            <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-xs text-[#b23a33]">
              {submitError}
            </p>
          )}
        </div>

        {/* order summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-7">
            <h2 className="display text-xl text-head">
              Order Summary{" "}
              <span className="text-royal">({totals.itemCount})</span>
            </h2>

            <ul className="mt-6 space-y-4 border-b border-line pb-6">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-line">
                    <img
                      src={resolveImage(line.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink">
                      {line.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-head">
                      {line.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-soft">
                      {line.size}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-head">
                    {money(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-body">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-head">
                  {money(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-royal">
                  <dt>{promo?.code}</dt>
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
              <div className="flex justify-between text-body">
                <dt>Tax</dt>
                <dd className="tabular-nums text-head">{money(totals.tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="display text-xl text-head">Total</dt>
                <dd className="display text-2xl tabular-nums text-royal">
                  {money(totals.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-soft">
              Exchanges only · No refunds
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
