// src/hooks/queries/useGetPegawai.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Pegawai } from '@/types/pegawai.type';

export function useGetPegawai() {
    return useQuery({
        queryKey: ['pegawai-list'],
        queryFn: async () => {
            const response = await api.get<Pegawai[]>('/pegawai');
            return response.data;
        },
    });
}