import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../constants/api";
import { clearSession } from "../slices/authSlice";
import type {
  CartLine,
  CategoryMeta,
  Order,
  OrderStatus,
  Product,
  Promo,
  SiteSettings,
} from "../../types";
import {
  decodeJwtPayload,
  emptyCart,
  mapCart,
  mapCategory,
  mapOrder,
  mapProduct,
  mapRole,
  toBackendProductBody,
  type BackendCategory,
  type BackendProduct,
} from "./mappers";

/* ----------------------------- wire contracts ---------------------------- */

/** Legacy envelope from the previous API — unwrap when present. */
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
 * Guests are identified by an opaque cart token. Mirrored in localStorage and
 * sent as `x-cart-token` (Phase 2 cart wiring).
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
    /* private mode */
  }
};

/** Ensure a guest cart token exists (UUID) before cart mutations. */
export const ensureCartToken = (): string => {
  const existing = readCartToken();
  if (existing) return existing;
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  writeCartToken(token);
  return token;
};

interface AuthAware {
  auth: { accessToken: string | null; refreshToken: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthAware).auth?.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const cartToken = readCartToken();
    if (cartToken) headers.set("x-cart-token", cartToken);

    return headers;
  },
});

/**
 * On 401: clear the session. Admin routes re-render the login screen via
 * `AdminRoute`. No refresh-token flow — this backend issues a single JWT.
 */
const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const echoed = (result.meta?.response as Response | undefined)?.headers.get(
    "x-cart-token",
  );
  if (echoed) writeCartToken(echoed);

  if (result.error?.status === 401) {
    api.dispatch(clearSession());
  }

  return result;
};

/** Unwrap `{ success, message, data }` when present; otherwise pass through. */
const unwrap = <T>(response: unknown): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "success" in response
  ) {
    return (response as Envelope<T>).data;
  }
  return response as T;
};

type QueryBase = (
  arg: string | FetchArgs,
) => Promise<{ data?: unknown; error?: FetchBaseQueryError }>;

/** Slug from the product form → category ObjectId. Omitted when it doesn't match. */
const productWriteBody = async (body: Partial<Product>, base: QueryBase) => {
  const payload = toBackendProductBody(body);
  if (!body.category) return payload;
  const result = await base("/categories");
  if (result.error || result.data === undefined) return payload;
  const raw = unwrap<BackendCategory[] | { categories?: BackendCategory[] }>(
    result.data,
  );
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.categories)
      ? raw.categories
      : [];
  const match = list
    .map(mapCategory)
    .find((category) => category.slug === body.category);
  if (match) payload.category = match.id;
  return payload;
};

const putProductFlag = async (
  base: QueryBase,
  id: string,
  field: "isActive" | "isFeatured",
) => {
  const list = await base({ url: "/product", params: { limit: 100 } });
  if (list.error) return { error: list.error };
  const product = mapProductsList(list.data).find((item) => item.id === id);
  if (!product) {
    return {
      error: {
        status: 404,
        data: { message: "Product not found" },
      } as FetchBaseQueryError,
    };
  }
  const result = await base({
    url: `/product/${id}`,
    method: "PUT",
    body: {
      [field]: field === "isActive" ? !product.active : !product.featured,
    },
  });
  if (result.error) return { error: result.error };
  return { data: mapProduct(unwrap<BackendProduct>(result.data)) };
};

