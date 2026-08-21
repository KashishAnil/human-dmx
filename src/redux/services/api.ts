import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../constants/api";
import { clearSession, setSession } from "../slices/authSlice";
import type {
  CartLine,
  CategoryMeta,
  Order,
  OrderStatus,
  Product,
  Promo,
  SiteSettings,
} from "../../types";

/* ----------------------------- wire contracts ---------------------------- */

/** Every endpoint answers with this envelope. */
interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Paginated<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface CartTotals {
  subtotal: number;
  itemCount: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
}

/** A cart line priced by the server against current catalog data. */
export interface PricedLine extends CartLine {
  name: string;
  slug: string;
  image: string;
  price: number;
  /** Units left of this exact variant — caps the quantity stepper. */
  stock: number;
  lineTotal: number;
}

export interface ServerCart {
  id: string | null;
  lines: PricedLine[];
  totals: CartTotals;
  promo: Promo | null;
  promoCode: string | null;
  /** Human-readable notes about anything the server changed while pricing. */
  adjustments: string[];
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  image: string | null;
  phone?: string;
}

export interface AuthPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStat {
  value: number;
  previous: number;
  delta: number;
}

export interface DashboardData {
  window: { days: number; from: string; to: string };
  stats: {
    revenue: DashboardStat;
    orders: DashboardStat;
    units: DashboardStat;
    aov: DashboardStat;
  };
  lifetime: {
    revenue: number;
    orders: number;
    units: number;
    customers: number;
    products: number;
    activeProducts: number;
    registeredUsers: number;
  };
  trend: { date: string; revenue: number; orders: number }[];
  statusCounts: Record<OrderStatus, number>;
  topProducts: {
    productId: string;
    name: string;
    image: string;
    units: number;
    revenue: number;
  }[];
  topCategories: { category: string; units: number; revenue: number }[];
  lowStock: {
    productId: string;
    name: string;
    slug: string;
    image: string;
    category: string;
    totalStock: number;
    variants: { size: string; stock: number }[];
  }[];
  recentOrders: Order[];
}

export interface CustomerRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  units: number;
  spend: number;
  aov: number;
  lastOrder: string;
  firstOrder: string;
  hasAccount: boolean;
}

/* ------------------------------- base query ------------------------------ */

const CART_TOKEN_KEY = "humandmx:cartToken";

/**
 * Guests are identified by an opaque cart token. The API sets it as a cookie
 * *and* echoes it in a header; we mirror it into localStorage and send it back
 * explicitly so the cart survives even where third-party cookies are blocked.
 */
const readCartToken = () => {
  try {
    return window.localStorage.getItem(CART_TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeCartToken = (token: string) => {
  try {
    if (token && token !== readCartToken()) {
      window.localStorage.setItem(CART_TOKEN_KEY, token);
    }
  } catch {
    /* private mode — the cookie still covers the common case */
  }
};

/**
 * The slice of store state this module reads. Declared locally rather than
 * imported as `RootState`, because the store imports this module — pulling
 * the type back in would close the cycle.
 */
interface AuthAware {
  auth: { accessToken: string | null; refreshToken: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthAware).auth?.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const cartToken = readCartToken();
    if (cartToken) headers.set("x-cart-token", cartToken);

    return headers;
  },
});

/**
 * In-flight refresh, shared by every request that hits a 401 at the same time.
 *
 * A screen typically fires several queries at once. If the access token has
 * expired they all 401 together, and without this each one would start its own
 * refresh. The server rotates the refresh token on use, so the first call
 * invalidates the token the others are still holding — they'd fail, and a
 * failed refresh signs the user out. That was the "logged out when I open a
 * tab" bug: one stale request was enough to end a good session.
 */
let refreshInFlight: Promise<AuthPayload | null> | null = null;

/**
 * Wraps the base query to (a) capture the rotating guest cart token and
 * (b) transparently refresh an expired access token once before giving up,
 * so a merchant mid-edit isn't bounced to the login screen.
 */
const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const echoed = (result.meta?.response as Response | undefined)?.headers.get(
    "x-cart-token",
  );
  if (echoed) writeCartToken(echoed);

  const { refreshToken } = (api.getState() as AuthAware).auth ?? {};

  if (result.error?.status === 401 && refreshToken) {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const refresh = await rawBaseQuery(
          {
            url: "/auth/refresh-token",
            method: "POST",
            body: { refreshToken },
          },
          api,
          extraOptions,
        );

        const payload = (refresh.data as Envelope<AuthPayload>)?.data ?? null;

        if (payload?.accessToken) {
          api.dispatch(setSession(payload));
        } else if (refresh.error?.status === 401) {
          /**
           * Only a definitive rejection ends the session. A network drop or a
           * 5xx leaves the credentials alone — the request simply fails and
           * the next one can try again, rather than throwing the user out
           * because the server hiccuped.
           */
          api.dispatch(clearSession());
        }

        return payload;
      })().finally(() => {
        refreshInFlight = null;
      });
    }

    const payload = await refreshInFlight;
    // Retry on the new token. Callers that arrived late reuse the same one.
    if (payload?.accessToken) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

