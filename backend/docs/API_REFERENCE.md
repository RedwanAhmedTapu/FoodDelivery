# API Endpoint Reference

Base URL: `/api/v1`. All responses follow:

```json
{ "success": true, "statusCode": 200, "message": "...", "data": {} }
{ "success": false, "statusCode": 400, "message": "...", "errors": [] }
```

List endpoints accept `?page=1&limit=20` and return a `meta: { page, limit, total, totalPages }` block.

## Auth (`/auth`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /auth/register/customer | Public | Register customer |
| POST | /auth/register/shop-owner | Public | Register shop owner |
| POST | /auth/register/delivery-boy | Public | Register delivery boy |
| POST | /auth/login | Public | Login (email or phone) |
| POST | /auth/refresh-token | Public | Rotate access/refresh tokens |
| POST | /auth/logout | Authenticated | Revoke refresh token |
| POST | /auth/forgot-password | Public | Request password reset token |
| POST | /auth/reset-password | Public | Reset password with token |
| POST | /auth/change-password | Authenticated | Change password |

## Users (`/users`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /users/me | Authenticated | Get my profile |
| PATCH | /users/me | Authenticated | Update my profile |
| PATCH | /users/me/avatar | Authenticated | Upload avatar |
| GET | /users | Admin | List all users |
| GET | /users/:id | Admin | Get user by id |
| PATCH | /users/:id/status | Admin | Activate/deactivate user |

## Shop Owners (`/shop-owners`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /shop-owners/me | Shop Owner | Get my business profile |
| PATCH | /shop-owners/me | Shop Owner | Update business profile |
| GET | /shop-owners | Admin | List shop owners |
| PATCH | /shop-owners/:id/approval | Admin | Approve/reject shop owner |
| PATCH | /shop-owners/:id/status | Admin | Suspend/activate shop owner |

## Stores (`/stores`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /stores | Public | List active/approved stores |
| GET | /stores/nearby | Public | Geospatial nearby stores search |
| GET | /stores/slug/:slug | Public | Get store by slug |
| GET | /stores/:id | Public | Get store by id |
| POST | /stores | Shop Owner | Create store |
| GET | /stores/owner/mine | Shop Owner | List my stores |
| PATCH | /stores/:id | Shop Owner/Admin | Update store |
| DELETE | /stores/:id | Shop Owner/Admin | Delete store |
| PATCH | /stores/:id/activate | Shop Owner/Admin | Activate store |
| PATCH | /stores/:id/deactivate | Shop Owner/Admin | Deactivate store |
| PATCH | /stores/:id/logo | Shop Owner/Admin | Upload store logo |
| PATCH | /stores/:id/cover | Shop Owner/Admin | Upload store cover image |
| PATCH | /stores/:id/approval | Admin | Approve/reject store |
| GET | /stores/admin/all | Admin | List every store regardless of approval/active status |

## Store Customization (`/store-customization`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /store-customization/:storeId | Public | Get store theme/customization |
| PATCH | /store-customization/:storeId | Shop Owner/Admin | Update theme, sections, layout |
| PATCH | /store-customization/:storeId/banner | Shop Owner/Admin | Upload banner |

## Categories (`/categories`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /categories | Public | List categories (paginated) |
| GET | /categories/active | Public | All active categories (unpaginated) |
| POST | /categories | Admin | Create category |
| PATCH | /categories/reorder | Admin | Reorder categories |
| PATCH | /categories/:id | Admin | Update category |
| DELETE | /categories/:id | Admin | Delete category |
| PATCH | /categories/:id/status | Admin | Activate/deactivate category |
| PATCH | /categories/:id/image | Admin | Upload category image |

## Foods (`/foods`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /foods | Public | Search/filter/sort foods |
| GET | /foods/store/:storeId | Public | List foods for a store |
| GET | /foods/:id | Public | Food details |
| POST | /foods | Shop Owner | Add food |
| PATCH | /foods/:id | Shop Owner/Admin | Update food |
| DELETE | /foods/:id | Shop Owner/Admin | Delete food |
| PATCH | /foods/:id/status | Shop Owner/Admin | Activate/deactivate food |
| PATCH | /foods/:id/images | Shop Owner/Admin | Upload food images |

## Bulk Upload (`/foods/bulk-upload`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /foods/bulk-upload | Shop Owner | Bulk-create foods from CSV/Excel |

