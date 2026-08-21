/**
 * Guest order receipts.
 *
 * The API deliberately requires an order number *and* the email it was placed
 * with before it will hand back an order — a guessable number alone must not
 * expose someone's address. Guests have no account to look that up from, so
 * after checkout we remember the pairing locally. That's what lets
 * `/order/:number` open straight from the confirmation redirect, and what
 * repopulates the tracking form on a return visit.
 *
 * Only the shopper's own orders on their own device land here.
 */
const KEY = "humandmx:recentOrders";
const LIMIT = 20;

interface RecentOrder {
  number: string;
  email: string;
}

const read = (): RecentOrder[] => {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const rememberOrder = (number: string, email: string) => {
  if (!number || !email) return;
  try {
    const next = [
      { number, email },
      ...read().filter((o) => o.number !== number),
    ].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — tracking by number + email still works manually */
  }
};

/** The email an order was placed with, if this device placed it. */
export const emailForOrder = (number: string | undefined): string | null =>
  (number && read().find((o) => o.number === number)?.email) || null;

export const recentOrders = read;
