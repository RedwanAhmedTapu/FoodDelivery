# RickshawBites — Frontend

Next.js 14 (App Router + TypeScript + Tailwind) frontend for the multi-vendor
food delivery backend. Covers customer shopping/checkout with live order
tracking, a shop owner dashboard, an admin dashboard, and a delivery rider
app — all against the Express/MongoDB API from `../backend`.

## Getting started

```bash
cp .env.example .env.local     # point at your running backend
npm install
npm run dev
```

Requires the backend running (default `http://localhost:5000`) with
`CLIENT_URL` in the backend's `.env` set to this app's origin
(`http://localhost:3000`) so CORS and Socket.IO both allow it.

## Design

"Night Market" identity: charcoal base, mango/chili accents, Fraunces
display type + Inter body + IBM Plex Mono for prices/order codes. The
signature motif is a torn-ticket card notch (`.ticket-notch` in
`globals.css`) reused on store cards, food cards, and category chips, plus
a dotted delivery-route stepper (`OrderStatusStepper`) on the order
tracking page.

## Structure

```
src/
├── app/                     # routes (App Router)
│   ├── page.tsx              # home
│   ├── login/, register/
│   ├── stores/, stores/[slug]/
│   ├── cart/, checkout/
│   ├── orders/, orders/[id]/  # live tracking via Socket.IO
│   ├── profile/, points/
│   └── dashboard/
│       ├── shop-owner/        # stores, menu, orders
│       ├── admin/             # approvals, categories, analytics, settings
│       └── delivery/          # online toggle, GPS push, active deliveries
├── components/
│   ├── ui/                    # Button, Field (Input/Textarea/Select), Primitives (Card/Badge/Spinner/EmptyState)
│   ├── layout/                 # Navbar, Footer, DashboardShell
│   ├── store/, food/, order/   # domain cards + FoodPickerModal + OrderStatusStepper
├── lib/
│   ├── api.ts                  # axios instance, refresh-token rotation
│   ├── endpoints/               # one file per backend module
│   ├── socket.ts                # Socket.IO client singleton
│   └── useRequireAuth.tsx       # client-side route guard + <AuthGate>
├── store/                     # zustand: useAuthStore, useCartStore
└── types/                     # TS types mirroring backend Mongoose models
```

## Auth model

JWT access + refresh tokens are stored in `localStorage` and attached via an
axios request interceptor. A response interceptor transparently refreshes
and retries on a 401, redirecting to `/login` only if the refresh token is
also invalid. Protected pages/dashboards use `<AuthGate allowedRoles={[...]}>`,
which shows a spinner during hydration and redirects unauthenticated/
wrong-role users — so protected UI never flashes before the redirect fires.

## Real-time order tracking

`orders/[id]/page.tsx` connects to the backend's Socket.IO server with the
JWT access token, joins the `order:{orderId}` room via `order:track`, and
listens for `order:status` and `delivery:location` events. The delivery
dashboard (`dashboard/delivery/page.tsx`) uses `navigator.geolocation.watchPosition`
to both push location to the REST endpoint and emit `delivery:location:update`
over the socket while a delivery is `ON_THE_WAY`.

**Known limitation**: there's no map library wired in (would need a Maps API
key), so live GPS is shown as a coordinate readout rather than a pin on a
map. Swapping in Mapbox/Google Maps/Leaflet is a drop-in addition to the
`isTracking` block in `orders/[id]/page.tsx` — the coordinates are already
flowing through Socket.IO.

## What's implemented vs. what's left

Implemented: full customer shopping flow (browse → store menu with
variants/addons → cart with single-store conflict handling → checkout with
points redemption and referral codes → live-tracked order detail → reviews),
shop owner (multi-store management, menu CRUD, bulk CSV upload, order status
transitions), admin (dashboard analytics, store/shop-owner/delivery-boy
approvals, category CRUD, platform settings), and delivery rider (online
toggle, GPS broadcasting, delivery lifecycle).

Not built out (natural next additions, all have backend endpoints ready):
notifications bell/inbox UI, referral campaign management UI, order
reporting UI, recommendations surfaced on the home page, review browsing on
store/food pages, and image upload UI for store/food photos (the backend
endpoints exist; only the buttons/forms are missing).
