import { useMemo } from "react";
import { useAppSelector } from "../redux/hooks";
import {
  useGetAllOrdersQuery,
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetSettingsQuery,
  type CartTotals,
  type PricedLine,
} from "../redux/services/api";
import { CATEGORIES, DEFAULT_SETTINGS } from "../data/catalog";
import type { CartLine, CategoryMeta } from "../types";

/**
 * The app reads all of its commerce data through these hooks. They used to
 * select from localStorage-backed slices; they now sit on top of the API. The
 * shapes are deliberately unchanged so the components above them didn't have
 * to be rewritten.
 *
 * Each one returns usable data while the request is in flight — the shipped
 * defaults for settings and categories, an empty cart otherwise — so nothing
 * downstream has to guard against `undefined` on first render.
 */

export const useSettings = () => {
  const { data } = useGetSettingsQuery();
  return data ?? DEFAULT_SETTINGS;
};

/** Categories as managed in the portal, falling back to the shipped set. */
export const useCategories = (): CategoryMeta[] => {
  const { data } = useGetCategoriesQuery();
  return data ?? CATEGORIES;
};

/**
 * Category slug → display name. Returns the slug itself for anything unknown
 * so a newly added category never renders as blank.
 */
export const useCategoryLabel = () => {
  const categories = useCategories();
  return useMemo(() => {
    const byslug = new Map(categories.map((c) => [c.slug, c.name]));
    return (slug: string) => byslug.get(slug) ?? slug;
  }, [categories]);
};

/**
 * Selectable sizes for a category — headwear is one size, garments run S–XXL.
 * Driven by the category record so the merchant can change it without a deploy.
 */
export const useCategorySizes = () => {
  const categories = useCategories();
  return useMemo(() => {
    const bySlug = new Map(categories.map((c) => [c.slug, c.sizes]));
    return (slug: string) => bySlug.get(slug) ?? ["One Size"];
  }, [categories]);
};

/** Every product including hidden ones — merchant portal only. */
export const useProducts = () => {
  const { data } = useGetProductsQuery({ includeInactive: true });
  return data ?? [];
};

/** Only what shoppers should see — admins can hide a piece without deleting it. */
export const useActiveProducts = () => {
  const { data } = useGetProductsQuery();
  return useMemo(() => (data ?? []).filter((p) => p.active), [data]);
};

export const useProductBySlug = (slug: string | undefined) => {
  const products = useActiveProducts();
  return useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
};

const EMPTY_TOTALS: CartTotals = {
  subtotal: 0,
  itemCount: 0,
  discount: 0,
  shippingCost: 0,
  tax: 0,
  total: 0,
  freeShippingRemaining: 0,
};

export interface CartLineView extends PricedLine, Pick<CartLine, "key"> {}

/**
 * The cart, priced by the server. `totals` are authoritative — the same
 * numbers that get written to the order — so the summary here and the receipt
 * can't disagree.
 */
export const useCart = () => {
  const { data, isLoading, isFetching } = useGetCartQuery();

  return useMemo(() => {
    const lines: CartLineView[] = (data?.lines ?? []).map((line) => ({
      ...line,
      key: `${line.productId}::${line.size}`,
    }));

    return {
      lines,
      totals: data?.totals ?? EMPTY_TOTALS,
      promo: data?.promo ?? null,
      /** Notes about anything the server corrected (sold out, price moved). */
      adjustments: data?.adjustments ?? [],
      isLoading,
      isFetching,
    };
  }, [data, isLoading, isFetching]);
};

export const useActivePromo = () => useCart().promo;

/** The signed-in merchant, or null. */
export const useAdminSession = () => {
  const user = useAppSelector((s) => s.auth.user);
  return user?.role === "admin" ? user : null;
};

export const useSession = () => useAppSelector((s) => s.auth.user);

/** All orders — merchant portal only. */
export const useOrders = () => {
  const { data } = useGetAllOrdersQuery();
  return data ?? [];
};
