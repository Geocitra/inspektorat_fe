// src/store/useAuditorStore.ts
import { create } from 'zustand';

export interface SuratTugas {
    noSt: string;
    tgl: string;
    namaOpd: string;
    peran: 'Ketua Tim' | 'Anggota' | 'Pengendali Teknis' | 'Pembantu Teknis';
}

export interface Auditor {
    id: string;
    nama: string;
    nip: string;
    status: 'Aktif' | 'Tersedia' | 'Ditugaskan';
    kompetensi: string[];
    riwayatSt: SuratTugas[];
    createdAt: string;
}

interface AuditorState {
    auditorList: Auditor[];
    addAuditor: (auditor: Omit<Auditor, 'id' | 'createdAt' | 'riwayatSt'>) => void;
    deleteAuditor: (id: string) => void;
    getAuditorById: (id: string) => Auditor | undefined;
}

const INITIAL_AUDITORS: Auditor[] = [
    {
        id: 'auditor-1',
        nama: 'Ir. Heru Prasetyo, M.T., CFrA',
        nip: '197805122002121003',
        status: 'Ditugaskan',
        kompetensi: ['Audit Investigatif', 'Sertifikasi CFrA (Forensik)', 'Pengadaan Barang & Jasa (PBJ)'],
        createdAt: new Date('2025-01-10T08:00:00Z').toISOString(),
        riwayatSt: [
            {
                noSt: 'ST/012/V/2026',
                tgl: '2026-05-10',
                namaOpd: 'Dinas Pendidikan',
                peran: 'Ketua Tim'
            },
            {
                noSt: 'ST/004/II/2025',
                tgl: '2025-02-15',
                namaOpd: 'Dinas Pendidikan',
                peran: 'Pengendali Teknis'
            }
        ]
    },
    {
        id: 'auditor-2',
        nama: 'Rina Wulandari, S.E., Ak., CA',
        nip: '198509202010012005',
        status: 'Tersedia',
        kompetensi: ['Audit Laporan Keuangan', 'Sertifikasi CA (Chartered Accountant)', 'Sistem Akuntansi Instansi'],
        createdAt: new Date('2025-01-12T09:00:00Z').toISOString(),
        riwayatSt: [
            {
                noSt: 'ST/009/III/2025',
                tgl: '2025-03-20',
                namaOpd: 'Dinas Kesehatan',
                peran: 'Anggota'
            }
        ]
    },
    {
        id: 'auditor-3',
        nama: 'Ahmad Sobirin, S.Kom., CISA',
        nip: '199101142015031002',
        status: 'Aktif',
        kompetensi: ['IT Audit & Tatakelola TI', 'Sertifikasi CISA (ISACA)', 'Audit Keamanan Informasi', 'Audit SPIP'],
        createdAt: new Date('2025-02-05T10:00:00Z').toISOString(),
        riwayatSt: [
            {
                noSt: 'ST/018/VI/2026',
                tgl: '2026-06-01',
                namaOpd: 'Dinas Pekerjaan Umum dan Penataan Ruang',
                peran: 'Anggota'
            }
        ]
    }
];

export const useAuditorStore = create<AuditorState>((set, get) => ({
    auditorList: INITIAL_AUDITORS,

    addAuditor: (auditorData) => {
        const newAuditor: Auditor = {
            ...auditorData,
            id: `auditor-${Date.now()}`,
            riwayatSt: [], // Baru didaftarkan belum ada riwayat penugasan
            createdAt: new Date().toISOString()
        };
        set((state) => ({
            auditorList: [newAuditor, ...state.auditorList]
        }));
    },

    deleteAuditor: (id) => {
        set((state) => ({
            auditorList: state.auditorList.filter((auditor) => auditor.id !== id)
        }));
    },

    getAuditorById: (id) => {
        return get().auditorList.find((auditor) => auditor.id === id);
    }
}));
