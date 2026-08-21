import { useEffect } from "react";
import { Link } from "react-router";
import { useSettings } from "../../hooks/useCommerce";
import { Eyebrow } from "../../components/ui/Bits";
import { LinkButton } from "../../components/ui/Button";
import { money } from "../../utils/Functions";

const Exchanges = () => {
  const settings = useSettings();

  useEffect(() => {
    document.title = "Exchanges & Shipping — HUMAN DMX APPAREL";
  }, []);

  const steps = [
    {
      title: "Email us within 30 days",
      body: `Send your order number to ${settings.supportEmail} and tell us what you'd like instead — a different size, or a different piece at the same price.`,
    },
    {
      title: "We send a prepaid label",
      body: "You'll get a label back the same or next business day. Pack the item with the tags still attached and drop it off.",
    },
    {
      title: "Your swap ships out",
      body: "As soon as the package scans, we put the replacement in the mail. No second shipping charge on the exchange.",
    },
  ];

  const rules = [
    ["Exchange window", "30 days from delivery"],
    ["Condition", "Unworn, unwashed, tags attached"],
    ["Refunds", "Not offered — exchanges only"],
    ["Return shipping", "Prepaid label provided by us"],
    ["Sale items", "Eligible for exchange, same terms"],
    ["Ships to", "All 50 states"],
    ["Standard delivery", "3–7 business days"],
    ["Free shipping", `Orders over ${money(settings.freeShippingThreshold)}`],
  ];

  return (
    <div className="container-x py-16 lg:py-24">
      <Eyebrow>Policies</Eyebrow>
      <h1 className="display mt-5 text-5xl text-head lg:text-7xl">
        Exchanges &amp; <span className="text-royal">Shipping</span>
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-body">
        Straight up: we do exchanges, not refunds. If the fit isn't right we'll
        swap it — that's been the rule since day one, and it's the same for
        everybody.
      </p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-14">
          <section>
            <h2 className="display text-3xl text-head">
              How an exchange works
            </h2>
            <ol className="mt-8 space-y-8">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-5">
                  <span className="display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-royal/30 bg-royal-tint text-lg text-royal">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="display text-xl text-head">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-body">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="display text-3xl text-head">The full policy</h2>
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-body">
              <p>{settings.exchangePolicy}</p>
              <p>{settings.shippingPolicy}</p>
              <p>
                Anything that arrives damaged or incorrect gets sorted out
                directly — email us a photo and we'll replace it, no label
                needed.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-card p-8">
            <h2 className="display text-2xl text-head">Already ordered?</h2>
            <p className="mt-2 text-sm text-body">
              Look up your order and start the exchange from the order page.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton to="/track">Track an order</LinkButton>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-xs font-semibold uppercase tracking-[0.18em] text-head transition hover:border-royal hover:text-royal"
              >
                Email us
              </a>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-7">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-head">
              At a glance
            </h2>
            <dl className="mt-6 divide-y divide-line">
              {rules.map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 py-3.5">
                  <dt className="text-xs uppercase tracking-[0.12em] text-soft">
                    {term}
                  </dt>
                  <dd className="text-right text-xs font-semibold text-head">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 rounded-2xl border border-royal/25 bg-royal-tint p-7">
            <p className="display text-lg text-royal">Not sure on size?</p>
            <p className="mt-2 text-xs leading-relaxed text-body">
              Hoodies and tees run true to size but the 1986 fit is roomy on
              purpose. If you're between sizes, take the smaller one.
            </p>
            <Link
              to="/shop"
              className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-royal transition hover:text-head"
            >
              Back to shop →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Exchanges;
