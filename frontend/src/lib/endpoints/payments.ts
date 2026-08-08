import { api } from '@/lib/api';
import { Payment } from '@/types';

export const paymentsApi = {
  create: (payload: { orderId: string; provider: string }) =>
    api.post('/payments', payload).then((res) => res.data.data as Payment),

  verify: (id: string) =>
    api.post(`/payments/${id}/verify`).then((res) => res.data.data as Payment),

  refund: (id: string) =>
    api.post(`/payments/${id}/refund`).then((res) => res.data.data as Payment),

  getForOrder: (orderId: string) =>
    api.get(`/payments/order/${orderId}`).then((res) => res.data.data as Payment[]),
};