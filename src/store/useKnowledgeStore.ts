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

    fetchDocuments: () => Promise<void>;
    uploadDocument: (file: File, type: DocumentType, title: string) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    clearCurrentDoc: () => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
    docList: [],
    isProcessing: false,
    currentDoc: null,
    isLoadingDocs: false,

    // Mengambil data nyata dari PostgreSQL
    fetchDocuments: async () => {
        set({ isLoadingDocs: true });
        try {
            const response = await api.get('/documents');
            set({ docList: response.data.data, isLoadingDocs: false });
        } catch (error: any) {
            toast.error('Gagal Memuat Data', {
                description: error.response?.data?.message || 'Tidak dapat terhubung ke server database.',
            });
            set({ isLoadingDocs: false });
        }
    },

    uploadDocument: async (file: File, type: DocumentType, title: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempDoc: KnowledgeDoc = {
            id: tempId,
            title: title,
            type: type,
            status: 'Uploading',
            filePath: '',
            createdAt: new Date().toISOString(),
            progress: 0,
            metadata: {
                id: '',
                fileSize: file.size,
                mimeType: file.type,
                totalChunks: 0,
                hash: ''
            }
        };

        set({ isProcessing: true, currentDoc: tempDoc });

        try {
            // 1. Eksekusi Pengiriman Fisik ke Endpoint Backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            formData.append('title', title);

            const res = await api.post('/documents/ingest', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Backend akan mengembalikan 'hash' sebagai identitas unik file yang diantrekan
            const expectedHash = res.data.data?.hash;

            // 2. Simulasi Progress Bar Kosmetik (Tertahan di 90% jika DB belum merespons)
            let currentProgress = 0;
            const visualInterval = setInterval(() => {
                currentProgress += Math.floor(Math.random() * 15) + 5; // Naik random 5-20%
                if (currentProgress > 90) currentProgress = 90; // Limit maksimum 90%

                let status: any = 'Parsing';
                if (currentProgress >= 60) status = 'Vectorizing';

                set({ currentDoc: { ...get().currentDoc!, progress: currentProgress, status } });
            }, 1000);

            // 3. Short-Polling: Mengecek status riil dari Backend (tiap 3 detik)
            const pollInterval = setInterval(async () => {
                try {
                    const listRes = await api.get('/documents');
                    const docs = listRes.data.data;

                    // Mencari dokumen kita di database menggunakan hash biner-nya
                    const foundDoc = docs.find((d: any) => d.metadata?.hash === expectedHash);

                    // Jika AI Worker (BullMQ) sudah menanamkannya ke PostgreSQL
                    if (foundDoc && foundDoc.status === 'AKTIF') {
                        clearInterval(visualInterval);
                        clearInterval(pollInterval);

                        set({
                            isProcessing: false,
                            docList: docs, // Sinkronisasi tabel UI langsung
                            currentDoc: { ...get().currentDoc!, progress: 100, status: 'Success' }
                        });

                        toast.success('Ingesti AI Selesai', {
                            description: 'Berkas telah selesai dipotong dan disisipkan ke Vector DB (pgvector).',
                        });
                    }
                } catch (pollError) {
                    console.error('Terjadi gangguan saat memantau status RAG.', pollError);
                }
            }, 3000);

            // 4. Pengaman Timeout (Batas waktu toleransi worker AI: 2 Menit)
            setTimeout(() => {
                if (get().isProcessing) {
                    clearInterval(visualInterval);
                    clearInterval(pollInterval);
                    set({ isProcessing: false, currentDoc: { ...get().currentDoc!, status: 'Error' } });
                    toast.error('Waktu Tunggu Habis (Timeout)', {
                        description: 'Server AI membutuhkan waktu terlalu lama. Dokumen mungkin masih diproses di latar belakang.',
                    });
                }
            }, 120000);

        } catch (error: any) {
            set({ isProcessing: false, currentDoc: null });
            toast.error('Gagal Mengunggah Dokumen', {
                description: error.response?.data?.message || 'Terjadi kesalahan sistem (kemungkinan timeout API).',
            });
        }
    },

    deleteDocument: async (id: string) => {
        try {
            await api.delete(`/documents/${id}`);

            set((state) => ({
                docList: state.docList.filter((doc) => doc.id !== id),
                currentDoc: state.currentDoc?.id === id ? null : state.currentDoc
            }));

            toast.success('Dokumen Terhapus', {
                description: 'Berkas fisik dan Vektor AI berhasil dihapus secara permanen.'
            });
        } catch (error: any) {
            toast.error('Gagal Menghapus Dokumen', {
                description: error.response?.data?.message || 'Terjadi kesalahan saat menghapus data.',
            });
        }
    },

    clearCurrentDoc: () => {
        set({ currentDoc: null });
    }
}));