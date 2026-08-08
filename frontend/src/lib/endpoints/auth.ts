import { api, setTokens, clearTokens } from '../api';
import { User } from '@/types';

export interface AuthPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

async function afterAuth(data: { user: User; accessToken: string; refreshToken: string }) {
  setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export const authApi = {
  async registerCustomer(payload: AuthPayload) {
    const res = await api.post('/auth/register/customer', payload);
    return afterAuth(res.data.data);
  },
  async registerShopOwner(payload: AuthPayload) {
    const res = await api.post('/auth/register/shop-owner', payload);
    return afterAuth(res.data.data);
  },
  async registerDeliveryBoy(payload: AuthPayload) {
    const res = await api.post('/auth/register/delivery-boy', payload);
    return afterAuth(res.data.data);
  },
  async login(identifier: string, password: string) {
    const res = await api.post('/auth/login', { identifier, password });
    return afterAuth(res.data.data);
  },
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },
  async me() {
    const res = await api.get('/users/me');
    return res.data.data as User;
  },
  async forgotPassword(identifier: string) {
    const res = await api.post('/auth/forgot-password', { identifier });
    return res.data.data as { resetToken?: string };
  },
  async resetPassword(token: string, newPassword: string) {
    await api.post('/auth/reset-password', { token, newPassword });
  },
  async changePassword(currentPassword: string, newPassword: string) {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
  async updateProfile(payload: Partial<User>) {
    const res = await api.patch('/users/me', payload);
    return res.data.data as User;
  },
};
