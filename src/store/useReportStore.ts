// src/store/useReportStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

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

export const useReportStore = create<ReportState>()(
    persist(
        (set, get) => ({
            nhpList: [],
            tanggapanList: [],
            aiFeedbackList: [],
            lhpList: [],
            
            isGeneratingNhp: false,
            isAnalyzingTanggapan: false,
            isSigningLhp: false,

            generateNhpAi: async (stId, approvedFindingsCount) => {
                set({ isGeneratingNhp: true });
                await new Promise(resolve => setTimeout(resolve, 800));

                const newNhp: NhpDraft = {
                    stId,
                    kondisi: `Berdasarkan pengujian substantif dokumen SPJ Dinas Pendidikan TA 2026, ditemukan 2 indikasi penyimpangan: (1) Realisasi sewa sound system & LCD proyektor sebesar Rp 4.500.000 (Rp 1.500.000/hari) melampaui batas tarif; (2) Pembelian 1 unit Mesin Genset Silent 10 KVA senilai Rp 18.500.000 yang tidak memiliki pos pagu anggaran pada DPA SKPD 2026.`,
                    kriteria: `1. Peraturan Walikota Surabaya No. 12 Tahun 2026 tentang Standar Satuan Harga (SSH) Lampiran Standar Biaya Umum (Kode SBU-SEW-01: Maksimal Rp 750.000/hari).\n2. Peraturan Menteri Dalam Negeri No. 77 Tahun 2020 tentang Pedoman Teknis Pengelolaan Keuangan Daerah (Pengeluaran kas dilarang membebani rekening yang tidak dianggarkan).`,
                    sebab: `Pejabat Pembuat Komitmen (PPK) dan Bendahara Pengeluaran Dinas Pendidikan kurang cermat memverifikasi batas SSH serta lalai melakukan pergeseran anggaran DPA sebelum mengeksekusi pembelian genset darurat.`,
                    akibat: `Terjadi pemborosan anggaran daerah sebesar Rp 2.250.000,00 dan realisasi belanja modal di luar ketentuan DPA sebesar Rp 18.500.000,00 (Total potensi risiko deviasi anggaran Rp 20.750.000,00).`,
                    rekomendasi: `1. Menginstruksikan Kepala Dinas Pendidikan agar memerintahkan penyedia CV Media Jaya Audio menyetor kelebihan bayar sewa sebesar Rp 2.250.000,00 ke Rekening Kas Umum Daerah (Kasda) Kota Surabaya melalui Bank Jatim.\n2. Memberikan teguran tertulis kepada PPK dan melakukan penatausahaan aset genset ke dalam KIB B (Peralatan dan Mesin) serta memproses usulan revisi anggaran pada DPA Perubahan 2026.`,
                    status: 'DRAFT'
                };

                set(state => ({
                    nhpList: [...state.nhpList.filter(n => n.stId !== stId), newNhp],
                    isGeneratingNhp: false
                }));

                toast.success('Draf NHP Berhasil Dirumuskan AI', {
                    description: 'Temuan KKA telah dirangkum ke dalam format 5-Unsur Temuan Standar BPKP.'
                });
            },

            saveNhpDraft: (stId, updates) => {
                set(state => ({
                    nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, ...updates } : n)
                }));
                toast.success('Draf NHP Berhasil Disimpan');
            },

            sendNhpToOpd: (stId) => {
                set(state => ({
                    nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'SENT_TO_OPD' } : n)
                }));
                toast.success('Draf NHP Dikirim ke Dinas Pendidikan', { 
                    description: 'Dokumen diteruskan ke portal Auditi OPD untuk proses Exit Meeting dan penyampaian surat tanggapan.' 
                });
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

                toast.success('Surat Tanggapan OPD Berhasil Diunggah', { 
                    description: 'Status penugasan berubah menjadi OPD RESPONDED.' 
                });
            },

            analyzeTanggapanAi: async (stId) => {
                set({ isAnalyzingTanggapan: true });
                await new Promise(resolve => setTimeout(resolve, 1500));

                const feedback: AiSanggahanFeedback = {
                    stId,
                    analisis: 'Sanggahan Dinas Pendidikan terkait kenaikan harga sewa sound system akibat teknisi siaga 24 jam DITOLAK. Sesuai Perwali SSH No. 12/2026, tarif Rp 750.000/hari sudah termasuk jasa operator dan instalasi. Untuk pengadaan genset, aset fisik dapat diakui namun PPK tetap dikenakan sanksi administratif tata kelola kas.',
                    saran: 'TOLAK_SANGGAHAN'
                };

                set(state => ({
                    aiFeedbackList: [...state.aiFeedbackList.filter(f => f.stId !== stId), feedback],
                    isAnalyzingTanggapan: false
                }));

                toast.success('Analisis Sanggahan AI Selesai', {
                    description: 'Rekomendasi AI: Tolak Sanggahan Sewa Sound dan Pertahankan Temuan Pengembalian Kasda.'
                });
            },

            createLhpDraft: (stId) => {
                const newLhp: LhpDoc = {
                    stId,
                    noLhp: `LHP.700.1.2/001/ITDA-IRB.I/${new Date().getFullYear()}`,
                    status: 'DRAFT'
                };

                set(state => ({
                    lhpList: [...state.lhpList.filter(l => l.stId !== stId), newLhp],
                    nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'LHP_READY' } : n)
                }));

                toast.success('Draf Laporan Hasil Pemeriksaan (LHP) Berhasil Dibuat', {
                    description: 'Dokumen siap untuk tahap Otorisasi dan TTE Digital oleh Inspektur Daerah.'
                });
            },

            signLhpTte: async (stId) => {
                set({ isSigningLhp: true });
                await new Promise(resolve => setTimeout(resolve, 1500));

                const tteHash = `BSRE-SHA256-${Date.now().toString(36).toUpperCase()}-${stId.substring(0, 8).toUpperCase()}`;

                set(state => ({
                    lhpList: state.lhpList.map(l => l.stId === stId ? { ...l, status: 'SIGNED', tteHash } : l),
                    nhpList: state.nhpList.map(n => n.stId === stId ? { ...n, status: 'COMPLETED' } : n),
                    isSigningLhp: false
                }));

                toast.success('LHP Berhasil Ditandatangani Secara Elektronik (TTE)', {
                    description: 'Sertifikat digital BSrE tersemat. Dokumen LHP resmi telah terbit dan berkekuatan hukum.'
                });
            },
        }),
        {
            name: 'geoapip-report-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
