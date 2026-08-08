import { api } from '../api';
import { Order, OrderStatus, PaginationMeta } from '@/types';

export interface CreateOrderPayload {
  deliveryAddress: string;
  deliveryCoordinates: [number, number];
  paymentMethod?: string;
  pointsToRedeem?: number;
  referralCode?: string;
  notes?: string;
}

export const ordersApi = {
  async create(payload: CreateOrderPayload) {
    const res = await api.post('/orders', payload);
    return res.data.data as Order;
  },
  async getById(id: string) {
    const res = await api.get(`/orders/${id}`);
    return res.data.data as Order;
  },
  async mine(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/orders/mine', { params });
    return { items: res.data.data as Order[], meta: res.data.meta as PaginationMeta };
  },
  async storeOrders(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/orders/store/mine', { params });
    return { items: res.data.data as Order[], meta: res.data.meta as PaginationMeta };
  },
  async allOrders(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/orders/admin/all', { params });
    return { items: res.data.data as Order[], meta: res.data.meta as PaginationMeta };
  },
  async updateStatus(id: string, status: OrderStatus) {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data.data as Order;
  },
  async cancel(id: string, reason: string) {
    const res = await api.patch(`/orders/${id}/cancel`, { reason });
    return res.data.data as Order;
  },
  async verifyDelivery(id: string, otp: string) {
    const res = await api.patch(`/orders/${id}/verify-delivery`, { otp });
    return res.data.data as Order;
  },
};
