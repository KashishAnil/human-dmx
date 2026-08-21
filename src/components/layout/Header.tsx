import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import Crest from "../brand/Crest";
import { cn } from "../../utils/Functions";
import { useAppDispatch } from "../../redux/hooks";
import { openCart } from "../../redux/slices/cartSlice";
import { useCart, useCategories, useSettings } from "../../hooks/useCommerce";

const NAV = [
  { to: "/shop", label: "Shop", end: true },
  { to: "/human", label: "Human" },
  { to: "/dmx", label: "DMX" },
  { to: "/about", label: "About" },
  { to: "/exchanges", label: "Exchanges" },
];

const Icon = ({ path, className }: { path: string; className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    className={cn("h-[18px] w-[18px]", className)}
  >
    <path
      d={path}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const categories = useCategories();
  const { totals } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* utility strip */}
      {settings.announcementActive && settings.announcement && (
        <div className="overflow-hidden bg-ink">
          <div className="flex whitespace-nowrap py-2">
            <div
              className="flex shrink-0 items-center gap-10 pr-10"
              style={{ animation: "marquee 46s linear infinite" }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="eyebrow-type flex items-center gap-10 text-bone/80"
                >
                  {settings.announcement}
                  <span className="text-gold">★</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* main bar */}
      <div
        className={cn(
          "border-b bg-card/95 backdrop-blur-xl transition-shadow duration-300",
          scrolled
            ? "border-line shadow-[0_10px_30px_-24px_rgba(11,17,32,0.5)]"
            : "border-line",
        )}
      >
        <div className="container-x flex h-[92px] items-center gap-6">
          <Link
            to="/"
            aria-label="HUMAN DMX APPAREL — home"
            className="shrink-0"
          >
            {/* <Crest size={62} className="transition hover:opacity-80" /> */}
                <img
              src="./images/logo.png"
              className="h-22 w-full rounded-full object-cover"
            />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "group relative px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition",
                    isActive ? "text-royal" : "text-head hover:text-royal",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={cn(
                        "absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gold transition-all duration-300",
                        isActive
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              aria-expanded={searchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-head transition hover:bg-well"
            >
              <Icon path="M13.5 13.5L17 17M15 9a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
            </button>

            <Link
              to="/track"
              aria-label="Track an order"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-head transition hover:bg-well sm:flex"
            >
              <Icon path="M2.5 6.5L10 3l7.5 3.5v7L10 17l-7.5-3.5v-7Zm0 0L10 10m0 0l7.5-3.5M10 10v7" />
            </Link>

            <button
              type="button"
              onClick={() => dispatch(openCart())}
              aria-label={`Open cart, ${totals.itemCount} items`}
              className="relative ml-1 flex h-10 items-center gap-2.5 rounded-full bg-ink px-4 text-bone transition hover:bg-royal"
            >
              <Icon
                path="M3 5.5h2l1.6 8.2a1.5 1.5 0 0 0 1.47 1.2h6.06a1.5 1.5 0 0 0 1.47-1.2L17 8H6"
                className="h-4 w-4"
              />
              <span className="text-[11px] font-bold tabular-nums">
                {totals.itemCount}
              </span>
              {totals.itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-card" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-head transition hover:bg-well lg:hidden"
            >
              <Icon path="M3 6h14M3 10h14M3 14h14" />
            </button>
          </div>
        </div>
      </div>

      {/* category strip */}
      <div className="hidden border-b border-line bg-paper/95 backdrop-blur-xl lg:block">
        <div className="container-x flex h-11 items-center gap-1">
          {categories.map((category) => (
            <NavLink
              key={category.slug}
              to={`/shop/${category.slug}`}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                  isActive
                    ? "bg-royal text-white"
                    : "text-body hover:bg-well hover:text-head",
                )
              }
            >
              {category.name}
            </NavLink>
          ))}
          <span className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Ships to all 50 states
          </span>
        </div>
      </div>

      {searchOpen && (
        <div className="border-b border-line bg-card">
          <form
            onSubmit={submitSearch}
            className="container-x flex items-center gap-3 py-4"
          >
            <Icon
              path="M13.5 13.5L17 17M15 9a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
              className="h-5 w-5 shrink-0 text-soft"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hoodies, hats, tees…"
              className="h-10 flex-1 bg-transparent text-sm text-head placeholder:text-soft focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-royal px-5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          className={cn(
            "absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-card shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <Crest size={56} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-body hover:bg-well"
            >
              <Icon path="M5 5l10 10M15 5L5 15" className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <p className="eyebrow-type mb-3 text-soft">Shop</p>
            {categories.map((category) => (
              <NavLink
                key={category.slug}
                to={`/shop/${category.slug}`}
                className={({ isActive }) =>
                  cn(
                    "display block border-b border-line py-3.5 text-2xl transition",
                    isActive ? "text-royal" : "text-head hover:text-royal",
                  )
                }
              >
                {category.name}
              </NavLink>
            ))}
            <p className="eyebrow-type mb-3 mt-8 text-soft">Pages</p>
            {[...NAV, { to: "/track", label: "Track Order" }].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : undefined}
                className={({ isActive }) =>
                  cn(
                    "display block border-b border-line py-3.5 text-2xl transition",
                    isActive ? "text-royal" : "text-head hover:text-royal",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="border-t border-line px-6 py-5">
            <Link
              to="/admin"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft transition hover:text-royal"
            >
              Merchant Portal →
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
