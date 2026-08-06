// src/hooks/queries/useGetOpd.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Opd } from '@/types/opd.type';

export function useGetOpd() {
    return useQuery({
        queryKey: ['opd-list'], // Kunci unik untuk memori cache
        queryFn: async () => {
            const response = await api.get<Opd[]>('/opd');
            return response.data; // Response otomatis terurai berkat Axios
        },
    });
}   