import { useEffect } from "react";
import { Link } from "react-router";
import { useCategoryLabel } from "../../hooks/useCommerce";
import { useGetDashboardQuery } from "../../redux/services/api";
import {
  BarList,
  StatTile,
  TrendChart,
  type TrendPoint,
} from "../../components/admin/Charts";
import { STATUS_LABEL, STATUS_TONE_DARK } from "../../utils/orderStatus";
import { cn, formatDate, money, resolveImage } from "../../utils/Functions";

const Panel = ({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn("rounded-xl border border-line bg-card p-6", className)}
  >
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-bold text-head">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] text-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Dashboard = () => {
  /**
   * Every figure here comes from `GET /dashboard`, which aggregates across
   * the whole order collection in Mongo. The page used to compute this in the
   * browser from the full order list — that only works while every order fits
   * in memory, and it silently under-reports once the list is paginated.
   */
  const { data, isLoading } = useGetDashboardQuery(30);
  const categoryLabel = useCategoryLabel();

  useEffect(() => {
    document.title = "Dashboard — Merchant Portal";
  }, []);

  const stats = {
    revenue: data?.stats.revenue.value ?? 0,
    revenueDelta: data?.stats.revenue.delta ?? 0,
    orderCount: data?.stats.orders.value ?? 0,
    orderDelta: data?.stats.orders.delta ?? 0,
    aov: data?.stats.aov.value ?? 0,
    aovDelta: data?.stats.aov.delta ?? 0,
    units: data?.stats.units.value ?? 0,
    unitsDelta: data?.stats.units.delta ?? 0,
  };

  // The chart shows a fortnight; the request covers 30 days for the deltas.
  const trend: TrendPoint[] = (data?.trend ?? []).slice(-14).map((point) => ({
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: point.revenue,
  }));

  const topProducts = (data?.topProducts ?? []).slice(0, 5).map((p) => ({
    label: p.name,
    value: p.units,
    meta: `${money(p.revenue)} revenue`,
  }));

  const categoryMix = (data?.topCategories ?? []).map((c) => ({
    label: categoryLabel(c.category),
    value: c.units,
  }));

  // The API returns one row per product with its low variants nested; the
  // list below wants one row per size.
  const lowStock = (data?.lowStock ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      id: product.productId,
      name: product.name,
      image: product.image,
      size: variant.size,
      stock: variant.stock,
    })),
  );

  const recent = (data?.recentOrders ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-head sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-body">
            {isLoading
              ? "Crunching the numbers…"
              : "Last 30 days compared with the 30 before it."}
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="rounded-full border border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-body transition hover:border-royal hover:text-royal"
        >
          All orders →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenue"
          value={money(stats.revenue)}
          delta={stats.revenueDelta}
          hint="vs prior 30d"
        />
        <StatTile
          label="Orders"
          value={String(stats.orderCount)}
          delta={stats.orderDelta}
          hint="vs prior 30d"
        />
        <StatTile
          label="Avg order value"
          value={money(stats.aov)}
          delta={stats.aovDelta}
          hint="vs prior 30d"
        />
        <StatTile
          label="Units sold"
          value={String(stats.units)}
          delta={stats.unitsDelta}
          hint="vs prior 30d"
        />
      </div>

      <Panel
        title="Revenue, last 14 days"
        subtitle="Cancelled orders excluded. Hover any day for the exact figure."
      >
        <TrendChart data={trend} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Best sellers" subtitle="Units sold, all time">
          <BarList
            data={topProducts}
            valueFormat={(n) => `${n} units`}
            emptyCopy="No sales recorded yet."
          />
        </Panel>

        <Panel title="Category mix" subtitle="Units sold by category">
          <BarList
            data={categoryMix}
            colorMode="categorical"
            valueFormat={(n) => `${n} units`}
            emptyCopy="No sales recorded yet."
          />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Recent orders"
          action={
            <Link
              to="/admin/orders"
              className="text-[11px] uppercase tracking-[0.14em] text-gold transition hover:text-head"
            >
              View all
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-soft">
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((order) => (
                  <tr key={order.id} className="text-body">
                    <td className="py-3.5">
                      <Link
                        to={`/admin/orders?focus=${order.id}`}
                        className="font-semibold text-head transition hover:text-royal"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      {order.customer.firstName} {order.customer.lastName}
                    </td>
                    <td className="py-3.5 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]",
                          STATUS_TONE_DARK[order.status],
                        )}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-semibold tabular-nums text-head">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Low stock"
          subtitle="6 units or fewer"
          action={
            <Link
              to="/admin/inventory"
              className="text-[11px] uppercase tracking-[0.14em] text-gold transition hover:text-head"
            >
              Restock
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-soft">
              Every size is well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((row) => (
                <li
                  key={`${row.id}-${row.size}`}
                  className="flex items-center gap-3 py-3"
                >
                  <img
                    src={resolveImage(row.image)}
                    alt=""
                    className="h-11 w-9 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-head">
                      {row.name}
                    </p>
                    <p className="text-[11px] text-soft">Size {row.size}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold",
                      row.stock === 0
                        ? "bg-coral/20 text-coral"
                        : "bg-[#b8890f]/20 text-[#8a6508]",
                    )}
                  >
                    {row.stock === 0 ? "Sold out" : `${row.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;
