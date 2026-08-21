import { useState } from "react";
import { Link } from "react-router";
import Crest from "../brand/Crest";
import { useCategories, useSettings } from "../../hooks/useCommerce";
import { Button } from "../ui/Button";

const Footer = () => {
  const categories = useCategories();
  const settings = useSettings();
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-ink">
      <span
        aria-hidden
        className="halftone absolute inset-0 text-white/[0.05]"
      />

      <div className="container-x relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Crest size={92} tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Apparel out of Brooklyn, built off a 1986 debut. Doing the Human
              Box, still.
            </p>
          </div>

          <nav>
            <h3 className="eyebrow-type text-white">Shop</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/shop/${c.slug}`}
                    className="transition hover:text-gold"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/shop" className="transition hover:text-gold">
                  All Products
                </Link>
              </li>
            </ul>
          </nav>

          <nav>
            <h3 className="eyebrow-type text-white">Info</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              <li>
                <Link to="/human" className="transition hover:text-gold">
                  Human
                </Link>
              </li>
              <li>
                <Link to="/dmx" className="transition hover:text-gold">
                  DMX
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-gold">
                  About Human DMX
                </Link>
              </li>
              <li>
                <Link to="/exchanges" className="transition hover:text-gold">
                  Exchanges &amp; Shipping
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="transition hover:text-gold"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow-type text-white">The List</h3>
            <p className="mt-5 text-sm text-muted">
              Drops go out here first. No spam, just the work.
            </p>
            {joined ? (
              <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
                You're on the list. Watch your inbox.
              </p>
            ) : (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setJoined(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="h-11 min-w-0 flex-1 rounded-full border border-line-dark bg-ink-2 px-4 text-sm text-bone placeholder:text-muted-2 focus:border-gold focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="shrink-0"
                >
                  Join
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line-dark pt-7 text-[11px] uppercase tracking-[0.14em] text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Human DMX Apparel · Brooklyn, NY</p>
          <p className="text-gold/80">Exchanges only — no refunds</p>
          <Link to="/admin" className="transition hover:text-gold">
            Merchant Portal
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
