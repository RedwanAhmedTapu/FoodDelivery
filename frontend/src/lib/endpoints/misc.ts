import { api } from '../api';
import {
  DeliveryBoyProfile,
  Food,
  FoodCategory,
  Notification,
  Order,
  PaginationMeta,
  PointTransaction,
  Review,
  ShopOwnerProfile,
  Store,
} from '@/types';

export const pointsApi = {
  async myBalance() {
    const res = await api.get('/points/me/balance');
    return res.data.data.balance as number;
  },
  async myHistory(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/points/me/history', { params });
    return { items: res.data.data as PointTransaction[], meta: res.data.meta as PaginationMeta };
  },
};

export const referralsApi = {
  async resolve(code: string) {
    const res = await api.get(`/referrals/resolve/${code}`);
    return res.data.data as { code: string; customSlug?: string; campaignName: string };
  },
};

export const recommendationsApi = {
  async foods(limit = 10) {
    const res = await api.get('/recommendations/foods', { params: { limit } });
    return res.data.data as Food[];
  },
  async categories(limit = 6) {
    const res = await api.get('/recommendations/categories', { params: { limit } });
    return res.data.data as FoodCategory[];
  },
  async stores(limit = 6) {
    const res = await api.get('/recommendations/stores', { params: { limit } });
    return res.data.data as Store[];
  },
};

export const reviewsApi = {
  async byStore(storeId: string, params: Record<string, string | number | undefined> = {}) {
    const res = await api.get(`/reviews/store/${storeId}`, { params });
    return { items: res.data.data as Review[], meta: res.data.meta as PaginationMeta };
  },
  async byFood(foodId: string, params: Record<string, string | number | undefined> = {}) {
    const res = await api.get(`/reviews/food/${foodId}`, { params });
    return { items: res.data.data as Review[], meta: res.data.meta as PaginationMeta };
  },
  async create(payload: {
    orderId: string;
    type: 'STORE' | 'FOOD' | 'DELIVERY';
    foodId?: string;
    rating: number;
    comment?: string;
  }) {
    const res = await api.post('/reviews', payload);
    return res.data.data as Review;
  },
};

export const notificationsApi = {
  async list(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/notifications', { params });
    return { items: res.data.data as Notification[], meta: res.data.meta as PaginationMeta };
  },
  async markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await api.patch('/notifications/read-all');
  },
};

export const platformSettingsApi = {
  async get() {
    const res = await api.get('/platform-settings');
    return res.data.data;
  },
  async update(payload: Record<string, unknown>) {
    const res = await api.patch('/platform-settings', payload);
    return res.data.data;
  },
};

export const deliveryApi = {
  async myProfile() {
    const res = await api.get('/delivery/me');
    return res.data.data as DeliveryBoyProfile;
  },
  async updateProfile(payload: Partial<DeliveryBoyProfile>) {
    const res = await api.patch('/delivery/me', payload);
    return res.data.data as DeliveryBoyProfile;
  },
  async uploadProfileImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    const res = await api.patch('/delivery/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as DeliveryBoyProfile;
  },
  async setOnline(isOnline: boolean) {
    const res = await api.patch('/delivery/me/status', { isOnline });
    return res.data.data as DeliveryBoyProfile;
  },
  async pushLocation(coordinates: [number, number]) {
    const res = await api.post('/delivery/location', { coordinates });
    return res.data.data as DeliveryBoyProfile;
  },
  async myOrders(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/delivery/orders', { params });
    return { items: res.data.data as Order[], meta: res.data.meta as PaginationMeta };
  },
  async accept(orderId: string) {
    const res = await api.patch(`/delivery/orders/${orderId}/accept`);
    return res.data.data as Order;
  },
  async complete(orderId: string) {
    const res = await api.patch(`/delivery/orders/${orderId}/complete`);
    return res.data.data as Order;
  },
  // Admin
  async listAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/delivery', { params });
    return { items: res.data.data as DeliveryBoyProfile[], meta: res.data.meta as PaginationMeta };
  },
  async setApproval(id: string, status: 'APPROVED' | 'SUSPENDED' | 'PENDING') {
    const res = await api.patch(`/delivery/${id}/approval`, { status });
    return res.data.data as DeliveryBoyProfile;
  },
  async assign(orderId: string, deliveryBoyId: string) {
    const res = await api.post(`/delivery/orders/${orderId}/assign`, { deliveryBoyId });
    return res.data.data as Order;
  },
  async assignAuto(orderId: string) {
    const res = await api.post(`/delivery/orders/${orderId}/assign-auto`);
    return res.data.data as Order;
  },
};

export const shopOwnerApi = {
  async myProfile() {
    const res = await api.get('/shop-owners/me');
    return res.data.data as ShopOwnerProfile;
  },
  async updateProfile(payload: Partial<ShopOwnerProfile>) {
    const res = await api.patch('/shop-owners/me', payload);
    return res.data.data as ShopOwnerProfile;
  },
  async uploadProfileImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    const res = await api.patch('/shop-owners/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as ShopOwnerProfile;
  },
  async uploadDocument(type: string, file: File) {
    const form = new FormData();
    form.append('type', type);
    form.append('document', file);
    const res = await api.post('/shop-owners/me/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as ShopOwnerProfile;
  },
};

export const adminApi = {
  async dashboard() {
    const res = await api.get('/admin/analytics');
    return res.data.data;
  },
  async ordersTrend(range: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const res = await api.get('/admin/analytics/orders-trend', { params: { range } });
    return res.data.data as { _id: string; totalOrders: number; revenue: number }[];
  },
  async topStores() {
    const res = await api.get('/admin/analytics/top-stores');
    return res.data.data as Store[];
  },
  async topFoods() {
    const res = await api.get('/admin/analytics/top-foods');
    return res.data.data as Food[];
  },
  async shopOwnerDashboard() {
    const res = await api.get('/admin/dashboard/shop-owner');
    return res.data.data;
  },
  async listShopOwners(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/shop-owners', { params });
    return { items: res.data.data as ShopOwnerProfile[], meta: res.data.meta as PaginationMeta };
  },
  async setShopOwnerApproval(id: string, approvalStatus: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const res = await api.patch(`/shop-owners/${id}/approval`, { approvalStatus, rejectionReason });
    return res.data.data as ShopOwnerProfile;
  },
};
