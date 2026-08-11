// src/store/useTlhpStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';

export interface TlhpItem {
    id: string;
    stId: string;
    opdName: string;
    deskripsiTemuan: string;
    jenisBukti: 'DOKUMEN' | 'FISIK';
    buktiFile?: string;
    buktiFoto?: string;
    buktiCoords?: { lat: number; lng: number };
    projectCoords: { lat: number; lng: number };
    distanceMeters?: number;
    status: 'BELUM_SESUAI' | 'PENDING_VERIFIKASI' | 'SESUAI';
    rejectionReason?: string;
    verifiedAt?: string;
}

interface TlhpState {
    tlhpList: TlhpItem[];
    ledgerLocked: Record<string, boolean>;
    isRecalculatingCompliance: boolean;

    // Actions
    uploadDokumenBukti: (id: string, fileName: string) => void;
    uploadFotoBukti: (id: string, fileName: string, hasGps: boolean, customCoords?: { lat: number; lng: number }) => Promise<boolean>;
    verifyBukti: (id: string, approve: boolean, reason?: string) => void;
    lockLedger: (stId: string) => void;
    recalculateComplianceScores: () => Promise<void>;
}

const INITIAL_TLHP: TlhpItem[] = [
    {
        id: 'tlhp-1',
        stId: 'st-1',
        opdName: 'Dinas Pendidikan',
        deskripsiTemuan: 'Kelebihan pembayaran atas pengadaan Laptop Core i7 Gen 12 sebesar Rp 6.500.000.',
        jenisBukti: 'DOKUMEN',
        status: 'BELUM_SESUAI',
        projectCoords: { lat: -7.250445, lng: 112.768845 } // Kantor Dinas Pendidikan Surabaya
    },
    {
        id: 'tlhp-2',
        stId: 'st-1',
        opdName: 'Dinas Pendidikan',
        deskripsiTemuan: 'Ketidaksesuaian merk/spesifikasi AC Split 1.5 PK Daikin yang dipasang di Kantor Cabang Dinas Pendidikan.',
        jenisBukti: 'FISIK',
        status: 'BELUM_SESUAI',
        projectCoords: { lat: -7.265219, lng: 112.742301 } // Lokasi proyek pengadaan AC
    }
];

// Rumus Haversine menghitung jarak koordinat bumi
const getDistance = (c1: { lat: number; lng: number }, c2: { lat: number; lng: number }) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = c1.lat * Math.PI/180;
    const φ2 = c2.lat * Math.PI/180;
    const Δφ = (c2.lat-c1.lat) * Math.PI/180;
    const Δλ = (c2.lng-c1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Jarak dalam meter
};

export const useTlhpStore = create<TlhpState>((set, get) => ({
    tlhpList: INITIAL_TLHP,
    ledgerLocked: {},
    isRecalculatingCompliance: false,

    uploadDokumenBukti: (id, fileName) => {
        set(state => ({
            tlhpList: state.tlhpList.map(item => item.id === id ? {
                ...item,
                buktiFile: fileName,
                status: 'PENDING_VERIFIKASI',
                rejectionReason: undefined
            } : item)
        }));
        toast.success('Bukti Dokumen Diunggah', { description: 'Menunggu peninjauan dan validasi oleh Irban.' });
    },

    uploadFotoBukti: async (id, fileName, hasGps, customCoords) => {
        // Simulasi ekstraksi EXIF GPS
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!hasGps) {
            toast.error('Gagal Mengunggah Foto', { 
                description: 'Foto ditolak! Metadata EXIF tidak mendeteksi koordinat lokasi (GPS).' 
            });
            return false;
        }

        const item = get().tlhpList.find(t => t.id === id);
        if (!item) return false;

        // Default: jika valid dan customCoords tidak dikirim, beri koordinat melenceng tipis (misal 45 meter)
        const photoCoords = customCoords || {
            lat: item.projectCoords.lat + 0.0003,
            lng: item.projectCoords.lng + 0.0003
        };

        const distance = getDistance(item.projectCoords, photoCoords);

        set(state => ({
            tlhpList: state.tlhpList.map(t => t.id === id ? {
                ...t,
                buktiFoto: fileName,
                buktiCoords: photoCoords,
                distanceMeters: distance,
                status: 'PENDING_VERIFIKASI',
                rejectionReason: undefined
            } : t)
        }));

        toast.success('Bukti Foto Ber-GPS Berhasil Diterima', { 
            description: `Metadata GPS terbaca. Jarak dari titik proyek: ${distance} meter.` 
        });
        return true;
    },

    verifyBukti: (id, approve, reason) => {
        set(state => ({
            tlhpList: state.tlhpList.map(item => item.id === id ? {
                ...item,
                status: approve ? 'SESUAI' : 'BELUM_SESUAI',
                rejectionReason: approve ? undefined : reason,
                verifiedAt: new Date().toLocaleDateString('id-ID')
            } : item)
        }));

        if (approve) {
            toast.success('Bukti Perbaikan Diterima', { description: 'Status temuan diubah menjadi SESUAI.' });
        } else {
            toast.error('Bukti Perbaikan Ditolak', { description: `Bukti dikembalikan ke OPD. Alasan: ${reason}` });
        }
    },

    lockLedger: (stId) => {
        set(state => ({
            ledgerLocked: { ...state.ledgerLocked, [stId]: true }
        }));
        toast.info('Ledger Temuan Dikunci', { 
            description: 'Data TLHP berhasil dikunci secara permanen (TUNTAS) di Ledger System.' 
        });
    },

    recalculateComplianceScores: async () => {
        set({ isRecalculatingCompliance: true });
        // Simulasi background worker (BullMQ & Redis cache update)
        await new Promise(resolve => setTimeout(resolve, 2000));
        set({ isRecalculatingCompliance: false });
        toast.success('Sinkronisasi Redis & BullMQ Berhasil', {
            description: 'Skor kepatuhan global OPD berhasil dihitung ulang secara real-time.'
        });
    }
}));
