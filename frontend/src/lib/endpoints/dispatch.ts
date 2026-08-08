import { api } from '@/lib/api';
import { Order } from '@/types';

export const dispatchApi = {
  acceptOffer: (attemptId: string) =>
    api.patch(`/dispatch/offers/${attemptId}/accept`).then((res) => res.data.data as Order),

  rejectOffer: (attemptId: string) => api.patch(`/dispatch/offers/${attemptId}/reject`),

  retryDispatch: (orderId: string) => api.post(`/dispatch/orders/${orderId}/retry`),

  verifyPickupPin: (orderId: string, pin: string) =>
    api.post(`/dispatch/orders/${orderId}/verify-pickup`, { pin }).then((res) => res.data.data as Order),
};
