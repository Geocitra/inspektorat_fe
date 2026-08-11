// src/store/useKkaStore.ts
import { create } from 'zustand';
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
    saveJustification: (id: string, justifikasi: string) => void;
    approveKkaItem: (id: string) => void;
    rejectKkaItem: (id: string, reason: string) => void;
    clearKkaForSt: (stId: string) => void;
}

const INITIAL_KKA: KkaItem[] = [
    {
        id: 'kka-1',
        stId: 'st-1',
        namaBarang: 'Pengadaan Laptop Core i7 Gen 12 (Dinas Pendidikan)',
        hargaSpj: 18500000,
        hargaSsh: 12000000,
        selisih: 6500000,
        justifikasi: 'Penyedia beralasan bahwa terdapat kelangkaan chip global sehingga harga unit membubung saat eksekusi kontrak.',
        status: 'PENDING_REVIEW',
        aiNarasi: 'Harga satuan pengadaan laptop melampaui Standar Satuan Harga (SSH) Kota Surabaya sebesar 54%. Analisis RAG mencatat spesifikasi di kuitansi berlayar OLED 4K, namun fisik di lapangan menggunakan panel IPS resolusi rendah.'
    },
    {
        id: 'kka-2',
        stId: 'st-1',
        namaBarang: 'Printer Laserjet Color Pro M454dn',
        hargaSpj: 8500000,
        hargaSsh: 8500000,
        selisih: 0,
        justifikasi: '',
        status: 'APPROVED',
        aiNarasi: 'Sesuai dengan standar satuan harga daerah.'
    }
];

export const useKkaStore = create<KkaState>((set, get) => ({
    kkaList: INITIAL_KKA,
    isUploading: false,

    uploadSpjExcel: async (stId, fileName) => {
        set({ isUploading: true });
        
        // Simulasi loading memproses Excel & AI RAG Satuan Harga
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockExtractedItems: KkaItem[] = [
            {
                id: `kka-${Math.random().toString(36).substr(2, 9)}`,
                stId,
                namaBarang: 'Pengadaan Laptop Core i7 Gen 13',
                hargaSpj: 19800000,
                hargaSsh: 13500000,
                selisih: 6300000,
                status: 'DRAFT',
                aiNarasi: 'Harga satuan SPJ melampaui batas standar SSH sebesar 46.6%. Rekomendasi AI RAG mencurigai adanya substitusi spesifikasi processor ke seri i5 pada fisik laptop di lapangan.'
            },
            {
                id: `kka-${Math.random().toString(36).substr(2, 9)}`,
                stId,
                namaBarang: 'Air Conditioner Split 1.5 PK Daikin',
                hargaSpj: 6800000,
                hargaSsh: 5200000,
                selisih: 1600000,
                status: 'DRAFT',
                aiNarasi: 'Ditemukan deviasi harga 30.7% melampaui limit SSH Kota Surabaya. Fisik di lapangan bermerk lokal non-inverter sedangkan SPJ mencatat merk premium inverter.'
            },
            {
                id: `kka-${Math.random().toString(36).substr(2, 9)}`,
                stId,
                namaBarang: 'Kertas HVS A4 80 Gram Sinar Dunia (Rim)',
                hargaSpj: 54000,
                hargaSsh: 54000,
                selisih: 0,
                status: 'DRAFT',
                aiNarasi: 'Harga satuan SPJ 100% cocok dengan acuan standar SSH daerah.'
            },
            {
                id: `kka-${Math.random().toString(36).substr(2, 9)}`,
                stId,
                namaBarang: 'Proyektor Epson EB-X400 4000 Lumens',
                hargaSpj: 14200000,
                hargaSsh: 9500000,
                selisih: 4700000,
                status: 'DRAFT',
                aiNarasi: 'Indikasi mark-up terdeteksi. Harga satuan SPJ melampaui SSH sebesar 49.4%. AI mendeteksi unit di lokasi audit adalah seri EB-S400 dengan lumens lebih rendah.'
            }
        ];

        set(state => ({
            // Timpa data SPJ lama untuk ST tersebut
            kkaList: [...state.kkaList.filter(item => item.stId !== stId), ...mockExtractedItems],
            isUploading: false
        }));

        toast.success('Excel Berhasil Diproses', {
            description: 'Berhasil mengekstrak 4 baris data pengeluaran SPJ. 3 anomali mark-up terdeteksi.'
        });
    },

    saveJustification: (id, justifikasi) => {
        set(state => ({
            kkaList: state.kkaList.map(item => item.id === id ? { 
                ...item, 
                justifikasi, 
                status: 'PENDING_REVIEW',
                rejectionReason: undefined 
            } : item)
        }));
        toast.info('KKA Diperbarui', { description: 'Justifikasi disimpan. Temuan diajukan ke Ketua Tim untuk direview.' });
    },

    approveKkaItem: (id) => {
        set(state => ({
            kkaList: state.kkaList.map(item => item.id === id ? { 
                ...item, 
                status: 'APPROVED',
                rejectionReason: undefined 
            } : item)
        }));
        toast.success('Temuan Disetujui', { description: 'Status temuan diubah menjadi APPROVED.' });
    },

    rejectKkaItem: (id, reason) => {
        set(state => ({
            kkaList: state.kkaList.map(item => item.id === id ? { 
                ...item, 
                status: 'REJECTED',
                rejectionReason: reason 
            } : item)
        }));
        toast.error('Temuan Ditolak', { description: 'Status temuan dikembalikan ke DRAFT dengan catatan revisi.' });
    },

    clearKkaForSt: (stId) => {
        set(state => ({
            kkaList: state.kkaList.filter(item => item.stId !== stId)
        }));
    }
}));
