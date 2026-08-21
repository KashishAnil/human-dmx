# HUMAN DMX APPAREL

Full-stack e-commerce for the Human DMX storefront: a React storefront, a
merchant portal, and an Express/MongoDB API behind both.

```
.                 React 19 + Vite + Tailwind + RTK Query   (storefront + portal)
└── backend/      Express 4 + TypeScript + Mongoose         (API)
```

## Running it

Requires **Node 22** (see `.nvmrc` in `backend/` — Node 24+ breaks
`jsonwebtoken`) and a local MongoDB.

```bash
cd backend && nvm use && npm install && npm run seed && npm run dev
```

```bash
npm install && npm run dev
```

- Storefront — http://localhost:5173
- Merchant portal — http://localhost:5173/admin
- API — http://localhost:3073 (`/health` for a status probe)

Seeded accounts (change these before deploying — see `backend/.env`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@humandmxapparel.com` | `dmx19861986` |
| Shopper | `shopper@example.com` | `shopper1234` |

`npm run seed` rebuilds the catalog, promos, site copy and 42 demo orders. It
drops those collections first, so never point it at production.

## How the two halves fit together

The storefront reads everything through the hooks in
[`src/hooks/useCommerce.ts`](src/hooks/useCommerce.ts) — `useProducts`,
`useCart`, `useSettings`, `useOrders` and friends. Those hooks sit on top of a
single RTK Query API in
[`src/redux/services/api.ts`](src/redux/services/api.ts); components don't talk
to the network directly. Swapping a data source means changing a hook, not a
page.

Only two things are still client state: the signed-in session (`authSlice`,
persisted to localStorage) and whether the cart drawer is open.

### Money and stock are the server's job

Cart totals, discounts, shipping and tax are computed by the API and re-read on
every cart request. The client renders those numbers but never decides them, so
a crafted request can't set its own price. Checkout takes stock with a
conditional atomic update per variant — 36 simultaneous checkouts against 26
units yields 26 orders and 10 conflicts, never an oversell.

If a cart changes underneath a shopper (price moved, size sold out, product
hidden), the API reconciles it and returns an `adjustments` array explaining
what changed; the drawer and cart page show those, and checkout refuses to
proceed until the shopper has seen them.

### Guest orders

The API will only return an order given its number *and* the email it was
placed with — a guessable order number alone reveals nothing. Guests have no
account to look that up from, so
[`src/utils/recentOrders.ts`](src/utils/recentOrders.ts) remembers the pairing
on the device. That's what makes the post-checkout redirect work and what
populates the shortcuts on the tracking page.

### Images

Three path forms come off the API, resolved by `resolveImage` in
[`src/utils/Functions.ts`](src/utils/Functions.ts):

- `Uploads/…` — merchant upload, served by the API
- `/images/…` — shipped asset in this app's `public/` folder
- `http(s)://…` — absolute

## API

Full endpoint reference in [`backend/README.md`](backend/README.md). Everything
lives under `/api/v1` and answers with `{ success, message, data }`. Documents
expose `id`, never `_id`.

## Checks

```bash
npm run build && npx tsc -b --noEmit && npx eslint src
```

```bash
cd backend && npm run build
```

## Known gaps

- **Payment is simulated.** Checkout captures the last four digits and marks
  the order paid; no gateway is wired up. Card details never leave the browser.
- **Email is best-effort.** Order confirmations go through
  `@hamza-salsoft/email-utils`; a failing mail server won't fail an order.
- **No customer-facing account area.** The API supports shopper signup, login,
  saved addresses and order history, but the storefront has no UI for it yet —
  guest checkout is the only path.
- **The catalog is fetched whole** (`?limit=100`) and filtered in the browser,
  matching how the shop page already worked. Move filtering server-side if the
  catalog grows past a few hundred items.
- **antd v5 warns on React 19.** Pre-existing; the portal works, but the
  console carries a compatibility notice.
