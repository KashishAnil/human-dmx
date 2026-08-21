import type { OrderStatus } from "../types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  exchange: "Exchange",
  cancelled: "Cancelled",
};

/** Chip styles for the light storefront surfaces. */
export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-line text-body",
  paid: "bg-royal-tint text-royal",
  processing: "bg-grape/15 text-[#5b4283]",
  shipped: "bg-gold-tint text-gold-ink",
  delivered: "bg-mint/15 text-mint",
  exchange: "bg-coral/15 text-[#b23a33]",
  cancelled: "bg-line text-soft",
};

/** Chip styles for the dark merchant portal. */
export const STATUS_TONE_DARK: Record<OrderStatus, string> = {
  pending: "bg-white/10 text-muted",
  paid: "bg-royal/25 text-royal-light",
  processing: "bg-grape/30 text-[#c4aee8]",
  shipped: "bg-gold/20 text-gold",
  delivered: "bg-mint/25 text-[#6fd39c]",
  exchange: "bg-coral/20 text-[#f28e88]",
  cancelled: "bg-white/8 text-muted-2",
};
