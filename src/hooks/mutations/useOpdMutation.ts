// src/hooks/mutations/useOpdMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateOpdPayload } from '@/types/opd.type';
import { toast } from 'sonner';

export function useCreateOpd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateOpdPayload) => {
            const response = await api.post('/opd', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Berhasil', { description: 'Data OPD baru telah ditambahkan ke sistem.' });
            // Ini keajaibannya: Merefresh tabel otomatis tanpa reload browser!
            queryClient.invalidateQueries({ queryKey: ['opd-list'] });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || 'Gagal menambahkan data OPD.';
            toast.error('Gagal Menyimpan', { description: errorMsg });
        },
    });
}

// Opsional: Untuk tombol hapus di tabel
export function useDeleteOpd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/opd/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Terhapus', { description: 'Data OPD berhasil dihapus.' });
            queryClient.invalidateQueries({ queryKey: ['opd-list'] });
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.message || 'Gagal menghapus data.';
            toast.error('Gagal Menghapus', { description: errorMsg });
        },
    });
}