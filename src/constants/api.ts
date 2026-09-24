/**
 * API host. Set `VITE_API_BASE_URL` in `.env` (defaults to local Express).
 */
const URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    "",
  ) || "http://localhost:3000";

/**
 * Where the app is mounted. Derived from Vite's `base` (vite.config.ts) rather
 * than from the hostname, so the router, the asset paths and the dev server
 * can never disagree about the prefix.
 */
const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

export const SOCKET_URL = URL;
export const STATIC_URL = `${URL}/Uploads/static/`;
export const UPLOADS_URL = `${URL}/`;
/** Express mounts routes at the host root (no `/api/v1` prefix). */
export const BASE_URL = URL;
export const ENV = "development" as const;
export const BASE_NAME = basename;
