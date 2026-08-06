// src/hooks/mutations/usePegawaiMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreatePegawaiPayload, SyncPegawaiPayload } from '@/types/pegawai.type';
import { toast } from 'sonner';

export function useCreatePegawai() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreatePegawaiPayload) => {
            const response = await api.post('/pegawai', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Berhasil', { description: 'Data Pegawai baru telah ditambahkan.' });
            queryClient.invalidateQueries({ queryKey: ['pegawai-list'] });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || 'Gagal menambahkan data Pegawai.';
            toast.error('Gagal Menyimpan', { description: errorMsg });
        },
    });
}

export function useSyncPegawai() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: SyncPegawaiPayload) => {
            const response = await api.post('/pegawai/sync', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Sinkronisasi Berhasil', { description: 'Data Pegawai dari BKD berhasil di-upsert.' });
            queryClient.invalidateQueries({ queryKey: ['pegawai-list'] });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || 'Gagal melakukan sinkronisasi dengan BKD.';

            // Jika terkena Rate Limiter 429 dari Redis di Backend
            if (error.response?.status === 429) {
                toast.error('Terlalu Banyak Permintaan', { description: 'Rate Limiter aktif. Harap tunggu beberapa detik.' });
            } else {
                toast.error('Sinkronisasi Gagal', { description: errorMsg });
            }
        },
    });
}

export function useDeletePegawai() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/pegawai/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Terhapus', { description: 'Data Pegawai berhasil dihapus.' });
            queryClient.invalidateQueries({ queryKey: ['pegawai-list'] });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || 'Gagal menghapus data.';
            toast.error('Gagal Menghapus', { description: errorMsg });
        },
    });
}