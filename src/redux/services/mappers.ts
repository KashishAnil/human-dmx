import { slugify } from "../../utils/Functions";
import { DEFAULT_SETTINGS } from "../../data/catalog";
import type {
  CategoryMeta,
  Collection,
  Order,
  OrderStatus,
  Product,
  Variant,
} from "../../types";
import type { ServerCart } from "./api";

/** Backend product document (Mongoose). */
export interface BackendProduct {
  _id: string;
  productName: string;
  description?: string;
  size?: string[];
  price: number;
  quantity: number;
  collection?: "Human" | "DMX" | string;
  category?: { _id?: string; categoryName?: string } | string | null;
  isActive?: boolean;
  availability?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend category document. */
export interface BackendCategory {
  _id: string;
  categoryName: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_IMAGE = "/images/dummy.jpg";
const DEFAULT_SIZES = ["One Size", "S", "M", "L", "XL", "XXL"];

export const mapCollectionIn = (value?: string): Collection =>
  value === "Human" || value === "HUMAN" ? "HUMAN" : "DMX";

export const mapCollectionOut = (
  value?: Collection | string,
): "Human" | "DMX" | undefined => {
  if (value === "HUMAN" || value === "Human") return "Human";
  if (value === "DMX") return "DMX";
  return undefined;
};

/** Map a backend product into the shape storefront components expect. */
export const mapProduct = (doc: BackendProduct): Product => {
  const sizes =
    Array.isArray(doc.size) && doc.size.length > 0 ? doc.size : ["One Size"];
  const qty = Number(doc.quantity) || 0;
  const variants: Variant[] = sizes.map((size) => ({
    size,
    // Backend stores one stock pool for the product; mirror it on every size.
    stock: qty,
  }));

  const name = doc.productName ?? "";
  const description = doc.description ?? "";

  return {
    id: String(doc._id),
    slug: slugify(name) || String(doc._id),
    name,
    category: categorySlug(doc.category),
    collection: mapCollectionIn(doc.collection),
    price: Number(doc.price) || 0,
    compareAt: null,
    images: [DEFAULT_IMAGE],
    blurb: description,
    description,
    details: [],
    badge: null,
    featured: Boolean(doc.isFeatured),
    active: doc.isActive !== false,
    variants,
    rating: 5,
    reviewCount: 0,
    createdAt: doc.createdAt ?? new Date().toISOString(),
  };
};

/** Map FE product (partial) → backend create/update body. */
export const toBackendProductBody = (
  body: Partial<Product> & {
    name?: string;
    variants?: Variant[];
    active?: boolean;
    featured?: boolean;
  },
): Record<string, unknown> => {
  const variants = body.variants ?? [];
  const sizes = variants.map((v) => v.size).filter(Boolean);
  // One quantity for the product. Sizes share it, so this is that number, not a sum.
  const quantity = variants.length
    ? Math.max(...variants.map((v) => Number(v.stock) || 0))
    : 0;

  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.productName = body.name;
  if (body.description !== undefined) out.description = body.description;
  else if (body.blurb !== undefined) out.description = body.blurb;
  if (sizes.length) out.size = sizes;
  if (body.price !== undefined) out.price = body.price;
  if (variants.length) out.quantity = quantity;
  const collection = mapCollectionOut(body.collection);
  if (collection) out.collection = collection;
  if (body.active !== undefined) out.isActive = body.active;
  if (body.featured !== undefined) out.isFeatured = body.featured;
  return out;
};

/** Map a backend category into CategoryMeta (+ id / productCount for the API type). */
export const mapCategory = (
  doc: BackendCategory,
): CategoryMeta & { id: string; productCount: number } => {
  const name = doc.categoryName ?? "";
  return {
    id: String(doc._id),
    slug: slugify(name) || String(doc._id),
    name,
    tagline: "",
    image: DEFAULT_IMAGE,
    price: 0,
    sizes: DEFAULT_SIZES,
    productCount: 0,
  };
};

/** Decode a JWT payload without verifying (verification is the server's job). */
export const decodeJwtPayload = (
  token: string,
): { userId?: string; role?: string; [key: string]: unknown } | null => {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const mapRole = (role?: string): "admin" | "user" =>
  role === "Admin" || role === "admin" ? "admin" : "user";

const categorySlug = (
  category: BackendProduct["category"],
): string => {
  if (category && typeof category === "object" && category.categoryName) {
    return slugify(category.categoryName) || "";
  }
  return "";
};

const ORDER_STATUS: Record<string, OrderStatus> = {
  "Order Pending": "pending",
  "Order Paid": "paid",
  Processing: "processing",
  Shipped: "shipped",
  "Out for Delivery": "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
  "Exchange Requested": "exchange",
  "Exchange Approved": "exchange",
  "Exchange in Transit": "exchange",
  "Exchange Processing": "exchange",
  "Exchange Shipped": "exchange",
  "Exchange Completed": "exchange",
};

/** Backend cart document → the priced cart the storefront already renders. */
export const mapCart = (input: unknown): ServerCart => {
  const doc = (input ?? {}) as {
    _id?: string;
    items?: {
      product?: BackendProduct | string;
      size?: string;
      quantity?: number;
    }[];
  };
  const lines = (doc.items ?? [])
    .map((item) => {
      const product =
        item.product && typeof item.product === "object" ? item.product : null;
      if (!product?._id) return null;
      const mapped = mapProduct(product);
      const qty = Number(item.quantity) || 0;
      const price = mapped.price;
      return {
        key: `${mapped.id}::${item.size ?? ""}`,
        productId: mapped.id,
        size: item.size ?? "",
        qty,
        name: mapped.name,
        slug: mapped.slug,
        image: mapped.images[0],
        price,
        stock: Number(product.quantity) || 0,
        lineTotal: price * qty,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);

  return {
    id: doc?._id ? String(doc._id) : null,
    lines,
    totals: {
      subtotal,
      itemCount,
      discount: 0,
      shippingCost: 0,
      tax: 0,
      total: subtotal,
      freeShippingRemaining: Math.max(
        0,
        DEFAULT_SETTINGS.freeShippingThreshold - subtotal,
      ),
    },
    promo: null,
    promoCode: null,
    adjustments: [],
  };
};

export const emptyCart = (): ServerCart => mapCart({ items: [] });

interface BackendOrder {
  _id?: string;
  items?: {
    product?: BackendProduct | string;
    quantity?: number;
    priceAtPurchase?: number;
    size?: string;
  }[];
  totalPrice?: number;
  shippingAddress?: {
    recipientName?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string | number;
    country?: string | number;
  };
  email?: string;
  phoneNumber?: string | number;
  orderStatus?: string;
  createdAt?: string;
}

/** Backend order document → the Order shape checkout already reads. */
export const mapOrder = (doc: BackendOrder): Order => {
  const id = String(doc?._id ?? "");
  const address = doc?.shippingAddress ?? {};
  const recipient = String(address.recipientName ?? "").trim();
  const [firstName, ...rest] = recipient.split(/\s+/);

  return {
    id,
    number: id,
    createdAt: doc?.createdAt ?? new Date().toISOString(),
    customer: {
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      email: doc?.email ?? "",
      phone: String(doc?.phoneNumber ?? ""),
    },
    shipping: {
      address1: address.streetAddress ?? "",
      address2: "",
      city: address.city ?? "",
      state: address.state ?? "",
      zip: String(address.zipCode ?? ""),
      country: String(address.country ?? ""),
    },
    lines: (doc?.items ?? []).map((item) => {
      const product =
        item.product && typeof item.product === "object" ? item.product : null;
      return {
        productId: String(product?._id ?? item.product ?? ""),
        name: product?.productName ?? "",
        image: DEFAULT_IMAGE,
        size: item.size ?? "",
        qty: Number(item.quantity) || 0,
        price: Number(item.priceAtPurchase) || 0,
      };
    }),
    subtotal: Number(doc?.totalPrice) || 0,
    shippingCost: 0,
    tax: 0,
    discount: 0,
    total: Number(doc?.totalPrice) || 0,
    promoCode: null,
    status: ORDER_STATUS[doc?.orderStatus ?? ""] ?? "pending",
    paymentLast4: "",
    timeline: [],
    exchangeNote: null,
  };
};
