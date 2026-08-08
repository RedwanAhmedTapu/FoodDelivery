# Database Schema Documentation

MongoDB collections (via Mongoose), grouped by domain. Relationships are
expressed as ObjectId references — Mongoose `.populate()` is used at the
service layer where needed rather than embedding, so history/audit data
stays independent of live document state.

## Identity

- **User** — base account for every role (`SUPER_ADMIN`, `SHOP_OWNER`,
  `CUSTOMER`, `DELIVERY_BOY`). Holds shared fields: contact info, address,
  `location` (2dsphere GeoJSON Point), `pointsBalance`, `totalOrders`,
  hashed `refreshTokenHash` for session rotation.
- **ShopOwnerProfile** (1:1 with User where role=SHOP_OWNER) — business
  info, documents, `approvalStatus`.
- **DeliveryBoy** (1:1 with User where role=DELIVERY_BOY) — vehicle info,
  `currentLocation` (2dsphere), `isOnline`/`isAvailable`, earnings.

## Catalog

- **Store** (N:1 → User via `ownerId`) — one shop owner can own many
  stores. `location` (2dsphere), `isActive`, `approvalStatus`.
- **StoreCustomization** (1:1 → Store) — theme colors, banner, sanitized
  custom sections.
- **FoodCategory** — platform-level, admin-managed only.
- **Food** (N:1 → Store, N:1 → FoodCategory) — variants/addons embedded
  as subdocuments, `stock` (null = unlimited).

## Shopping & orders

- **Cart** (1:1 → User) — `storeId` enforces the "one store per cart" rule;
  items are snapshotted (name/unitPrice) at add-time.
- **Order** (N:1 → User as customer, N:1 → Store, N:1 → User as owner,
  N:1 → DeliveryBoy) — `items[]` are a full price/variant/addon snapshot
  independent of the live Food document. `orderStatus` follows a strict
  state machine (see `order.service.js` `ALLOWED_TRANSITIONS`).
- **Payment** (N:1 → Order) — provider-agnostic payment attempts; never
  stores raw card data.

## Points & referrals

- **PointTransaction** (N:1 → User) — immutable ledger row per balance
  change (`EARN`, `REDEEM`, `REFERRAL_BONUS`, `ADMIN_ADJUSTMENT`, `REFUND`,
  `EXPIRED`) with `balanceBefore`/`balanceAfter` for auditability.
- **Referral** — admin-created campaign with `code`/`customSlug`,
  `rewardPoints`, `maxUsage`, date window.
- **ReferralUsage** (N:1 → Referral, N:1 → User) — unique on
  `(referralId, referredUserId)`; tracks whether the reward has already
  been issued to prevent duplicate/self-referral abuse.

## Delivery

- Delivery assignment lives on `Order.deliveryBoyId` rather than a
  separate collection, since an order has at most one active assignment
  at a time; `DeliveryBoy.isAvailable` is toggled on assign/complete.

## Feedback

- **Review** (N:1 → Order, N:1 → Store, optionally N:1 → Food) — unique
  on `(orderId, type, foodId)`; store/food `rating`/`totalRatings` are
  recalculated via aggregation whenever a review is created/edited.
- **Report** (N:1 → Order) — customer complaint workflow with
  `status: OPEN → UNDER_REVIEW → RESOLVED/REJECTED`.

## Platform

- **PlatformSettings** — singleton document (`key: 'GLOBAL'`) holding
  platform fee rules, points earn/redeem rates, delivery fee formula, and
  tax percentage. Orders snapshot these values at creation time — changing
  settings never retroactively changes historical orders.
- **Notification** (N:1 → User) — in-app notification log, also pushed
  live via Socket.IO `notification:new`.

## Indexes

2dsphere geospatial indexes exist on `User.location`, `Store.location`,
`DeliveryBoy.currentLocation`, and `Order.deliveryLocation`. Compound/
uniqueness indexes are noted inline in each `*.model.js` file (e.g.
`Food` has a compound unique index on `(storeId, slug)`; `ReferralUsage`
is unique on `(referralId, referredUserId)`).
