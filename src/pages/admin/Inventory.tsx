import { useEffect, useMemo, useState } from "react";
import { Button, InputNumber, Segmented, message } from "antd";
import { useCategoryLabel, useProductsQueryState } from "../../hooks/useCommerce";
import {
  apiError,
  useBulkSetStockMutation,
  useSetStockMutation,
} from "../../redux/services/api";
import { cn, money, resolveImage, totalStock } from "../../utils/Functions";

const AdminInventory = () => {
  const {
    products,
    isError: productsError,
    error: productsErr,
  } = useProductsQueryState(true);
  const categoryLabel = useCategoryLabel();
  const [setStock] = useSetStockMutation();
  const [bulkSetStock] = useBulkSetStockMutation();
  const [toast, toastHolder] = message.useMessage();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    document.title = "Inventory — Merchant Portal";
  }, []);

  const rows = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) =>
      filter === "out"
        ? p.variants.some((v) => v.stock === 0)
        : p.variants.some((v) => v.stock > 0 && v.stock <= 6),
    );
  }, [products, filter]);

  const summary = useMemo(() => {
    const units = products.reduce((s, p) => s + totalStock(p), 0);
    const value = products.reduce((s, p) => s + totalStock(p) * p.price, 0);
    const outOfStock = products.reduce(
      (s, p) => s + p.variants.filter((v) => v.stock === 0).length,
      0,
    );
    return { units, value, outOfStock };
  }, [products]);

  /** One request for every size, so the sizes can't overwrite each other. */
  const restockAll = async (productId: string, to: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      await bulkSetStock({
        updates: product.variants.map((v) => ({
          productId,
          size: v.size,
          stock: to,
        })),
      }).unwrap();
      toast.success(`${product.name} restocked to ${to} per size.`);
    } catch (error) {
      toast.error(apiError(error, "Couldn't restock that product."));
    }
  };

  return (
    <div className="space-y-6">
      {toastHolder}

      <div>
        <h1 className="display text-3xl text-head sm:text-4xl">Inventory</h1>
        <p className="mt-2 text-sm text-body">
          Stock updates here show on the storefront immediately.
        </p>
      </div>

      {productsError && (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
          {apiError(productsErr, "Couldn't load inventory.")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Units on hand", value: String(summary.units) },
          { label: "Retail value", value: money(summary.value) },
          {
            label: "Sizes sold out",
            value: String(summary.outOfStock),
            alert: summary.outOfStock > 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-card p-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft">
              {stat.label}
            </p>
            <p
              className={cn(
                "display mt-3 text-3xl tabular-nums",
                stat.alert ? "text-coral" : "text-head",
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Segmented
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[
          { label: "All products", value: "all" },
          { label: "Low stock", value: "low" },
          { label: "Sold out sizes", value: "out" },
        ]}
      />

      <div className="space-y-4">
        {rows.map((product) => (
          <section
            key={product.id}
            className="rounded-xl border border-line bg-card p-5"
          >
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={resolveImage(product.images[0])}
                alt=""
                className="h-16 w-13 shrink-0 rounded object-cover"
                style={{ width: 52 }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-head">{product.name}</p>
                <p className="text-[11px] text-soft">
                  {categoryLabel(product.category)} · {money(product.price)} ·{" "}
                  {totalStock(product)} units on hand
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={() => restockAll(product.id, 25)}>
                  Restock to 25
                </Button>
                <Button size="small" onClick={() => restockAll(product.id, 0)}>
                  Zero out
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {product.variants.map((variant) => (
                <label
                  key={variant.size}
                  className={cn(
                    "rounded-lg border p-3 transition",
                    variant.stock === 0
                      ? "border-coral/40 bg-coral/5"
                      : variant.stock <= 6
                        ? "border-[#b8890f]/40 bg-[#b8890f]/5"
                        : "border-line bg-paper",
                  )}
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-body">
                    {variant.size}
                  </span>
                  <InputNumber
                    key={`${product.id}-${variant.size}-${variant.stock}`}
                    className="mt-2"
                    min={0}
                    defaultValue={variant.stock}
                    style={{ width: "100%" }}
                    /**
                     * Committed on blur rather than on every keystroke —
                     * each edit is a request, and typing "25" shouldn't
                     * write 2 and then 25.
                     */
                    onBlur={async (event) => {
                      const stock = Number(event.target.value ?? 0);
                      if (stock === variant.stock) return;
                      try {
                        await setStock({
                          id: product.id,
                          size: variant.size,
                          stock,
                        }).unwrap();
                      } catch (error) {
                        toast.error(apiError(error, "Couldn't update stock."));
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}

        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-16 text-center text-sm text-soft">
            Nothing matches that filter — stock levels are healthy.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
