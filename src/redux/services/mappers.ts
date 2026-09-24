import { slugify } from "../../utils/Functions";
import type {
  CategoryMeta,
  Collection,
  Product,
  Variant,
} from "../../types";

/** Backend product document (Mongoose). */
export interface BackendProduct {
  _id: string;
  productName: string;
  description?: string;
  size?: string[];
  price: number;
  quantity: number;
  collection?: "Human" | "DMX" | string;
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
    // Backend Product has no category field — shop filters by this will be empty until one exists.
    category: "",
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
  const quantity = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

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
