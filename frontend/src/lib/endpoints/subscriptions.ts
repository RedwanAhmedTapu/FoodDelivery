import { api } from '@/lib/api';
import { BillingCycle, StoreOwnerStatus, StoreSubscription, SubscriptionPlan } from '@/types';

export const subscriptionsApi = {
  // Admin — global pricing
  listGlobalPlans: () => api.get('/subscriptions/plans/global').then((res) => res.data.data as SubscriptionPlan[]),

  upsertGlobalPlan: (billingCycle: BillingCycle, price: number, label?: string) =>
    api
      .post('/subscriptions/plans/global', { billingCycle, price, label })
      .then((res) => res.data.data as SubscriptionPlan),

  // Admin — per-store overrides
  listStoreOverrides: (storeId: string) =>
    api.get(`/subscriptions/plans/store/${storeId}/overrides`).then((res) => res.data.data as SubscriptionPlan[]),

  upsertStoreOverride: (storeId: string, billingCycle: BillingCycle, price: number, label?: string) =>
    api
      .post(`/subscriptions/plans/store/${storeId}/overrides`, { billingCycle, price, label })
      .then((res) => res.data.data as SubscriptionPlan),

  removeStoreOverride: (storeId: string, billingCycle: BillingCycle) =>
    api.delete(`/subscriptions/plans/store/${storeId}/overrides/${billingCycle}`),

  // Shop owner
  getEffectivePlans: (storeId: string) =>
    api.get(`/subscriptions/store/${storeId}/plans`).then((res) => res.data.data as SubscriptionPlan[]),

  subscribe: (storeId: string, billingCycle: BillingCycle, provider: string = 'SSLCOMMERZ') =>
    api
      .post(`/subscriptions/store/${storeId}/subscribe`, { billingCycle, provider })
      .then((res) => res.data.data as { subscription: StoreSubscription; gatewayPageURL: string | null }),

  getCurrent: (storeId: string) =>
    api.get(`/subscriptions/store/${storeId}/current`).then((res) => res.data.data as StoreSubscription | null),

  getHistory: (storeId: string) =>
    api.get(`/subscriptions/store/${storeId}/history`).then((res) => res.data.data as StoreSubscription[]),

  getStatus: (storeId: string) =>
    api.get(`/subscriptions/store/${storeId}/status`).then((res) => res.data.data as StoreOwnerStatus),
};
