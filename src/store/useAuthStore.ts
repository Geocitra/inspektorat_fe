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

// Helper untuk mengambil data user dari cookies saat inisialisasi
const getStoredUser = (): User | null => {
    const stored = Cookies.get('user');
    if (!stored) return null;
    try {
        return JSON.parse(stored) as User;
    } catch (e) {
        console.error('Gagal mem-parsing data user dari cookies:', e);
        return null;
    }
};

export const useAuthStore = create<AuthState>((set) => ({
    user: getStoredUser(),
    token: Cookies.get('token') || null, // Ambil dari cookie jika ada
    isAuthenticated: !!Cookies.get('token'),

    setAuth: (user: User, token: string) => {
        // Simpan token & data user ke cookie (kedaluwarsa dalam 1 hari)
        Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'strict' });
        Cookies.set('user', JSON.stringify(user), { expires: 1, secure: true, sameSite: 'strict' });
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        // Hapus token & user data saat logout
        Cookies.remove('token');
        Cookies.remove('user');
        set({ user: null, token: null, isAuthenticated: false });

        // Redirect ke login paksa jika di sisi klien
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },
}));