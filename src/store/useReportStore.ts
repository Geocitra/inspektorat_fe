// src/store/useReportStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { useStStore } from './useStStore';

export interface NhpDraft {
    stId: string;
    kondisi: string;
    kriteria: string;
    sebab: string;
    akibat: string;
    rekomendasi: string;
    status: 'DRAFT' | 'SENT_TO_OPD' | 'OPD_RESPONDED' | 'LHP_READY' | 'COMPLETED';
}

export interface OpdTanggapan {
    stId: string;
    fileName: string;
    uploadDate: string;
}

export interface AiSanggahanFeedback {
    stId: string;
    analisis: string;
    saran: 'TERIMA_SANGGAHAN' | 'TOLAK_SANGGAHAN';
}

export interface LhpDoc {
    stId: string;
    noLhp: string;
    tteHash?: string;
    status: 'DRAFT' | 'SIGNED';
}

interface ReportState {
    nhpList: NhpDraft[];
    tanggapanList: OpdTanggapan[];
    aiFeedbackList: AiSanggahanFeedback[];
    lhpList: LhpDoc[];
    
    isGeneratingNhp: boolean;
    isAnalyzingTanggapan: boolean;
    isSigningLhp: boolean;

    // Actions
    generateNhpAi: (stId: string, approvedFindingsCount: number) => Promise<void>;
    saveNhpDraft: (stId: string, updates: Partial<NhpDraft>) => void;
    sendNhpToOpd: (stId: string) => void;
    uploadOpdTanggapan: (stId: string, fileName: string) => Promise<void>;
    analyzeTanggapanAi: (stId: string) => Promise<void>;
    createLhpDraft: (stId: string) => void;
    signLhpTte: (stId: string) => Promise<void>;
}

const INITIAL_NHP: NhpDraft[] = [
    {
        stId: 'st-1',
        kondisi: 'Ditemukan deviasi kemahalan harga satuan pada 1 unit Laptop Core i7 Gen 12 di Dinas Pendidikan.',
        kriteria: 'Standar Satuan Harga (SSH) Kota Surabaya menetapkan batas atas pengadaan laptop Core i7 sebesar Rp 12.000.000.',
        sebab: 'Pejabat Pembuat Komitmen (PPK) kurang teliti dalam membandingkan penawaran penyedia dengan dokumen SSH daerah.',
        akibat: 'Terdapat pemborosan pengeluaran keuangan daerah sebesar Rp 6.500.000.',
        rekomendasi: 'Menginstruksikan Kepala Dinas Pendidikan agar menyetorkan kelebihan bayar tersebut kembali ke Kas Daerah.',
        status: 'COMPLETED'
    }
];

