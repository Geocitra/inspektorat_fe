// src/store/useKnowledgeStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { KnowledgeDoc, DocumentType } from '@/types/knowledge.type';

interface KnowledgeState {
    docList: KnowledgeDoc[];
    isProcessing: boolean;
    currentDoc: KnowledgeDoc | null;
    isLoadingDocs: boolean;

    fetchDocuments: (opdId?: string) => Promise<void>;
    uploadDocument: (file: File, type: DocumentType, title: string, opdId?: string) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    clearCurrentDoc: () => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
    docList: [],
    isProcessing: false,
    currentDoc: null,
    isLoadingDocs: false,

    // Mengambil data nyata dari PostgreSQL (opsional filter per OPD)
    fetchDocuments: async (opdId?: string) => {
        set({ isLoadingDocs: true });
        try {
            const params = opdId ? `?opdId=${opdId}` : '';
            const response = await api.get(`/documents${params}`);
            set({ docList: response.data.data, isLoadingDocs: false });
        } catch (error: any) {
            toast.error('Gagal Memuat Data', {
                description: error.response?.data?.message || 'Tidak dapat terhubung ke server database.',
            });
            set({ isLoadingDocs: false });
        }
    },

    uploadDocument: async (file: File, type: DocumentType, title: string, opdId?: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempDoc: KnowledgeDoc = {
            id: tempId,
            title: title,
            type: type,
            status: 'Uploading',
            filePath: '',
            createdAt: new Date().toISOString(),
            progress: 10,
        };

        set({ isProcessing: true, currentDoc: tempDoc });

        try {
            // 1. Mengirim berkas multipart/form-data ke backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            formData.append('title', title);
            if (opdId) formData.append('opdId', opdId);

            const res = await api.post('/documents/ingest', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Ambil jobId dari respon antrean backend
            const jobId = res.data.data?.jobId;

            toast.info('Berkas Berhasil Diterima Server', {
                description: 'AI Worker sedang memproses ekstraksi teks & vektor di latar belakang. Anda dapat melanjutkan aktivitas lain.',
            });

            // 2. Progress bar kosmetik awal
            let currentProgress = 20;
            const visualInterval = setInterval(() => {
                currentProgress += Math.floor(Math.random() * 10) + 5;
                if (currentProgress > 85) currentProgress = 85;

                let status: any = 'Parsing';
                if (currentProgress >= 50) status = 'Vectorizing';

                if (get().currentDoc) {
                    set({ currentDoc: { ...get().currentDoc!, progress: currentProgress, status } });
                }
            }, 1200);

            // 3. Short-Polling di Latar Belakang: Mengecek status riil pekerjaan via BullMQ
            let consecutiveFailures = 0;
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/documents/job/${jobId}`);
                    const jobStatus = statusRes.data?.data;

                    if (!jobStatus || jobStatus.state === 'completed') {
                        clearInterval(visualInterval);
                        clearInterval(pollInterval);

                        await get().fetchDocuments(); // Refresh list dokumen

                        set({
                            isProcessing: false,
                            currentDoc: { ...get().currentDoc!, progress: 100, status: 'Success' }
                        });

                        toast.success('Ingesti AI Selesai', {
                            description: `Dokumen "${title}" telah berhasil di-vektorisasi ke pgvector.`,
                        });
                    } else if (jobStatus.state === 'failed') {
                        clearInterval(visualInterval);
                        clearInterval(pollInterval);

                        set({
                            isProcessing: false,
                            currentDoc: { ...get().currentDoc!, progress: 0, status: 'Error' }
                        });

                        toast.error('Gagal Ingesti AI', {
                            description: jobStatus.failedReason || 'Dokumen gagal diproses.',
                        });
                        
                        await get().fetchDocuments();
                    }
                } catch (pollError: any) {
                    consecutiveFailures++;
                    // Jika endpoint 404 (job sudah selesai & bersih dari queue), anggap sukses & refresh
                    if (consecutiveFailures >= 4) {
                        clearInterval(visualInterval);
                        clearInterval(pollInterval);
                        await get().fetchDocuments();
                        set({
                            isProcessing: false,
                            currentDoc: { ...get().currentDoc!, progress: 100, status: 'Success' }
                        });
                    }
                }
            }, 2500);

        } catch (error: any) {
            set({ isProcessing: false, currentDoc: null });
            toast.error('Gagal Mengunggah Dokumen', {
                description: error.response?.data?.message || 'Terjadi kesalahan jaringan.',
            });
        }
    },

    deleteDocument: async (id: string) => {
        try {
            await api.delete(`/documents/${id}`);
            set((state) => ({
                docList: state.docList.filter((doc) => doc.id !== id),
            }));
            toast.success('Dokumen Dihapus', {
                description: 'Data regulasi dan seluruh vektornya berhasil dihapus permanen.',
            });
        } catch (error: any) {
            toast.error('Gagal Menghapus Dokumen', {
                description: error.response?.data?.message || 'Terjadi kesalahan sistem.',
            });
        }
    },

    clearCurrentDoc: () => set({ currentDoc: null }),
}));