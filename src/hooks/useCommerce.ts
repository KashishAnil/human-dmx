import { useMemo } from "react";
import { useAppSelector } from "../redux/hooks";
import {
  useGetAllOrdersQuery,
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  type CartTotals,
  type PricedLine,
} from "../redux/services/api";
import { DEFAULT_SETTINGS } from "../data/catalog";
import type { CartLine, CategoryMeta } from "../types";

/**
 * Commerce data hooks. Products and categories come from the API only (no
 * static catalog fallback). Settings are the local defaults — there is no
 * settings endpoint, so the storefront does not request one.
 */

export const useSettings = () => DEFAULT_SETTINGS;

/** Categories from the API. Empty array while loading or on empty backend. */
export const useCategories = (): CategoryMeta[] => {
  const { data } = useGetCategoriesQuery();
  return data ?? [];
};

export const useCategoriesQueryState = () => {
  const q = useGetCategoriesQuery();
  return {
    categories: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
  };
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

export const useProductsQueryState = (includeInactive = false) => {
  const q = useGetProductsQuery(
    includeInactive ? { includeInactive: true } : undefined,
  );
  return {
    products: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
  };
};

/** Only what shoppers should see — admins can hide a piece without deleting it. */
export const useActiveProducts = () => {
  const { data } = useGetProductsQuery();
  return useMemo(() => (data ?? []).filter((p) => p.active), [data]);
};

export const useActiveProductsQueryState = () => {
  const q = useGetProductsQuery();
  const products = useMemo(
    () => (q.data ?? []).filter((p) => p.active),
    [q.data],
  );
  return {
    products,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
  };
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
  const { data, isLoading, isFetching, isError, error } = useGetCartQuery();

  return useMemo(() => {
    const lines: CartLineView[] = (data?.lines ?? []).map((line) => ({
      ...line,
      key: `${line.productId}::${line.size}`,
    }));

    return {
      lines,
      totals: data?.totals ?? EMPTY_TOTALS,
      promo: data?.promo ?? null,
      adjustments: data?.adjustments ?? [],
      isLoading,
      isFetching,
      isError,
      error,
    };
  }, [data, isLoading, isFetching, isError, error]);
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

export const useOrdersQueryState = () => {
  const q = useGetAllOrdersQuery();
  return {
    orders: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
  };
};
