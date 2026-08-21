import { BASE_NAME, UPLOADS_URL } from "../constants/api";
import type { Order, Product } from "../types";

/** Resolve a path under `public/` against the app basename (needed on customdev subpaths). */
export const ImageUrl = (path: string) => {
  const base = BASE_NAME.replace(/\/$/, "") || "";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}` || clean;
};

/**
 * Resolves an image path from the API. The backend emits three forms:
 *
 *   "Uploads/…"   a merchant upload, served by the API
 *   "/images/…"   a shipped asset in this app's own public/ folder
 *   "http(s)://…" absolute, used as-is
 *
 * Anything falsy falls back to the placeholder so a product saved without
 * artwork renders a tile rather than a broken image.
 */
export const resolveImage = (path: string | undefined | null): string => {
  if (!path) return ImageUrl("/images/dummy.jpg");
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return ImageUrl(path);
  return `${UPLOADS_URL}${path}`;
};

export const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export const compactMoney = (value: number) =>
  value >= 1000
    ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
    : money(value);

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const orderNumber = () =>
  `DMX-${Math.floor(100000 + Math.random() * 899999)}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const stockFor = (product: Product | undefined, size: string) =>
  product?.variants.find((v) => v.size === size)?.stock ?? 0;

export const totalStock = (product: Product) =>
  product.variants.reduce((sum, v) => sum + v.stock, 0);

export const isSoldOut = (product: Product) => totalStock(product) === 0;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const orderUnits = (order: Order) =>
  order.lines.reduce((sum, l) => sum + l.qty, 0);

export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");
