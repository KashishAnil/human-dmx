/**
 * Minimal localStorage helpers.
 *
 * Products, categories, carts, orders, promos and site copy all come from the
 * API and live in the RTK Query cache — none of it is persisted here. The only
 * things written to the browser are *identity*, which the server can't
 * remember for us:
 *
 *   humandmx:v4:auth       the signed-in session (see slices/authSlice)
 *   humandmx:cartToken     the anonymous guest cart id (see services/api)
 *   humandmx:recentOrders  order number + email, so a guest can reopen their
 *                          own receipt (see utils/recentOrders)
 *
 * Drop those and a refresh would sign the user out and orphan their cart, so
 * they stay. Everything else is read from MongoDB on every request.
 */
const NS = "humandmx";

/**
 * Bumped from v3 when the app stopped keeping its catalog client-side. The
 * change means anything stored under an older version is stale by definition.
 */
const VERSION = "v4";

const key = (name: string) => `${NS}:${VERSION}:${name}`;

export const loadState = <T>(name: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveState = (name: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* quota exceeded or private mode — the app still works, just not sticky */
  }
};

/**
 * Clears the old client-side store.
 *
 * Anyone who used the app before it had a backend still has `humandmx:v3:*`
 * keys holding a whole demo catalog, order history and admin session. Nothing
 * reads them any more, but leaving several hundred KB of stale products in
 * every returning browser invites confusion about where the data came from.
 * Run once at boot; it is a no-op on a clean browser.
 */
export const purgeLegacyState = () => {
  if (typeof window === "undefined") return;
  try {
    Object.keys(window.localStorage)
      .filter(
        (k) => k.startsWith(`${NS}:`) && !k.startsWith(`${NS}:${VERSION}:`),
      )
      // The cart token and guest receipts are unversioned and still current.
      .filter((k) => k !== `${NS}:cartToken` && k !== `${NS}:recentOrders`)
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* private mode — nothing was stored to begin with */
  }
};
