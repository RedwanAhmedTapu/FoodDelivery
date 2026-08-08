# Multi-Vendor Food Delivery Platform — Backend

Production-ready Node.js/Express/MongoDB backend for a multi-vendor food delivery
platform (Foodpanda/Uber Eats style) with multi-store shop owners, store
customization, a points/referral system, personalized recommendations, and
live delivery tracking over Socket.IO.

## Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication (access + rotating refresh tokens) + bcrypt
- Socket.IO for real-time order/delivery tracking
- Cloudinary for image storage, Multer for uploads
- Zod for request validation
- Swagger/OpenAPI for API docs

## Getting started

```bash
cp .env.example .env      # fill in your Mongo URI, JWT secrets, Cloudinary keys
npm install
npm run dev                # nodemon, requires a running MongoDB instance
```

The API is served under `/api/v1`. Interactive docs: `http://localhost:5000/api-docs`
(raw spec at `/api-docs.json`). Health check: `GET /health`.

## Project structure

```
src/
├── app.js, server.js
├── config/            # env, db, cloudinary
├── modules/            # one folder per domain (auth, stores, orders, ...)
│   └── <module>/
│       ├── *.model.js
│       ├── *.service.js     # business logic (thin controllers call into these)
│       ├── *.controller.js
│       ├── *.routes.js
│       └── *.validation.js  # Zod schemas
├── middleware/          # auth, role, error, upload, validation
├── utils/               # tokens, pagination, slugs, referral codes, distance
├── sockets/              # Socket.IO server + delivery tracking events
└── docs/                # Swagger/OpenAPI config
```

See `docs/API_REFERENCE.md` for the full endpoint table and
`docs/SOCKET_EVENTS.md` for the Socket.IO event contract.

## Roles

`SUPER_ADMIN`, `SHOP_OWNER`, `CUSTOMER`, `DELIVERY_BOY` — enforced via
`requireRole(...)` middleware on every protected route. Ownership checks
(a shop owner can only touch their own stores/foods/orders) are enforced
in the service layer, never trusting IDs from the request body.

## Key business rules implemented

- **Server-side pricing only.** `orders/orderPricing.service.js` is the single
  source of truth for subtotal, tax, delivery fee, platform fee, and points
  discount — the frontend's numbers are never trusted.
- **Order item price snapshots.** Historical orders keep their original
  prices even if a food's price changes later.
- **Points ledger.** Every balance change is an immutable `PointTransaction`
  row (`EARN`, `REDEEM`, `REFERRAL_BONUS`, `ADMIN_ADJUSTMENT`, `REFUND`,
  `EXPIRED`) rather than a bare balance mutation.
- **MongoDB transactions** wrap order creation (stock deduction + point
  redemption + cart clearing) and referral reward issuance so partial
  failures can't corrupt state.
- **Referral abuse prevention.** A unique `(referralId, referredUserId)`
  index plus a `rewardIssued` flag stops duplicate/self-referral rewards.
- **Store customization sanitization.** Rich-text fields are stripped of
  HTML/JS before persisting (`utils/sanitizeText.js`).
- **Bulk food upload** validates every CSV/Excel row independently and
  reports per-row errors without inserting invalid records.
- **Delivery location privacy.** Live GPS is only broadcast into
  `order:{orderId}` Socket.IO rooms, which only the customer, the assigned
  delivery boy, and the store/admin join.

## What's stubbed vs. real

- **Payment gateways**: the `PaymentService` abstraction and Cash-on-Delivery
  flow are fully functional. SSLCommerz/bKash/Nagad/Stripe use a stub
  gateway with the same interface (`createPayment/verifyPayment/refundPayment`)
  — swap in real SDK calls in `modules/payments/gateways/` when you're ready
  to go live, and nothing else in the codebase needs to change.
- **Email/SMS delivery**: `forgotPassword` returns the reset token directly
  in non-production responses instead of sending an email/SMS — wire up a
  provider (SendGrid, Twilio, etc.) in `auth.service.js` for production.
- **Recommendations**: rule-based (purchase frequency, favorite categories/
  stores) by design, with the profile-building step deliberately separated
  from the ranking step so it can be swapped for an ML model later.

## Local MongoDB & transactions

Order creation, referral reward issuance, and admin point adjustments use
MongoDB multi-document transactions (`src/utils/runTransaction.js`) so
related writes succeed or fail together — e.g. an order is never created
without its stock deduction and point-redemption ledger entry also landing.

**Transactions require a replica set.** A standalone `mongod` (the default
if you just run `mongod` locally without `--replSet`) will reject them with:

```
Transaction numbers are only allowed on a replica set member or mongos
```

`runTransaction()` catches exactly this error and falls back to running the
same writes without a session, so **local development still works** — you'll
just see a one-time console warning, and you lose the atomicity guarantee
(if a fallback write partially fails, earlier writes in that flow won't be
rolled back). This fallback should never be relied on in production.

To get real transactions locally, pick one:

- **MongoDB Atlas** (recommended, free tier available) — Atlas clusters are
  always at least a single-node replica set, so transactions work with zero
  extra config. Just point `MONGO_URI` at your Atlas connection string.
- **Docker, single-node replica set:**
  ```bash
  docker run -d -p 27017:27017 --name food-delivery-mongo mongo:7 --replSet rs0
  docker exec -it food-delivery-mongo mongosh --eval "rs.initiate()"
  ```
- **Local `mongod` install** — start it with `mongod --replSet rs0`, then
  run `mongosh --eval "rs.initiate()"` once.

## Testing

No live MongoDB instance was available in the environment this was built in,
so the code has been verified via `node --check` (syntax) and a full
`require('./src/app.js')` module-resolution check (import graph, route
wiring, Mongoose schema registration). Run it yourself against a real
MongoDB instance before deploying; a Postman collection is included at
`docs/postman_collection.json` for manual/automated endpoint testing.