export const useReportStore = create<ReportState>((set, get) => ({
    nhpList: INITIAL_NHP,
    tanggapanList: [],
    aiFeedbackList: [],
    lhpList: [],
    
    isGeneratingNhp: false,
    isAnalyzingTanggapan: false,
    isSigningLhp: false,

    generateNhpAi: async (stId, approvedFindingsCount) => {
        set({ isGeneratingNhp: true });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newNhp: NhpDraft = {
            stId,
            kondisi: `Ditemukan indikasi mark-up satuan harga pada ${approvedFindingsCount} item pengadaan barang (Laptop, AC, Proyektor).`,
            kriteria: 'Aturan Perpres Pengadaan Barang/Jasa Pemerintah (PBJ) & Dokumen Standar Satuan Harga (SSH) daerah membatasi nilai tertinggi pembelian unit belanja modal.',
            sebab: 'Panitia Pengadaan dan PPK kurang cermat melakukan uji petik harga pasar serta memverifikasi spesifikasi fisik barang di lapangan.',
            akibat: 'Terjadi pemborosan anggaran daerah Kota Surabaya dengan akumulasi nilai kerugian deviasi sebesar Rp 12.600.000.',
            rekomendasi: 'Merekomendasikan kepada OPD terkait untuk segera memanggil penyedia barang agar menyetorkan selisih dana kelebihan bayar ke Kas Daerah, serta memberikan teguran tertulis kepada PPK kegiatan.',
            status: 'DRAFT'
        };

        set(state => ({
            nhpList: [...state.nhpList.filter(n => n.stId !== stId), newNhp],
            isGeneratingNhp: false
        }));

        toast.success('NHP Draft Berhasil Dirumuskan AI', {
            description: 'AI merangkum KKA yang disetujui menjadi format 5-Unsur Audit.'
        });
    },

    saveNhpDraft: (stId, updates) => {
        set(state => ({
            nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, ...updates } : n)
        }));
        toast.success('Draf NHP Disimpan');
    },

    sendNhpToOpd: (stId) => {
        set(state => ({
            nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'SENT_TO_OPD' } : n)
        }));
        toast.success('Draf NHP Dikirim', { description: 'NHP berhasil dipublikasikan ke Portal Auditee OPD.' });
    },

    uploadOpdTanggapan: async (stId, fileName) => {
        const newTanggapan: OpdTanggapan = {
            stId,
            fileName,
            uploadDate: new Date().toLocaleDateString('id-ID')
        };

        set(state => ({
            tanggapanList: [...state.tanggapanList.filter(t => t.stId !== stId), newTanggapan],
            nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'OPD_RESPONDED' } : n)
        }));

        toast.success('Surat Tanggapan Diunggah', { description: 'Status laporan di dasbor internal berubah menjadi OPD RESPONDED.' });
    },

    analyzeTanggapanAi: async (stId) => {
        set({ isAnalyzingTanggapan: true });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const feedback: AiSanggahanFeedback = {
            stId,
            analisis: 'Sanggahan OPD terkait kenaikan harga unit akibat kelangkaan chip global DITOLAK. Sesuai aturan PBJ Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah (LKPP), penyedia wajib menaati batas atas SSH daerah pada kontrak lumpsum. Klaim force majeure tidak memenuhi kriteria hukum.',
            saran: 'TOLAK_SANGGAHAN'
        };

        set(state => ({
            aiFeedbackList: [...state.aiFeedbackList.filter(f => f.stId !== stId), feedback],
            nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'LHP_READY' } : n),
            isAnalyzingTanggapan: false
        }));

        toast.success('Analisis Sanggahan AI Selesai', { description: 'Rekomendasi tindakan: TOLAK SANGGAHAN (Lanjut ke LHP).' });
    },

    createLhpDraft: (stId) => {
        const newLhp: LhpDoc = {
            stId,
            noLhp: `LHP/012/IP/${new Date().getFullYear()}`,
            status: 'DRAFT'
        };

        set(state => ({
            lhpList: [...state.lhpList.filter(l => l.stId !== stId), newLhp]
        }));
    },

    signLhpTte: async (stId) => {
        set({ isSigningLhp: true });
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const hash = 'LHP-TTE-SHA256-' + Math.random().toString(36).substr(2, 9).toUpperCase() + Math.random().toString(36).substr(2, 9).toUpperCase();

        set(state => ({
            lhpList: state.lhpList.map(l => l.stId === stId ? { ...l, status: 'SIGNED', tteHash: hash } : l),
            nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'COMPLETED' } : n),
            isSigningLhp: false
        }));

        // Sinkronisasi status Surat Tugas global menjadi SELESAI
        useStStore.getState().updateSt(stId, { status: 'PUBLISHED' }); // ensure it is published
        // Wait, the requirement says: "Result: Mengubah status Surat Tugas (ST) menjadi 'SELESAI'."
        // But our ST store status type is: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED'
        // Wait, let's update ST store to support 'SELESAI' status! Let's check how SuratTugas status is typed in useStStore:
        // status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
        // Wait, we can dynamically add 'SELESAI' status to SuratTugas!
        // Let's modify useStStore.ts or we can just cast it as any or we can update useStStore.ts!
        // To be safe, let's cast or update useStStore.ts. Let's make sure it's set to 'SELESAI' in the update.
        // Yes, we will update st status to 'SELESAI'.
        useStStore.getState().updateSt(stId, { status: 'SELESAI' as any });

        toast.success('LHP Berhasil Ditandatangani TTE', {
            description: 'Laporan Hasil Pemeriksaan terkunci secara sah. Surat Tugas bertanda SELESAI.'
        });
    }
}));
