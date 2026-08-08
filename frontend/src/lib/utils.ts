import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = 'BDT') {
  return `${currency === 'BDT' ? '৳' : currency} ${amount.toFixed(2)}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  ASSIGNED_TO_DELIVERY: 'Courier assigned',
  PICKED_UP: 'Picked up',
  ON_THE_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export const ORDER_STATUS_FLOW = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED_TO_DELIVERY',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

/**
 * Great-circle distance between two [lat, lng] points, in meters.
 * Used to tell a delivery rider whether they've effectively "arrived"
 * at the delivery address (map GPS pings rarely land on the exact
 * coordinate, so we treat anything under a small threshold as arrived).
 */
export function haversineDistanceMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getCurrentPosition(): Promise<{ coords: [number, number] }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ coords: [pos.coords.longitude, pos.coords.latitude] }),
      (err) => reject(err)
    );
  });
}
