# Socket.IO Event Documentation

## Connecting & authentication

Clients connect with a JWT access token:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: accessToken },
});
```

The server rejects the connection (`connect_error`) if the token is missing,
invalid, expired, or belongs to a deactivated account. On success the socket
is automatically joined to:

- `user:{userId}` — personal room, used for direct notifications.
- `delivery:{userId}` — only for `DELIVERY_BOY` accounts.
- `store-owner:{userId}` — only for `SHOP_OWNER`/`SUPER_ADMIN` accounts.

## Room joining / leaving

| Event (client → server) | Payload | Description |
|---|---|---|
| `order:track` | `{ orderId }` | Join `order:{orderId}` to receive live updates for that order. Only call this for an order the user is actually authorized to view — the server does not currently re-verify ownership on join, so clients must only request rooms for orders returned by their own authenticated REST calls. |
| `order:untrack` | `{ orderId }` | Leave the order room (e.g. after delivery completes). |

Rooms are also cleaned up automatically on disconnect.

## Delivery boy → server

| Event | Payload | Description |
|---|---|---|
| `delivery:location:update` | `{ orderId, latitude, longitude }` | Sent periodically while an order is out for delivery. Server re-broadcasts to `order:{orderId}` as `delivery:location`. Only accepted from sockets authenticated as `DELIVERY_BOY`. |
| `delivery:status:update` | `{ orderId, status }` | Lightweight status push (e.g. picked up). Re-broadcast as `order:status`. For state-machine-enforced transitions, use the REST `PATCH /orders/:id/status` endpoint instead — this socket event is for fast UI pings only. |

## Server → customer / order room

| Event | Payload | Description |
|---|---|---|
| `delivery:location` | `{ orderId, deliveryBoyId, latitude, longitude }` | Live GPS ping for the map view. |
| `order:status` | `{ orderId, status }` | Order status changed. |
| `order:new` | Order object | New order placed (sent to the store's room). |
| `delivery:assigned` | `{ orderId }` | A delivery boy was assigned/accepted this order. |
| `notification:new` | Notification object | A new in-app notification for this user. |

## Location privacy

Live GPS coordinates are only ever broadcast into the `order:{orderId}`
room. A client only ends up in that room if it explicitly calls
`order:track` — in practice this should be gated by your frontend to only
happen for the customer who placed the order, the assigned delivery boy,
and authorized store/admin staff, matching the REST authorization already
enforced on `GET /orders/:id`. Location broadcasting stops naturally once
clients call `order:untrack` after the order reaches `DELIVERED` or
`CANCELLED`.

## Reconnection & disconnect handling

`socket.io-client` reconnects automatically with the same auth token. On
reconnect, clients should re-emit `order:track` for any orders they still
want to follow, since room membership is not persisted across reconnects.
On `disconnect`, the server performs no special cleanup beyond socket.io's
automatic room teardown — no order state is mutated by a delivery boy
disconnecting (their `isOnline` flag must be explicitly set to `false` via
`PATCH /delivery/me/status`).
