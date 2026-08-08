import { api } from '@/lib/api';
import {
  CodRemittance,
  PaginationMeta,
  PayoutMethod,
  PayoutRequest,
  RemittanceMethod,
  Wallet,
  WalletTransaction,
} from '@/types';

export const walletApi = {
  // --- Shop owner / delivery boy ---
  getMine: () => api.get('/wallet/me').then((res) => res.data.data as Wallet),

  getMyTransactions: (query: { page?: number; limit?: number } = {}) =>
    api
      .get('/wallet/me/transactions', { params: query })
      .then((res) => ({ items: res.data.data as WalletTransaction[], meta: res.data.meta as PaginationMeta })),

  requestPayout: (payload: {
    amount: number;
    method: PayoutMethod;
    accountDetails: { accountName: string; accountNumber: string; bankName?: string };
  }) => api.post('/wallet/me/payouts', payload).then((res) => res.data.data as PayoutRequest),

  getMyPayouts: (query: { page?: number; limit?: number; status?: string } = {}) =>
    api
      .get('/wallet/me/payouts', { params: query })
      .then((res) => ({ items: res.data.data as PayoutRequest[], meta: res.data.meta as PaginationMeta })),

  // --- Delivery boy only ---
  submitCodRemittance: (payload: { amount: number; method: RemittanceMethod; reference?: string }) =>
    api.post('/wallet/me/cod-remittances', payload).then((res) => res.data.data as CodRemittance),

  getMyRemittances: (query: { page?: number; limit?: number; status?: string } = {}) =>
    api
      .get('/wallet/me/cod-remittances', { params: query })
      .then((res) => ({ items: res.data.data as CodRemittance[], meta: res.data.meta as PaginationMeta })),

  // --- Admin ---
  adminListPayouts: (query: { page?: number; limit?: number; status?: string; ownerType?: string } = {}) =>
    api
      .get('/wallet/admin/payouts', { params: query })
      .then((res) => ({ items: res.data.data as PayoutRequest[], meta: res.data.meta as PaginationMeta })),

  adminProcessPayout: (id: string, action: 'PAID' | 'REJECTED', adminNote?: string) =>
    api.patch(`/wallet/admin/payouts/${id}`, { action, adminNote }).then((res) => res.data.data as PayoutRequest),

  adminListRemittances: (query: { page?: number; limit?: number; status?: string } = {}) =>
    api
      .get('/wallet/admin/cod-remittances', { params: query })
      .then((res) => ({ items: res.data.data as CodRemittance[], meta: res.data.meta as PaginationMeta })),

  adminConfirmRemittance: (id: string) =>
    api.patch(`/wallet/admin/cod-remittances/${id}/confirm`).then((res) => res.data.data as CodRemittance),

  adminRejectRemittance: (id: string, note?: string) =>
    api
      .patch(`/wallet/admin/cod-remittances/${id}/reject`, { note })
      .then((res) => res.data.data as CodRemittance),
};
