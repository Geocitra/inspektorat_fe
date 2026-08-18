// src/types/knowledge.type.ts

export type DocumentType =
    | 'REGULASI_INTERNAL'
    | 'REGULASI_DAERAH'
    | 'TEMPLATES'
    | 'LAINNYA'
    | 'RKA_PERENCANAAN'
    | 'ADENDUM_JUSTIFIKASI'
    | 'RENSTRA'
    | 'DOKUMEN_PBJ';

export type DocumentStatus = 'DRAF' | 'AKTIF' | 'ARSIP';

// Status tambahan untuk simulasi UI (Pipeline Stepper)
export type UIProcessingStatus = 'Uploading' | 'Parsing' | 'Vectorizing' | 'Success' | 'Error';

export interface DocMetadata {
    id: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
    hash: string;
}

export interface KnowledgeDoc {
    id: string;
    title: string;
    type: DocumentType;
    status: DocumentStatus | UIProcessingStatus;
    filePath: string;
    createdAt: string;
    metadata?: DocMetadata;
    opdId?: string | null;
    opd?: { id: string; namaOpd: string } | null;

    // Hanya digunakan saat proses upload di UI
    progress?: number;
}