// src/store/useAuthStore.ts
import { create } from 'zustand';
import Cookies from 'js-cookie';
import { User } from '@/types/auth.type';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null, // Data user akan diisi saat login berhasil
    token: Cookies.get('token') || null, // Ambil dari cookie jika ada
    isAuthenticated: !!Cookies.get('token'),

    setAuth: (user: User, token: string) => {
        // Simpan token ke cookie (kedaluwarsa dalam 1 hari)
        Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'strict' });
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        // Hapus token saat logout
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false });

        // Redirect ke login paksa jika di sisi klien
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },
}));