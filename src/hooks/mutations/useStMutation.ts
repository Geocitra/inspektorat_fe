// src/hooks/mutations/useStMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateStPayload, SignStPayload, RecommendTeamPayload, RecommendTeamResponse } from '@/types/st.type';

export function useCreateStMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateStPayload) => {
            const response = await api.post('/surat-tugas', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surat-tugas'] });
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
        },
    });
}

export function useSignStMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: SignStPayload }) => {
            const response = await api.post(`/surat-tugas/${id}/sign`, payload);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['surat-tugas'] });
            queryClient.invalidateQueries({ queryKey: ['surat-tugas', variables.id] });
        },
    });
}

export function useDeleteStMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/surat-tugas/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surat-tugas'] });
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
        },
    });
}

export function useRecommendTeamMutation() {
    return useMutation<RecommendTeamResponse, Error, RecommendTeamPayload>({
        mutationFn: async (payload: RecommendTeamPayload) => {
            const response = await api.post('/surat-tugas/recommend-team', payload);
            return response.data;
        },
    });
}

export function useGeneratePkaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, fokusPengawasan }: { id: string; fokusPengawasan?: string }) => {
            const response = await api.post(`/surat-tugas/${id}/generate-pka`, { fokusPengawasan });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['surat-tugas', variables.id] });
        },
    });
}
