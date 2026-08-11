// src/store/useStStore.ts
import { create } from 'zustand';

export interface SuratTugas {
    id: string;
    noSt: string;
    pkptAgendaId: string;
    namaAudit: string;
    namaOpd: string;
    tglMulai: string;
    tglSelesai: string;
    lokasi: string;
    ketuaTimId: string; // ID Auditor
    anggotaIds: string[]; // List ID Auditor
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'SELESAI';
    tteHash?: string;
    signedBy?: string;
    createdAt: string;
}

export interface PkaProsedur {
    id: string;
    stId: string;
    prosedur: string;
    metode: 'Cek dokumen' | 'Wawancara' | 'Cek Fisik' | 'Lainnya';
}

interface StState {
    stList: SuratTugas[];
    pkaList: PkaProsedur[];
    isRecruiting: boolean;
    isGeneratingPka: boolean;
    
    // Actions (DEPRECATED - Use useStMutation hooks instead)
    addSt: (st: Omit<SuratTugas, 'id' | 'createdAt' | 'status'>) => void;
    updateSt: (id: string, updates: Partial<SuratTugas>) => void;
    deleteSt: (id: string) => void;
    submitStToInspektur: (id: string) => void;
    approveSt: (id: string, signedBy: string) => Promise<void>;
    rejectSt: (id: string) => void;
    
    // PKA Actions
    addPkaProsedur: (stId: string, prosedur: string, metode: PkaProsedur['metode']) => void;
    updatePkaProsedur: (id: string, updates: Partial<PkaProsedur>) => void;
    deletePkaProsedur: (id: string) => void;
    generatePkaAi: (stId: string, programName: string) => Promise<void>;
    
    // Conflict Checker Utility
    checkAuditorConflict: (auditorId: string, tglMulai: string, tglSelesai: string, currentStId?: string) => boolean;
}

const INITIAL_ST: SuratTugas[] = [];

const INITIAL_PKA: PkaProsedur[] = [
    {
        id: 'pka-1',
        stId: 'st-1',
        prosedur: 'Melakukan pencocokan scan bukti kuitansi belanja dengan laporan Excel SPJ',
        metode: 'Cek dokumen'
    },
    {
        id: 'pka-2',
        stId: 'st-1',
        prosedur: 'Melakukan wawancara dengan PPK terkait mekanisme pencairan dana BOS',
        metode: 'Wawancara'
    }
];

export const useStStore = create<StState>((set, get) => ({
    stList: INITIAL_ST,
    pkaList: INITIAL_PKA,
    isRecruiting: false,
    isGeneratingPka: false,

    // Smart Conflict Checker
    checkAuditorConflict: (auditorId, tglMulai, tglSelesai, currentStId) => {
        if (!auditorId || !tglMulai || !tglSelesai) return false;
        
        const { stList } = get();
        const start = new Date(tglMulai);
        const end = new Date(tglSelesai);

        return stList.some(st => {
            if (currentStId && st.id === currentStId) return false;
            
            if (st.status === 'PUBLISHED' || st.status === 'PENDING_APPROVAL') {
                const stStart = new Date(st.tglMulai);
                const stEnd = new Date(st.tglSelesai);
                
                const isAssigned = st.ketuaTimId === auditorId || st.anggotaIds.includes(auditorId);
                
                if (isAssigned) {
                    const isOverlapping = start <= stEnd && end >= stStart;
                    if (isOverlapping) return true;
                }
            }
            return false;
        });
    },

    // Actions (DEPRECATED - Silakan gunakan mutations dari React Query)
    addSt: () => {
        console.warn('Deprecated: Gunakan useCreateStMutation() untuk menyimpan ke backend.');
    },

    updateSt: (id, updates) => {
        set(state => ({
            stList: state.stList.map(st => st.id === id ? { ...st, ...updates } : st)
        }));
    },

    deleteSt: () => {
        console.warn('Deprecated: Hapus draf ST harus dilakukan via API.');
    },

    submitStToInspektur: () => {
        console.warn('Deprecated: Status ST draf langsung diajukan secara otomatis ke database.');
    },

    approveSt: async () => {
        console.warn('Deprecated: Gunakan useSignStMutation() untuk menandatangani secara TTE.');
    },

    rejectSt: () => {
        console.warn('Deprecated: Tolak ST dari pimpinan.');
    },

    // PKA Actions
    addPkaProsedur: (stId, prosedur, metode) => {
        const newPka: PkaProsedur = {
            id: `pka-${Math.random().toString(36).substr(2, 9)}`,
            stId,
            prosedur,
            metode
        };
        set(state => ({ pkaList: [...state.pkaList, newPka] }));
    },

    updatePkaProsedur: (id, updates) => {
        set(state => ({
            pkaList: state.pkaList.map(pka => pka.id === id ? { ...pka, ...updates } : pka)
        }));
    },

    deletePkaProsedur: (id) => {
        set(state => ({
            pkaList: state.pkaList.filter(pka => pka.id !== id)
        }));
    },

    generatePkaAi: async (stId, programName) => {
        set({ isGeneratingPka: true });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const genericProcedures: { prosedur: string; metode: PkaProsedur['metode'] }[] = [
            {
                prosedur: 'Melakukan peninjauan dokumen dasar hukum operasional dan Rencana Kerja Anggaran (RKA) instansi.',
                metode: 'Cek dokumen'
            },
            {
                prosedur: 'Melakukan wawancara mendalam dengan Kepala Sub Bagian Keuangan dan Pejabat Pelaksana Teknis Kegiatan (PPTK).',
                metode: 'Wawancara'
            },
            {
                prosedur: 'Melakukan verifikasi fisik langsung di lapangan (cross-check kesesuaian lokasi dan volume beton).',
                metode: 'Cek Fisik'
            }
        ];

        const newPkas = genericProcedures.map(p => ({
            id: `pka-${Math.random().toString(36).substr(2, 9)}`,
            stId,
            prosedur: p.prosedur,
            metode: p.metode
        }));

        set(state => ({
            pkaList: [...state.pkaList.filter(pka => pka.stId !== stId), ...newPkas],
            isGeneratingPka: false
        }));
    }
}));
