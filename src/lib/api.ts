// src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/useAuthStore';

// 1. Buat Instance Axios dengan URL dari .env.local
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR: Selalu jalankan sebelum request dikirim
api.interceptors.request.use(
    (config) => {
        // Ambil token dari cookie
        const token = Cookies.get('token');
        if (token) {
            // Sisipkan ke header Authorization
            config.headers.Authorization = `Bearer ${token}`;
        }

        /* 
          [MODE PENGEMBANGAN] 
          Karena backend kita menggunakan ContextualAuthGuard dengan mock-headers
          untuk development, kita menyisipkan header dinamis dari state useAuthStore.
        */
        const user = useAuthStore.getState().user;
        if (user) {
            config.headers['x-mock-role'] = user.role === 'AUDITOR' ? 'APIP_INTERNAL' : user.role;
            config.headers['x-mock-user-id'] = user.id;
            if (user.pegawaiId) {
                config.headers['x-mock-pegawai-id'] = user.pegawaiId;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. RESPONSE INTERCEPTOR: Selalu jalankan setelah menerima respon dari Backend
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Jika backend menolak karena token tidak valid (401)
        if (error.response && error.response.status === 401) {
            Cookies.remove('token'); // Hapus token yang rusak

            // Tendang ke halaman login (hanya jika dijalankan di browser)
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);