## Cart (`/cart`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /cart | Customer | Get my cart with totals |
| POST | /cart/items | Customer | Add item (returns conflict if cart has another store's items) |
| PATCH | /cart/items/:itemId | Customer | Update item quantity |
| DELETE | /cart/items/:itemId | Customer | Remove item |
| DELETE | /cart | Customer | Clear cart |

## Orders (`/orders`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /orders | Customer | Create order (server-calculated pricing) |
| GET | /orders/mine | Customer | My order history |
| GET | /orders/store/mine | Shop Owner | Orders for my stores |
| GET | /orders/admin/all | Admin | All orders |
| GET | /orders/:id | Owner/Customer/Admin | Order details |
| PATCH | /orders/:id/status | Shop Owner/Admin/Delivery Boy | Update order status |
| PATCH | /orders/:id/cancel | Customer/Shop Owner/Admin | Cancel order |

## Payments (`/payments`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /payments | Customer | Initiate payment for an order |
| POST | /payments/:id/verify | Customer/Admin | Verify payment status |
| POST | /payments/:id/refund | Admin/Shop Owner | Refund a payment |
| GET | /payments/order/:orderId | Authenticated | List payments for an order |

## Points (`/points`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /points/me/balance | Customer | My points balance |
| GET | /points/me/history | Customer | My points ledger |
| POST | /points/admin/adjust | Admin | Manually adjust a user's points |

## Referrals (`/referrals`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /referrals/resolve/:code | Public | Resolve a referral code/slug |
| POST | /referrals | Admin | Create referral campaign |
| GET | /referrals | Admin | List campaigns |
| PATCH | /referrals/:id | Admin | Update campaign |

## Recommendations (`/recommendations`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /recommendations/foods | Customer | Personalized food recommendations |
| GET | /recommendations/categories | Customer | Personalized category recommendations |
| GET | /recommendations/stores | Customer | Personalized store recommendations |

## Delivery (`/delivery`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /delivery/me | Delivery Boy | My profile |
| PATCH | /delivery/me | Delivery Boy | Update profile |
| PATCH | /delivery/me/status | Delivery Boy | Go online/offline |
| POST | /delivery/location | Delivery Boy | Update current GPS location (REST fallback) |
| GET | /delivery/orders | Delivery Boy | My assigned deliveries |
| PATCH | /delivery/orders/:orderId/accept | Delivery Boy | Accept assigned delivery |
| PATCH | /delivery/orders/:orderId/complete | Delivery Boy | Mark delivery complete |
| GET | /delivery | Admin | List delivery boys |
| PATCH | /delivery/:id/approval | Admin | Approve/suspend delivery boy |
| POST | /delivery/orders/:orderId/assign | Admin/Shop Owner | Manually assign delivery boy |
| POST | /delivery/orders/:orderId/assign-auto | Admin/Shop Owner | Auto-assign nearest delivery boy |

## Reports (`/reports`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /reports | Customer | Report an order (with images) |
| GET | /reports/mine | Customer | My reports |
| GET | /reports/admin/all | Admin | All reports |
| PATCH | /reports/:id/status | Admin | Update report status/response |

## Reviews (`/reviews`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /reviews/store/:storeId | Public | Store reviews |
| GET | /reviews/food/:foodId | Public | Food reviews |
| POST | /reviews | Customer | Submit review (purchase-verified) |
| PATCH | /reviews/:id | Customer | Edit my review |

## Notifications (`/notifications`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /notifications | Authenticated | My notifications |
| PATCH | /notifications/:id/read | Authenticated | Mark one as read |
| PATCH | /notifications/read-all | Authenticated | Mark all as read |

## Platform Settings (`/platform-settings`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /platform-settings | Public | Current fee/points/delivery config |
| PATCH | /platform-settings | Admin | Update platform configuration |

## Admin Analytics (`/admin`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | /admin/analytics | Admin | Platform dashboard summary |
| GET | /admin/analytics/orders-trend | Admin | Daily/weekly/monthly order trend |
| GET | /admin/analytics/top-stores | Admin | Top stores by orders |
| GET | /admin/analytics/top-foods | Admin | Top foods by orders |
| GET | /admin/analytics/top-categories | Admin | Top categories by order volume |
| GET | /admin/analytics/top-customers | Admin | Top customers by order count |
| GET | /admin/dashboard/shop-owner | Shop Owner | My stores' dashboard |

## Auth & role documentation

Every protected route requires `Authorization: Bearer <accessToken>`.
Roles are enforced with `requireRole(...)`; ownership (e.g. "this store
belongs to this shop owner") is additionally enforced in the service layer
and never trusts IDs supplied in the request body.