/** Checkout form → POST /order body. Card data stays in the browser. */
const checkoutBody = (body: Record<string, unknown>) => {
  const customer = (body.customer ?? {}) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  const shipping = (body.shipping ?? {}) as {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  const digits = String(customer.phone ?? "").replace(/\D/g, "");
  return {
    email: customer.email,
    phoneNumber: digits || String(customer.phone ?? ""),
    shippingAddress: {
      recipientName: [customer.firstName, customer.lastName]
        .filter(Boolean)
        .join(" "),
      streetAddress: [shipping.address1, shipping.address2]
        .filter(Boolean)
        .join(", "),
      city: shipping.city,
      state: shipping.state,
      zipCode: String(shipping.zip ?? ""),
      country: String(shipping.country ?? ""),
    },
  };
};

const mapProductsList = (response: unknown): Product[] => {
  const body = unwrap<{ products?: BackendProduct[] } | BackendProduct[]>(
    response,
  );
  const list = Array.isArray(body)
    ? body
    : Array.isArray(body?.products)
      ? body.products
      : [];
  return list.map(mapProduct);
};

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
      transformResponse: (response: unknown, _meta, arg) => {
        const raw = unwrap<{ token?: string } | string>(response);
        const token =
          typeof raw === "string"
            ? raw
            : typeof raw?.token === "string"
              ? raw.token
              : "";
        const claims = decodeJwtPayload(token);
        const role = mapRole(claims?.role as string | undefined);
        const email = arg.email;
        return {
          accessToken: token,
          // Backend has no refresh token; keep the field for AuthPayload shape.
          refreshToken: "",
          user: {
            id: String(claims?.userId ?? ""),
            // Token carries no name — use email for AdminLayout `fullName`.
            fullName: email,
            email,
            role,
            image: null,
          },
        } satisfies AuthPayload;
      },
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),
    signup: builder.mutation<
      AuthPayload,
      { fullName: string; email: string; password: string; phone?: string }
    >({
      query: (body) => {
        const parts = body.fullName.trim().split(/\s+/);
        const fName = parts[0] || body.fullName;
        const lName = parts.slice(1).join(" ") || fName;
        return {
          url: "/auth/register",
          method: "POST",
          body: {
            fName,
            lName,
            email: body.email,
            password: body.password,
            phoneNumber: body.phone
              ? body.phone.replace(/\D/g, "")
              : undefined,
          },
        };
      },
      // Register returns the user doc, not a token — caller should login after.
      transformResponse: (response: unknown, _meta, arg) => {
        const user = unwrap<{
          _id?: string;
          email?: string;
          fName?: string;
          lName?: string;
          role?: string;
          phoneNumber?: number;
        }>(response);
        return {
          accessToken: "",
          refreshToken: "",
          user: {
            id: String(user?._id ?? ""),
            fullName:
              [user?.fName, user?.lName].filter(Boolean).join(" ") ||
              arg.fullName,
            email: user?.email ?? arg.email,
            role: mapRole(user?.role),
            image: null,
            phone: arg.phone,
          },
        } satisfies AuthPayload;
      },
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),
    /** No backend logout — kept so the UI can call it; clearSession still runs. */
    logout: builder.mutation<unknown, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Cart", "Order", "Profile"],
    }),

    /* ----------------------------- catalog ------------------------------- */
    getProducts: builder.query<Product[], { includeInactive?: boolean } | void>(
      {
        query: () => ({
          url: "/product",
          params: { limit: 100 },
        }),
        transformResponse: (response: unknown, _meta, arg) => {
          const products = mapProductsList(response);
          if (arg && typeof arg === "object" && arg.includeInactive) {
            return products;
          }
          return products.filter((p) => p.active);
        },
        providesTags: ["Product"],
      },
    ),
    /**
     * Backend has no GET-by-slug. Load the list and match on mapped slug / id.
     */
    getProduct: builder.query<
      Product & { categoryMeta: CategoryMeta | null },
      string
    >({
      async queryFn(slug, _api, _extra, base) {
        const result = await base({ url: "/product", params: { limit: 100 } });
        if (result.error) return { error: result.error };
        const products = mapProductsList(result.data);
        const product =
          products.find((p) => p.slug === slug || p.id === slug) ?? null;
        if (!product) {
          return {
            error: {
              status: 404,
              data: { message: "Product not found" },
            } as FetchBaseQueryError,
          };
        }
        return {
          data: { ...product, categoryMeta: null },
        };
      },
      providesTags: (_r, _e, slug) => [{ type: "Product", id: slug }],
    }),
    getCategories: builder.query<
      (CategoryMeta & { id: string; productCount: number })[],
      void
    >({
      async queryFn(_arg, _api, _extra, base) {
        const result = await base("/categories");
        // Backend returns 509 when the collection is empty — treat as [].
        if (result.error) {
          const status = result.error.status;
          if (status === 509 || status === 404) return { data: [] };
          return { error: result.error };
        }
        const raw = unwrap<BackendCategory[] | { categories?: BackendCategory[] }>(
          result.data,
        );
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(
                (raw as { categories?: BackendCategory[] }).categories,
              )
            ? (raw as { categories: BackendCategory[] }).categories
            : [];
        return { data: list.map(mapCategory) };
      },
      providesTags: ["Category"],
    }),

    createProduct: builder.mutation<Product, Partial<Product>>({
      async queryFn(body, _api, _extra, base) {
        const payload = await productWriteBody(body, base as QueryBase);
        const result = await base({
          url: "/product",
          method: "POST",
          body: payload,
        });
        if (result.error) return { error: result.error };
        return { data: mapProduct(unwrap<BackendProduct>(result.data)) };
      },
      invalidatesTags: ["Product", "Category", "Dashboard"],
    }),
    updateProduct: builder.mutation<Product, { id: string } & Partial<Product>>(
      {
        async queryFn({ id, ...body }, _api, _extra, base) {
          const payload = await productWriteBody(body, base as QueryBase);
          const result = await base({
            url: `/product/${id}`,
            method: "PUT",
            body: payload,
          });
          if (result.error) return { error: result.error };
          return { data: mapProduct(unwrap<BackendProduct>(result.data)) };
        },
        invalidatesTags: ["Product", "Category", "Dashboard", "Cart"],
      },
    ),
    deleteProduct: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/product/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product", "Category", "Dashboard", "Cart"],
    }),
    /* ---- no backend equivalents: left pointed at old paths so they fail visibly ---- */
    toggleProductActive: builder.mutation<Product, string>({
      async queryFn(id, _api, _extra, base) {
        return putProductFlag(base as QueryBase, id, "isActive");
      },
      invalidatesTags: ["Product", "Category", "Cart"],
    }),
    toggleProductFeatured: builder.mutation<Product, string>({
      async queryFn(id, _api, _extra, base) {
        return putProductFlag(base as QueryBase, id, "isFeatured");
      },
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
    uploadImages: builder.mutation<{ paths: string[] }, File[]>({
      query: (files) => {
        const form = new FormData();
        files.forEach((file) => form.append("images", file));
        return { url: "/uploads/images", method: "POST", body: form };
      },
      transformResponse: unwrap<{ paths: string[] }>,
    }),

    /* ------------------------------- cart (Phase 2) -------------------------------- */
    getCart: builder.query<ServerCart, void>({
      async queryFn(_arg, _api, _extra, base) {
        ensureCartToken();
        const result = await base("/cart");
        if (result.error) {
          const status = result.error.status;
          if (status === 509 || status === 404) return { data: emptyCart() };
          return { error: result.error };
        }
        return { data: mapCart(unwrap(result.data)) };
      },
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation<
      ServerCart,
      { productId: string; size: string; qty?: number }
    >({
      query: (body) => {
        ensureCartToken();
        return {
          url: "/cart",
          method: "POST",
          body: {
            productId: body.productId,
            size: body.size,
            quantity: body.qty ?? 1,
          },
        };
      },
      transformResponse: (response: unknown) => mapCart(unwrap(response)),
      invalidatesTags: ["Cart"],
    }),
    updateCartLine: builder.mutation<
      ServerCart,
      { productId: string; size: string; qty: number }
    >({
      query: (body) => {
        ensureCartToken();
        return {
          url: `/cart/${body.productId}`,
          method: "PUT",
          body: { size: body.size, quantity: body.qty },
        };
      },
      transformResponse: (response: unknown) => mapCart(unwrap(response)),
      invalidatesTags: ["Cart"],
    }),
    changeCartSize: builder.mutation<
      ServerCart,
      { productId: string; size: string; newSize: string }
    >({
      async queryFn({ productId, size, newSize }, _api, _extra, base) {
        ensureCartToken();
        const current = await base("/cart");
        const cart = current.error ? emptyCart() : mapCart(unwrap(current.data));
        const qty =
          cart.lines.find(
            (line) => line.productId === productId && line.size === size,
          )?.qty ?? 1;
        const removed = await base({
          url: `/cart/${productId}?size=${encodeURIComponent(size)}`,
          method: "DELETE",
        });
        if (removed.error) return { error: removed.error };
        const added = await base({
          url: "/cart",
          method: "POST",
          body: { productId, size: newSize, quantity: qty },
        });
        if (added.error) return { error: added.error };
        return { data: mapCart(unwrap(added.data)) };
      },
      invalidatesTags: ["Cart"],
    }),
    removeCartLine: builder.mutation<
      ServerCart,
      { productId: string; size: string }
    >({
      query: ({ productId, size }) => {
        ensureCartToken();
        return {
          url: `/cart/${productId}?size=${encodeURIComponent(size)}`,
          method: "DELETE",
        };
      },
      transformResponse: (response: unknown) => mapCart(unwrap(response)),
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

    /* ------------------------------ orders (Phase 2 / unavailable) ------------------------------- */
    checkout: builder.mutation<Order, Record<string, unknown>>({
      query: (body) => ({
        url: "/order",
        method: "POST",
        body: checkoutBody(body),
      }),
      transformResponse: (response: unknown) => mapOrder(unwrap(response)),
      invalidatesTags: [
        "Cart",
        "Order",
        "Product",
        "Dashboard",
        "Customer",
        "Promo",
      ],
    }),
    trackOrder: builder.query<Order, { number: string; email: string }>({
      query: (body) => ({ url: "/orders/track", method: "POST", body }),
      transformResponse: unwrap<Order>,
      providesTags: (_r, _e, arg) => [{ type: "Order", id: arg.number }],
    }),
    getMyOrders: builder.query<Order[], void>({
      query: () => ({ url: "/orders/my-orders", params: { limit: 100 } }),
      transformResponse: (response: Envelope<Paginated<Order>>) =>
        unwrap<Paginated<Order>>(response).docs,
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
        unwrap<Paginated<Order>>(response).docs,
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

    /* ------------------------------ promos (unavailable) ------------------------------- */
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

    /* ----------------------------- settings (unavailable — FE falls back to DEFAULT_SETTINGS) ------------------------------ */
    getSettings: builder.query<SiteSettings, void>({
      query: () => "/settings",
      transformResponse: unwrap<SiteSettings>,
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<SiteSettings, Partial<SiteSettings>>({
      query: (body) => ({ url: "/settings", method: "PUT", body }),
      transformResponse: unwrap<SiteSettings>,
      invalidatesTags: ["Settings", "Cart"],
    }),
    resetSettings: builder.mutation<SiteSettings, void>({
      query: () => ({ url: "/settings/reset", method: "POST" }),
      transformResponse: unwrap<SiteSettings>,
      invalidatesTags: ["Settings", "Cart"],
    }),

    /* -------------------------- admin analytics (unavailable) -------------------------- */
    getDashboard: builder.query<DashboardData, number | void>({
      query: (days) => ({ url: "/dashboard", params: { days: days || 30 } }),
      transformResponse: unwrap<DashboardData>,
      providesTags: ["Dashboard"],
    }),
    getCustomers: builder.query<CustomerRow[], void>({
      query: () => ({ url: "/customers", params: { limit: 100 } }),
      transformResponse: (response: Envelope<Paginated<CustomerRow>>) =>
        unwrap<Paginated<CustomerRow>>(response).docs,
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
  error?: string;
  errors?: unknown[];
}

/** Pulls a readable message out of an RTK Query error. */
export const apiError = (error: unknown, fallback = "Something went wrong") => {
  const data = (error as { data?: ApiErrorBody | string } | undefined)?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (Array.isArray(data.errors) && data.errors.length)
      return String(data.errors[0]);
  }
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
