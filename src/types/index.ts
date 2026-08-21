/**
 * Categories are managed in the merchant portal, so this is an open string
 * rather than a closed union — the four shipped slugs ("hats", "sweater-hats",
 * "t-shirts", "hoodies") are just the starting set.
 */
export type CategorySlug = string;

export type Collection = "HUMAN" | "DMX";

export interface Variant {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  collection: Collection;
  price: number;
  compareAt: number | null;
  images: string[];
  blurb: string;
  description: string;
  details: string[];
  badge: string | null;
  featured: boolean;
  active: boolean;
  variants: Variant[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartLine {
  key: string;
  productId: string;
  size: string;
  qty: number;
}

export interface OrderLine {
  productId: string;
  name: string;
  image: string;
  size: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "exchange"
  | "cancelled";

export interface TimelineEvent {
  status: OrderStatus | "note";
  at: string;
  note: string;
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  customer: Customer;
  shipping: ShippingAddress;
  lines: OrderLine[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  promoCode: string | null;
  status: OrderStatus;
  paymentLast4: string;
  timeline: TimelineEvent[];
  exchangeNote: string | null;
}

export type PromoType = "percent" | "fixed" | "shipping";

export interface Promo {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  minSubtotal: number;
  active: boolean;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  description: string;
}

export interface SiteSettings {
  announcement: string;
  announcementActive: boolean;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  /** "Video on my logo" — optional MP4/WebM that replaces the animated brandmark. */
  logoVideoUrl: string;
  storyHuman: string;
  storyDmx: string;
  exchangePolicy: string;
  shippingPolicy: string;
  freeShippingThreshold: number;
  flatShipping: number;
  taxRate: number;
  supportEmail: string;
  instagram: string;
  youtube: string;
  tiktok: string;
}

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  tagline: string;
  image: string;
  price: number;
  /** Selectable sizes for products in this category, managed server-side. */
  sizes: string[];
}
