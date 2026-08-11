// src/store/useKnowledgeStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';

export type IngestionStatus = 'Uploading' | 'Parsing' | 'Semantic Chunking' | 'Vectorizing' | 'Success' | 'Error';

export interface KnowledgeDoc {
    id: string;
    fileName: string;
    fileSize: string;
    category: 'SOP Audit' | 'Peraturan Daerah' | 'SSH';
    uploadDate: string;
    status: IngestionStatus;
    progress: number;
}

interface KnowledgeState {
    docList: KnowledgeDoc[];
    isProcessing: boolean;
    currentDoc: KnowledgeDoc | null;
    uploadDocument: (file: { name: string; size: number }, category: 'SOP Audit' | 'Peraturan Daerah' | 'SSH') => void;
    deleteDocument: (id: string) => void;
    clearCurrentDoc: () => void;
}

const INITIAL_DOCS: KnowledgeDoc[] = [
    {
        id: 'doc-1',
        fileName: 'SOP_Audit_Kinerja_Inspektorat_2025.pdf',
        fileSize: '1.2 MB',
        category: 'SOP Audit',
        uploadDate: new Date('2026-03-01T10:00:00Z').toLocaleString('id-ID'),
        status: 'Success',
        progress: 100
    },
    {
        id: 'doc-2',
        fileName: 'Perda_No_4_Tahun_2024_APBD_Surabaya.pdf',
        fileSize: '4.5 MB',
        category: 'Peraturan Daerah',
        uploadDate: new Date('2026-03-05T14:30:00Z').toLocaleString('id-ID'),
        status: 'Success',
        progress: 100
    },
    {
        id: 'doc-3',
        fileName: 'Standar_Satuan_Harga_SSH_Barang_2026.docx',
        fileSize: '820 KB',
        category: 'SSH',
        uploadDate: new Date('2026-03-10T11:15:00Z').toLocaleString('id-ID'),
        status: 'Success',
        progress: 100
    }
];

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
    docList: INITIAL_DOCS,
    isProcessing: false,
    currentDoc: null,

    uploadDocument: (file, category) => {
        // Konversi ukuran byte ke MB/KB
        const sizeStr = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${(file.size / 1024).toFixed(0)} KB`;

        const newId = `doc-${Date.now()}`;
        const newDoc: KnowledgeDoc = {
            id: newId,
            fileName: file.name,
            fileSize: sizeStr,
            category: category,
            uploadDate: new Date().toLocaleString('id-ID'),
            status: 'Uploading',
            progress: 0
        };

        set({ 
            isProcessing: true,
            currentDoc: newDoc,
            // Belum masuk ke list utama sebelum selesai (atau masuk list utama tapi status processing)
            docList: [newDoc, ...get().docList]
        });

        // Jalankan Simulasi Pipeline Ingesti AI
        let currentProgress = 0;
        const intervalTime = 800; // 800ms per step

        const interval = setInterval(() => {
            currentProgress += 10;
            
            let status: IngestionStatus = 'Uploading';
            if (currentProgress >= 25 && currentProgress < 50) {
                status = 'Parsing';
            } else if (currentProgress >= 50 && currentProgress < 75) {
                status = 'Semantic Chunking';
            } else if (currentProgress >= 75 && currentProgress < 100) {
                status = 'Vectorizing';
            } else if (currentProgress >= 100) {
                status = 'Success';
                currentProgress = 100;
                clearInterval(interval);
            }

            // Update status & progress di store
            set((state) => {
                const updatedList = state.docList.map((doc) => {
                    if (doc.id === newId) {
                        return { ...doc, progress: currentProgress, status };
                    }
                    return doc;
                });

                const updatedCurrentDoc = state.currentDoc?.id === newId 
                    ? { ...state.currentDoc, progress: currentProgress, status } 
                    : state.currentDoc;

                return {
                    docList: updatedList,
                    currentDoc: updatedCurrentDoc,
                    isProcessing: currentProgress < 100
                };
            });

            // Tampilkan notifikasi jika sukses
            if (status === 'Success') {
                toast.success('Ingesti AI Berhasil', {
                    description: 'Data telah tersimpan di Database Vektor dan siap menjadi referensi AI',
                    duration: 5000
                });
            }
        }, intervalTime);
    },

    deleteDocument: (id) => {
        set((state) => ({
            docList: state.docList.filter((doc) => doc.id !== id),
            currentDoc: state.currentDoc?.id === id ? null : state.currentDoc
        }));
    },

    clearCurrentDoc: () => {
        set({ currentDoc: null });
    }
}));