/** Unwraps the `{ success, message, data }` envelope down to `data`. */
const unwrap = <T>(response: Envelope<T>): T => response.data;

/* --------------------------------- api ----------------------------------- */

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Product",
    "Category",
    "Cart",
    "Order",
    "Promo",
    "Settings",
    "Dashboard",
    "Customer",
    "User",
    "Profile",
  ],
  endpoints: (builder) => ({
    /* ------------------------------- auth -------------------------------- */
    login: builder.mutation<AuthPayload, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: unwrap<AuthPayload>,
      // A fresh session owns a different cart and a different order history.
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),
    signup: builder.mutation<
      AuthPayload,
      { fullName: string; email: string; password: string; phone?: string }
    >({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      transformResponse: unwrap<AuthPayload>,
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),
    logout: builder.mutation<unknown, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),

    /* ----------------------------- catalog ------------------------------- */
    /**
     * The catalog is small enough (single figures) that the shop page filters
     * and sorts client-side, exactly as it did against the seed data. One
     * request keeps that code untouched; add server-side paging here if the
     * catalog ever outgrows a single page.
     */
    getProducts: builder.query<Product[], { includeInactive?: boolean } | void>(
      {
        query: (args) => ({
          url: "/products",
          params: {
            limit: 100,
            ...(args?.includeInactive ? { includeInactive: true } : {}),
          },
        }),
        transformResponse: (response: Envelope<Paginated<Product>>) =>
          response.data.docs,
        providesTags: ["Product"],
      },
    ),
    getProduct: builder.query<
      Product & { categoryMeta: CategoryMeta | null },
      string
    >({
      query: (slug) => `/products/${slug}`,
      transformResponse: unwrap<
        Product & { categoryMeta: CategoryMeta | null }
      >,
      providesTags: (_r, _e, slug) => [{ type: "Product", id: slug }],
    }),
    getCategories: builder.query<
      (CategoryMeta & { id: string; productCount: number })[],
      void
    >({
      query: () => "/categories",
      transformResponse: unwrap<
        (CategoryMeta & { id: string; productCount: number })[]
      >,
      providesTags: ["Category"],
    }),

    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      transformResponse: unwrap<Product>,
      invalidatesTags: ["Product", "Category", "Dashboard"],
    }),
    updateProduct: builder.mutation<Product, { id: string } & Partial<Product>>(
      {
        query: ({ id, ...body }) => ({
          url: `/products/${id}`,
          method: "PUT",
          body,
        }),
        transformResponse: unwrap<Product>,
        invalidatesTags: ["Product", "Category", "Dashboard", "Cart"],
      },
    ),
    deleteProduct: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product", "Category", "Dashboard", "Cart"],
    }),
    toggleProductActive: builder.mutation<Product, string>({
      query: (id) => ({ url: `/products/${id}/toggle-active`, method: "PUT" }),
      transformResponse: unwrap<Product>,
      invalidatesTags: ["Product", "Category", "Cart"],
    }),
    toggleProductFeatured: builder.mutation<Product, string>({
      query: (id) => ({
        url: `/products/${id}/toggle-featured`,
        method: "PUT",
      }),
      transformResponse: unwrap<Product>,
      invalidatesTags: ["Product"],
    }),
    setStock: builder.mutation<
      Product,
      { id: string; size: string; stock: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/products/${id}/stock`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap<Product>,
      invalidatesTags: ["Product", "Dashboard", "Cart"],
    }),
    /**
     * Several sizes in one request. The server groups by product so two sizes
     * of the same item can't overwrite each other, which sequential
     * single-variant calls would risk.
     */
    bulkSetStock: builder.mutation<
      unknown,
      { updates: { productId: string; size: string; stock: number }[] }
    >({
      query: (body) => ({
        url: "/products/admin/bulk-stock",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Product", "Dashboard", "Cart"],
    }),

    /**
     * Stores images and returns their paths. Sent as multipart, so no
     * Content-Type is set — the browser has to supply the multipart boundary
     * itself, and naming the type here would omit it and break the parse.
     */
    uploadImages: builder.mutation<{ paths: string[] }, File[]>({
      query: (files) => {
        const form = new FormData();
        files.forEach((file) => form.append("images", file));
        return { url: "/uploads/images", method: "POST", body: form };
      },
      transformResponse: unwrap<{ paths: string[] }>,
    }),

    /* ------------------------------- cart -------------------------------- */
    getCart: builder.query<ServerCart, void>({
      query: () => "/cart",
      transformResponse: unwrap<ServerCart>,
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation<
      ServerCart,
      { productId: string; size: string; qty?: number }
    >({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    updateCartLine: builder.mutation<
      ServerCart,
      { productId: string; size: string; qty: number }
    >({
      query: (body) => ({ url: "/cart/items", method: "PUT", body }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    changeCartSize: builder.mutation<
      ServerCart,
      { productId: string; size: string; newSize: string }
    >({
      query: (body) => ({ url: "/cart/items/size", method: "PUT", body }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    removeCartLine: builder.mutation<
      ServerCart,
      { productId: string; size: string }
    >({
      query: ({ productId, size }) => ({
        url: `/cart/items/${productId}/${encodeURIComponent(size)}`,
        method: "DELETE",
      }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation<ServerCart, void>({
      query: () => ({ url: "/cart", method: "DELETE" }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    applyPromo: builder.mutation<ServerCart, string>({
      query: (code) => ({ url: "/cart/promo", method: "POST", body: { code } }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),
    removePromo: builder.mutation<ServerCart, void>({
      query: () => ({ url: "/cart/promo", method: "DELETE" }),
      transformResponse: unwrap<ServerCart>,
      invalidatesTags: ["Cart"],
    }),

    /* ------------------------------ orders ------------------------------- */
    checkout: builder.mutation<Order, Record<string, unknown>>({
      query: (body) => ({ url: "/orders/checkout", method: "POST", body }),
      transformResponse: unwrap<Order>,
      invalidatesTags: [
        "Cart",
        "Order",
        "Product",
        "Dashboard",
        "Customer",
        "Promo",
      ],
    }),
    /** Guest lookup — the email proves ownership of the order number. */
    trackOrder: builder.query<Order, { number: string; email: string }>({
      query: (body) => ({ url: "/orders/track", method: "POST", body }),
      transformResponse: unwrap<Order>,
      providesTags: (_r, _e, arg) => [{ type: "Order", id: arg.number }],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => ({ url: "/orders/my-orders", params: { limit: 100 } }),
      transformResponse: (response: Envelope<Paginated<Order>>) =>
        response.data.docs,
      providesTags: ["Order"],
    }),
    requestExchange: builder.mutation<
      Order,
      { id: string; note: string; email?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/exchange`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap<Order>,
      invalidatesTags: ["Order", "Dashboard"],
    }),

    getAllOrders: builder.query<Order[], void>({
      query: () => ({ url: "/orders/admin/all", params: { limit: 100 } }),
      transformResponse: (response: Envelope<Paginated<Order>>) =>
        response.data.docs,
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation<
      Order,
      { id: string; status: OrderStatus; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/status`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap<Order>,
      invalidatesTags: ["Order", "Dashboard", "Product", "Customer"],
    }),
    addOrderNote: builder.mutation<Order, { id: string; note: string }>({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/note`,
        method: "POST",
        body,
      }),
      transformResponse: unwrap<Order>,
      invalidatesTags: ["Order"],
    }),
    deleteOrder: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
      invalidatesTags: ["Order", "Dashboard", "Customer", "Product"],
    }),

    /* ------------------------------ promos ------------------------------- */
    getPromos: builder.query<Promo[], void>({
      query: () => "/promos",
      transformResponse: unwrap<Promo[]>,
      providesTags: ["Promo"],
    }),
    createPromo: builder.mutation<Promo, Partial<Promo>>({
      query: (body) => ({ url: "/promos", method: "POST", body }),
      transformResponse: unwrap<Promo>,
      invalidatesTags: ["Promo"],
    }),
    updatePromo: builder.mutation<Promo, { id: string } & Partial<Promo>>({
      query: ({ id, ...body }) => ({
        url: `/promos/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap<Promo>,
      invalidatesTags: ["Promo", "Cart"],
    }),
    deletePromo: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/promos/${id}`, method: "DELETE" }),
      invalidatesTags: ["Promo", "Cart"],
    }),
    togglePromoActive: builder.mutation<Promo, string>({
      query: (id) => ({ url: `/promos/${id}/toggle-active`, method: "PUT" }),
      transformResponse: unwrap<Promo>,
      invalidatesTags: ["Promo", "Cart"],
    }),

    /* ----------------------------- settings ------------------------------ */
    getSettings: builder.query<SiteSettings, void>({
      query: () => "/settings",
      transformResponse: unwrap<SiteSettings>,
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<SiteSettings, Partial<SiteSettings>>({
      query: (body) => ({ url: "/settings", method: "PUT", body }),
      transformResponse: unwrap<SiteSettings>,
      // Shipping and tax settings feed cart totals.
      invalidatesTags: ["Settings", "Cart"],
    }),
    resetSettings: builder.mutation<SiteSettings, void>({
      query: () => ({ url: "/settings/reset", method: "POST" }),
      transformResponse: unwrap<SiteSettings>,
      invalidatesTags: ["Settings", "Cart"],
    }),

    /* -------------------------- admin analytics -------------------------- */
    getDashboard: builder.query<DashboardData, number | void>({
      query: (days) => ({ url: "/dashboard", params: { days: days || 30 } }),
      transformResponse: unwrap<DashboardData>,
      providesTags: ["Dashboard"],
    }),
    getCustomers: builder.query<CustomerRow[], void>({
      query: () => ({ url: "/customers", params: { limit: 100 } }),
      transformResponse: (response: Envelope<Paginated<CustomerRow>>) =>
        response.data.docs,
      providesTags: ["Customer"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductActiveMutation,
  useToggleProductFeaturedMutation,
  useSetStockMutation,
  useBulkSetStockMutation,
  useUploadImagesMutation,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartLineMutation,
  useChangeCartSizeMutation,
  useRemoveCartLineMutation,
  useClearCartMutation,
  useApplyPromoMutation,
  useRemovePromoMutation,
  useCheckoutMutation,
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useGetMyOrdersQuery,
  useRequestExchangeMutation,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useAddOrderNoteMutation,
  useDeleteOrderMutation,
  useGetPromosQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeletePromoMutation,
  useTogglePromoActiveMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useResetSettingsMutation,
  useGetDashboardQuery,
  useGetCustomersQuery,
} = api;

/** The error body the API returns alongside a non-2xx status. */
interface ApiErrorBody {
  message?: string;
  errors?: unknown[];
}

/** Pulls a readable message out of an RTK Query error. */
export const apiError = (error: unknown, fallback = "Something went wrong") => {
  const data = (error as { data?: ApiErrorBody } | undefined)?.data;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.errors) && data.errors.length)
    return String(data.errors[0]);
  return fallback;
};

/**
 * True when a rejected promise came from antd's `validateFields` rather than
 * the network — those already render inline under each field, so the caller
 * should stay quiet instead of raising a toast.
 */
export const isFormValidationError = (error: unknown): boolean =>
  Array.isArray(
    (error as { errorFields?: unknown[] } | undefined)?.errorFields,
  );
