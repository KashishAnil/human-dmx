import { useState } from "react";
import { ConfigProvider } from "antd";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import Crest from "../../components/brand/Crest";
import { adminTheme } from "./theme";
import { useAppDispatch } from "../../redux/hooks";
import { clearSession } from "../../redux/slices/authSlice";
import { useLogoutMutation } from "../../redux/services/api";
import { useAdminSession, useOrders } from "../../hooks/useCommerce";
import { cn } from "../../utils/Functions";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: "◧" },
  { to: "/admin/orders", label: "Orders", icon: "▤" },
  { to: "/admin/products", label: "Products", icon: "◈" },
  { to: "/admin/inventory", label: "Inventory", icon: "▦" },
  { to: "/admin/customers", label: "Customers", icon: "◉" },
  { to: "/admin/discounts", label: "Discounts", icon: "％" },
  { to: "/admin/content", label: "Content & Settings", icon: "✎" },
];

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAdminSession();
  const orders = useOrders();
  const [logout] = useLogoutMutation();
  const [navOpen, setNavOpen] = useState(false);

  const openOrders = orders.filter((o) =>
    ["pending", "paid", "processing"].includes(o.status),
  ).length;
  const exchanges = orders.filter((o) => o.status === "exchange").length;

  const badges: Record<string, number> = {
    "/admin/orders": openOrders,
  };

  return (
    <ConfigProvider theme={adminTheme}>
      <div className="flex min-h-screen bg-paper text-head">
        {/* sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line bg-card transition-transform duration-300 lg:translate-x-0",
            navOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="border-b border-line px-6 py-5">
            <Link to="/admin" className="block">
              <Crest size={58} />
            </Link>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-soft">
              Merchant Portal
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition",
                    isActive
                      ? "bg-royal-tint font-semibold text-gold"
                      : "text-body hover:bg-paper hover:text-head",
                  )
                }
              >
                <span className="w-4 text-center text-xs opacity-70">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {badges[item.to] > 0 && (
                  <span className="rounded-full bg-royal px-2 py-0.5 text-[10px] font-bold text-head">
                    {badges[item.to]}
                  </span>
                )}
              </NavLink>
            ))}

            {exchanges > 0 && (
              <div className="mt-6 rounded-lg border border-coral/30 bg-coral/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-coral">
                  {exchanges} exchange{exchanges === 1 ? "" : "s"} waiting
                </p>
                <Link
                  to="/admin/orders?status=exchange"
                  className="mt-2 block text-xs text-body transition hover:text-head"
                >
                  Review them →
                </Link>
              </div>
            )}
          </nav>

          <div className="border-t border-line p-4">
            <div className="rounded-lg bg-paper p-4">
              <p className="text-xs font-semibold text-head">
                {session?.fullName}
              </p>
              <p className="mt-0.5 text-[11px] text-soft">{session?.role}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/"
                  className="flex-1 rounded-md border border-line px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-body transition hover:text-head"
                >
                  View Store
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    // Clear the server-side refresh token, then the local one.
                    // Either way the session ends here.
                    try {
                      await logout().unwrap();
                    } catch {
                      /* already expired server-side */
                    }
                    dispatch(clearSession());
                    navigate("/admin");
                  }}
                  className="flex-1 rounded-md border border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-body transition hover:border-coral hover:text-coral"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {navOpen && (
          <div
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          />
        )}

        {/* content */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-card/90 px-5 backdrop-blur-xl lg:px-8">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-paper hover:text-head lg:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <p className="text-[11px] uppercase tracking-[0.2em] text-soft">
              Human DMX Apparel
            </p>
            <span className="ml-auto flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3fa96f]" />
              Store live
            </span>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AdminLayout;
