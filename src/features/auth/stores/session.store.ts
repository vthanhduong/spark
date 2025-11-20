import { create } from 'zustand';

import { ApiError, apiFetch, apiJson } from '../../../lib/api';

export type UserRole = 'guest' | 'member' | 'quest_expert' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: SessionUser | null;
  status: SessionStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  setUser: (user) => {
    set({ user, status: user ? 'authenticated' : 'unauthenticated', error: null });
  },

  login: async (email: string, password: string) => {
    set({ status: 'loading', error: null });
    try {
      const response = await apiJson<SessionUser>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      set({ user: response, status: 'authenticated', error: null });
    } catch (error) {
      if (error instanceof ApiError) {
        set({ status: 'unauthenticated', error: typeof error.data === 'string' ? error.data : 'Đăng nhập thất bại' });
      } else {
        set({ status: 'unauthenticated', error: 'Không thể đăng nhập. Vui lòng thử lại.' });
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null, status: 'unauthenticated', error: null });
    }
  },

  fetchSession: async () => {
    set((state) => ({ status: state.status === 'idle' ? 'loading' : state.status, error: null }));
    try {
      const response = await apiJson<SessionUser>('/api/auth/me');
      set({ user: response, status: 'authenticated', error: null });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        set({ user: null, status: 'unauthenticated', error: null });
      } else {
        set({ user: null, status: 'unauthenticated', error: 'Không thể xác thực phiên làm việc.' });
      }
    }
  },
}));
