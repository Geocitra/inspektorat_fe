// src/store/useOpdStore.ts
import { create } from 'zustand';

export interface AuditHistory {
    id: string;
    tahun: number;
    nomorSuratTugas: string;
    status: 'Selesai' | 'Dalam Pengawasan' | 'Draft';
    timAudit: string;
    temuanCount: number;
}

export interface Opd {
    id: string;
    namaOpd: string;
    kode: string;
    alamat: string;
    gpsKoordinat: string;
    paguAnggaran: number;
    rkaFileName?: string | null;
    auditHistory: AuditHistory[];
    createdAt: string;
}

interface OpdState {
    opdList: Opd[];
    addOpd: (opd: Omit<Opd, 'id' | 'createdAt' | 'auditHistory'> & { rkaFile?: File | null }) => void;
    updateOpd: (id: string, updatedOpd: Partial<Opd> & { rkaFile?: File | null }) => void;
    deleteOpd: (id: string) => void;
    getOpdById: (id: string) => Opd | undefined;
}

const INITIAL_OPD: Opd[] = [
    {
        id: 'opd-1',
        namaOpd: 'Dinas Pendidikan',
        kode: 'DISDIK-01',
        alamat: 'Jl. Genteng Kali No. 33, Surabaya',
        gpsKoordinat: '-7.2504,112.7688',
        paguAnggaran: 85000000000,
        rkaFileName: 'RKA_Dinas_Pendidikan_2026.pdf',
        createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
        auditHistory: [
            {
                id: 'audit-1-1',
                tahun: 2025,
                nomorSuratTugas: 'ST/004/II/2025',
                status: 'Selesai',
                timAudit: 'Tim Audit Kinerja Pendidikan',
                temuanCount: 3
            },
            {
                id: 'audit-1-2',
                tahun: 2026,
                nomorSuratTugas: 'ST/012/V/2026',
                status: 'Dalam Pengawasan',
                timAudit: 'Tim Khusus Investigasi BOS',
                temuanCount: 8
            }
        ]
    },
    {
        id: 'opd-2',
        namaOpd: 'Dinas Kesehatan',
        kode: 'DINKES-02',
        alamat: 'Jl. Jemursari No. 197, Surabaya',
        gpsKoordinat: '-7.2653,112.7501',
        paguAnggaran: 64000000000,
        rkaFileName: 'Renstra_Dinas_Kesehatan_2024_2026.pdf',
        createdAt: new Date('2026-01-20T09:30:00Z').toISOString(),
        auditHistory: [
            {
                id: 'audit-2-1',
                tahun: 2025,
                nomorSuratTugas: 'ST/009/III/2025',
                status: 'Selesai',
                timAudit: 'Tim Audit Kepatuhan Alkes',
                temuanCount: 1
            }
        ]
    },
    {
        id: 'opd-3',
        namaOpd: 'Dinas Pekerjaan Umum dan Penataan Ruang',
        kode: 'DPUPR-03',
        alamat: 'Jl. Manyar Sabrangan No. 88, Surabaya',
        gpsKoordinat: '-7.2812,112.7942',
        paguAnggaran: 120000000000,
        rkaFileName: 'RKA_PUPR_Infrastruktur_2026.xlsx',
        createdAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        auditHistory: [
            {
                id: 'audit-3-1',
                tahun: 2026,
                nomorSuratTugas: 'ST/018/VI/2026',
                status: 'Dalam Pengawasan',
                timAudit: 'Tim Audit Infrastruktur Jalan Raya',
                temuanCount: 14
            }
        ]
    }
];

export const useOpdStore = create<OpdState>((set, get) => ({
    opdList: INITIAL_OPD,

    addOpd: (opdData) => {
        const { rkaFile, ...rest } = opdData;
        const newOpd: Opd = {
            ...rest,
            id: `opd-${Date.now()}`,
            rkaFileName: rkaFile ? rkaFile.name : null,
            auditHistory: [], // Baru didaftarkan belum ada riwayat audit
            createdAt: new Date().toISOString()
        };
        set((state) => ({
            opdList: [newOpd, ...state.opdList]
        }));
    },

    updateOpd: (id, updatedData) => {
        const { rkaFile, ...rest } = updatedData;
        set((state) => ({
            opdList: state.opdList.map((opd) => {
                if (opd.id === id) {
                    return {
                        ...opd,
                        ...rest,
                        // Jika upload file baru maka timpa, jika tidak tetap gunakan yang lama
                        rkaFileName: rkaFile ? rkaFile.name : (rkaFile === null ? null : opd.rkaFileName)
                    };
                }
                return opd;
            })
        }));
    },

    deleteOpd: (id) => {
        set((state) => ({
            opdList: state.opdList.filter((opd) => opd.id !== id)
        }));
    },

    getOpdById: (id) => {
        return get().opdList.find((opd) => opd.id === id);
    }
}));
