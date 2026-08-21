const { hostname } = window.location;

const servers = {
  local: "http://localhost:3073",
  customDev: "https://react.customdev.solutions:3073",
  live: "https://api.humandmxapparel.com",
  live_test: "https://api.test.humandmxapparel.com",
  testing: "https://ldn26m62-3073.inc1.devtunnels.ms",
};

let URL: string;

/**
 * Where the app is mounted. Derived from Vite's `base` (vite.config.ts) rather
 * than from the hostname, so the router, the asset paths and the dev server
 * can never disagree about the prefix. On customdev that resolves to "/drima",
 * matching the FTP layout and public/.htaccess; at the domain root it's "/".
 */
const basename = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

type Environment =
  | "development"
  | "customdev"
  | "live"
  | "testing"
  | "live_test";
let enviroment: Environment = "development";

if (hostname.includes("react.customdev.solutions")) {
  URL = servers.customDev;
  enviroment = "customdev";
} else if (hostname.includes("app.humandmxapparel.com")) {
  URL = servers.live_test;
  enviroment = "live_test";
} else if (hostname.includes("humandmxapparel.com")) {
  URL = servers.live;
  enviroment = "live";
} else if (hostname.includes("devtunnels.ms")) {
  URL = servers.testing;
  enviroment = "testing";
} else {
  URL = servers.local;
  enviroment = "development";
}

export const SOCKET_URL = URL;
export const STATIC_URL = servers.live + "/Uploads/static/";
export const UPLOADS_URL = `${URL}/`;
export const BASE_URL = `${URL}/api/v1`;
export const ENV = enviroment;
export const BASE_NAME = basename;
