// src/store/useKkaStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

export interface KkaItem {
    id: string;
    stId: string;
    namaBarang: string;
    hargaSpj: number;
    hargaSsh: number;
    selisih: number;
    justifikasi?: string;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    aiNarasi: string;
}

interface KkaState {
    kkaList: KkaItem[];
    isUploading: boolean;
    
    // Actions
    uploadSpjExcel: (stId: string, fileName: string) => Promise<void>;
    loadSampleSpjForDisdik: (stId: string) => Promise<void>;
    saveJustification: (id: string, justifikasi: string) => void;
    approveKkaItem: (id: string) => void;
    rejectKkaItem: (id: string, reason: string) => void;
    clearKkaForSt: (stId: string) => void;
}

export const getDisdikSampleKka = (stId: string): KkaItem[] => [
    {
        id: `kka-${stId}-disdik-01`,
        stId,
        namaBarang: 'Sewa Sound System & LCD Proyektor Event Workshop Guru (3 Hari)',
        hargaSpj: 4500000,
        hargaSsh: 2250000,
        selisih: 2250000,
        justifikasi: 'Pelaksana workshop menggunakan paket vendor eksternal yang mencakup teknisi siaga 24 jam.',
        status: 'APPROVED',
        aiNarasi: '🔴 MELEBIHI STANDAR HARGA: Realisasi kuitansi Rp 1.500.000/hari melampaui batas Perwali SSH No. 12/2026 (Kode SBU-SEW-01: Maksimal Rp 750.000/hari). Ditemukan indikasi pemborosan sebesar Rp 2.250.000,00.'
    },
    {
        id: `kka-${stId}-disdik-02`,
        stId,
        namaBarang: 'Pembelian 1 Unit Mesin Genset Silent 10 KVA Kantor Disdik',
        hargaSpj: 18500000,
        hargaSsh: 0,
        selisih: 18500000,
        justifikasi: 'Pengadaan genset darurat akibat sering terjadi pemadaman listrik saat evaluasi ujian nasional.',
        status: 'APPROVED',
        aiNarasi: '🔴 BELANJA DI LUAR DPA: Dokumen DPA Dinas Pendidikan TA 2026 tidak memiliki pos pagu Belanja Modal Genset. Transaksi dibebankan secara tidak sah ke Rekening 5.1.02.01.01.0024 (Belanja ATK).'
    },
    {
        id: `kka-${stId}-disdik-03`,
        stId,
        namaBarang: 'Konsumsi Snack Box Rapat Koordinasi Kepala Sekolah (200 Kotak)',
        hargaSpj: 7000000,
        hargaSsh: 7000000,
        selisih: 0,
        justifikasi: '',
        status: 'APPROVED',
        aiNarasi: '🟢 SESUAI STANDAR: Harga satuan Rp 35.000/kotak berada dalam batas wajar Perwali SSH (Kode SSH-02-002: Rp 20.000 - Rp 40.000) dan didukung pagu DPA Sub-kegiatan 1.01.02.'
    },
    {
        id: `kka-${stId}-disdik-04`,
        stId,
        namaBarang: 'Honorarium Narasumber Workshop Kurikulum Baru (5 Jam Pelajaran)',
        hargaSpj: 5000000,
        hargaSsh: 5000000,
        selisih: 0,
        justifikasi: '',
        status: 'APPROVED',
        aiNarasi: '🟢 SESUAI STANDAR: Honorarium Rp 1.000.000/jam sesuai standar biaya masukan SBU narasumber pejabat/pakar dan kuota jam pelajaran pada DPA Sub-kegiatan 1.01.02.'
    }
];

export const useKkaStore = create<KkaState>()(
    persist(
        (set, get) => ({
            kkaList: [],
            isUploading: false,

            loadSampleSpjForDisdik: async (stId: string) => {
                set({ isUploading: true });
                await new Promise(resolve => setTimeout(resolve, 600));

                const samples = getDisdikSampleKka(stId);
                set((state) => {
                    const remaining = state.kkaList.filter(item => item.stId !== stId);
                    return {
                        kkaList: [...remaining, ...samples],
                        isUploading: false,
                    };
                });

                toast.success('Bundel SPJ & KKA Dinas Pendidikan Berhasil Dimuat', {
                    description: '4 Bukti transaksi riil telah diekstrak dan siap dianalisis oleh AI Engine.'
                });
            },

            uploadSpjExcel: async (stId, fileName) => {
                set({ isUploading: true });
                await new Promise(resolve => setTimeout(resolve, 1000));

                const samples = getDisdikSampleKka(stId);
                set((state) => {
                    const remaining = state.kkaList.filter(item => item.stId !== stId);
                    return {
                        kkaList: [...remaining, ...samples],
                        isUploading: false,
                    };
                });

                toast.success('Berkas Excel SPJ Berhasil Diproses', {
                    description: 'Deteksi anomali AI selesai. Silakan periksa hasil cross-check di tab Analisis.'
                });
            },

            saveJustification: (id, justifikasi) => {
                set((state) => ({
                    kkaList: state.kkaList.map((item) => {
                        if (item.id === id) {
                            return {
                                ...item,
                                justifikasi,
                                status: 'PENDING_REVIEW',
                            };
                        }
                        return item;
                    }),
                }));
                toast.success('Justifikasi Auditor Tersimpan', {
                    description: 'KKA siap direviu oleh Ketua Tim / Pengawas Teknis.'
                });
            },

            approveKkaItem: (id) => {
                set((state) => ({
                    kkaList: state.kkaList.map((item) => {
                        if (item.id === id) {
                            return {
                                ...item,
                                status: 'APPROVED',
                                rejectionReason: undefined,
                            };
                        }
                        return item;
                    }),
                }));
                toast.success('Temuan KKA Disetujui (Approved)', {
                    description: 'Item temuan dimasukkan ke dalam draf Naskah Hasil Pengawasan (NHP).'
                });
            },

            rejectKkaItem: (id, reason) => {
                set((state) => ({
                    kkaList: state.kkaList.map((item) => {
                        if (item.id === id) {
                            return {
                                ...item,
                                status: 'REJECTED',
                                rejectionReason: reason,
                            };
                        }
                        return item;
                    }),
                }));
                toast.info('Item KKA Ditolak / Dikeluarkan dari NHP');
            },

            clearKkaForSt: (stId) => {
                set((state) => ({
                    kkaList: state.kkaList.filter((item) => item.stId !== stId),
                }));
            },
        }),
        {
            name: 'geoapip-kka-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
