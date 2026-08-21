import type { CategoryMeta, CategorySlug, SiteSettings } from "../types";

/**
 * Static assets and first-paint fallbacks.
 *
 * The catalog itself (products, categories, promos, site copy) is served by
 * the API and managed in the merchant portal — what's left here is the shipped
 * imagery plus the defaults the UI renders while the first request is in
 * flight, so nothing has to guard against `undefined`.
 */

/**
 * Shipped artwork, as raw paths.
 *
 * These are deliberately *not* prefixed with the app's base path here. Every
 * image in the UI goes through `resolveImage` at render, and pre-prefixing
 * meant the product editor's picker resolved them a second time, producing
 * "/drima/drima/images/..." and a broken thumbnail. Store raw, resolve once.
 */
export const IMG = {
  /* studio shots supplied by the client */
  hoodieFront: "/images/products/hoodie-front.jpg",
  hoodieBack: "/images/products/hoodie-back.jpg",
  capFront: "/images/products/cap-front.jpg",
  capBack: "/images/products/cap-back.jpg",
  capSide: "/images/products/cap-side.jpg",
  /* original lifestyle shots */
  beanie: "/images/products/beanie-1986.jpg",
  teeBack: "/images/products/tee-human-back.jpg",
  teeCap: "/images/products/tee-human-cap.jpg",
  hoodieSide: "/images/products/hoodie-side-86.jpg",
  hoodieJustice: "/images/products/hoodie-justice.jpg",
  hoodieBeanie: "/images/products/hoodie-beanie.jpg",
  /* brand mascot, transparent */
  mascot: "/images/products/logo-mascot.png",
} as const;

/** Fallback rail — replaced by `useCategories()` once the API responds. */
export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "hoodies",
    sizes: ["S", "M", "L", "XL", "XXL"],
    name: "Hoodies",
    tagline: "Heavyweight fleece, front graphic",
    image: IMG.hoodieFront,
    price: 40,
  },
  {
    slug: "t-shirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    name: "T-Shirts",
    tagline: "Cotton tees, back hit",
    image: IMG.teeBack,
    price: 20,
  },
  {
    slug: "hats",
    sizes: ["One Size"],
    name: "Hats",
    tagline: "Snapbacks, gold embroidery",
    image: IMG.capFront,
    price: 20,
  },
  {
    slug: "sweater-hats",
    sizes: ["One Size"],
    name: "Sweater Hats",
    tagline: "Knit beanies, cuffed",
    image: IMG.beanie,
    price: 20,
  },
];

export const CATEGORY_LABEL: Record<CategorySlug, string> = {
  hoodies: "Hoodies",
  "t-shirts": "T-Shirts",
  hats: "Hats",
  "sweater-hats": "Sweater Hats",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement:
    "Free shipping on orders over $75 · Shipping to all 50 states · Exchanges only, no refunds",
  announcementActive: true,
  heroEyebrow: "Est. 1986 · Brooklyn, New York",
  heroTitle: "Back To The\nOld School",
  heroSubtitle:
    "The official store of the Human DMX. Hats, hoodies, tees and sweater hats built off the 1986 debut — the same b-boy that came up on the Just-Ice records, now stitched on something you can wear.",
  heroCta: "Shop The Drop",
  logoVideoUrl: "",
  storyHuman:
    "HUMAN is the name on the back. One word arched high, nothing else — the side of the brand that speaks plain. It's the tee you throw on without thinking and end up wearing three days straight.",
  storyDmx:
    "DMX is the character. Blue snapback, coral track jacket, fresh Nikes, frozen mid-crouch doing the Human Box. He came off the record sleeves in 1986 and he hasn't aged a day since.",
  exchangePolicy:
    "Exchanges only — no refunds. Unworn items with tags attached can be exchanged for a different size or a different piece within 30 days of delivery. Email us with your order number and we'll send a prepaid label.",
  shippingPolicy:
    "Orders ship within 2 business days from Brooklyn, NY. Standard delivery runs 3–7 business days to all 50 states. Free standard shipping on orders over $75.",
  freeShippingThreshold: 75,
  flatShipping: 6.95,
  taxRate: 0.08875,
  supportEmail: "orders@humandmxapparel.com",
  instagram: "https://instagram.com/humandmxapparel",
  youtube: "https://youtube.com/@humandmxapparel",
  tiktok: "https://tiktok.com/@humandmxapparel",
};

export const LOOKBOOK: { src: string; caption: string }[] = [
  { src: IMG.hoodieFront, caption: "Signature Hoodie" },
  { src: IMG.capFront, caption: "Snapback · Front" },
  { src: IMG.teeBack, caption: "HUMAN · Back" },
  { src: IMG.beanie, caption: "1986 Sweater Hat" },
  { src: IMG.capSide, caption: "Snapback · Side" },
  { src: IMG.capBack, caption: "Gold Script" },
  { src: IMG.hoodieBeanie, caption: "Full Fit" },
  { src: IMG.teeCap, caption: "Cap + Tee" },
];
