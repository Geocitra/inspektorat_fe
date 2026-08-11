// src/store/useStStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';

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
    
    // Actions
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

const INITIAL_ST: SuratTugas[] = [
    {
        id: 'st-1',
        noSt: 'ST/001/IP/2026',
        pkptAgendaId: 'agenda-1',
        namaAudit: 'Audit Kepatuhan SPJ Belanja Daerah',
        namaOpd: 'Dinas Pendidikan',
        tglMulai: '2026-08-10',
        tglSelesai: '2026-08-20',
        lokasi: 'Kantor Dinas Pendidikan Surabaya',
        ketuaTimId: 'auditor-1', // Budi Santoso
        anggotaIds: ['auditor-2'], // Siti Rahma
        status: 'PUBLISHED',
        tteHash: 'TTE-SHA256-8A9C12B3D4F5E6A77889C',
        signedBy: 'Inspektur Utama',
        createdAt: new Date('2026-07-28T09:00:00Z').toISOString()
    }
];

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
            // Abaikan jika ST ini adalah ST yang sedang diedit
            if (currentStId && st.id === currentStId) return false;
            
            // Hanya periksa ST yang aktif (diajukan atau disahkan)
            if (st.status === 'PUBLISHED' || st.status === 'PENDING_APPROVAL') {
                const stStart = new Date(st.tglMulai);
                const stEnd = new Date(st.tglSelesai);
                
                // Cek apakah auditor ditugaskan di tim
                const isAssigned = st.ketuaTimId === auditorId || st.anggotaIds.includes(auditorId);
                
                if (isAssigned) {
                    // Cek Overlap: A <= D && B >= C
                    const isOverlapping = start <= stEnd && end >= stStart;
                    if (isOverlapping) return true;
                }
            }
            return false;
        });
    },

    // Actions
    addSt: (st) => {
        const newSt: SuratTugas = {
            ...st,
            id: `st-${Math.random().toString(36).substr(2, 9)}`,
            status: 'DRAFT',
            createdAt: new Date().toISOString()
        };
        set(state => ({ stList: [newSt, ...state.stList] }));
    },

    updateSt: (id, updates) => {
        set(state => ({
            stList: state.stList.map(st => st.id === id ? { ...st, ...updates } : st)
        }));
    },

    deleteSt: (id) => {
        set(state => ({
            stList: state.stList.filter(st => st.id !== id),
            pkaList: state.pkaList.filter(pka => pka.stId !== id)
        }));
    },

    submitStToInspektur: (id) => {
        set(state => ({
            stList: state.stList.map(st => st.id === id ? { ...st, status: 'PENDING_APPROVAL' } : st)
        }));
        toast.info('Diajukan ke Inspektur', { description: 'Surat Tugas berhasil dikirim untuk pengesahan TTE.' });
    },

    approveSt: async (id, signedBy) => {
        // TTE Sign simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const hash = 'TTE-SHA256-' + Math.random().toString(36).substr(2, 9).toUpperCase() + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        set(state => ({
            stList: state.stList.map(st => st.id === id ? { 
                ...st, 
                status: 'PUBLISHED', 
                tteHash: hash,
                signedBy
            } : st)
        }));
        toast.success('ST Berhasil Disahkan', { description: 'Tanda tangan elektronik berhasil dibubuhkan.' });
    },

    rejectSt: (id) => {
        set(state => ({
            stList: state.stList.map(st => st.id === id ? { ...st, status: 'DRAFT' } : st)
        }));
        toast.error('ST Ditolak', { description: 'Surat Tugas dikembalikan ke status DRAFT.' });
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
        
        // Simulasikan RAG AI Query
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
            },
            {
                prosedur: 'Melakukan audit analitis mendeteksi anomali satuan harga barang dengan e-Katalog LKPP.',
                metode: 'Cek dokumen'
            }
        ];

        // Sesuaikan prosedur dengan kata kunci program audit
        const name = programName.toLowerCase();
        let tailoredProcedures = [...genericProcedures];

        if (name.includes('belanja') || name.includes('keuangan')) {
            tailoredProcedures.push({
                prosedur: 'Memverifikasi kuitansi fisik belanja di atas Rp 10.000.000 dengan mutasi kas daerah.',
                metode: 'Cek dokumen'
            });
        }
        if (name.includes('it') || name.includes('sistem') || name.includes('aplikasi')) {
            tailoredProcedures = [
                {
                    prosedur: 'Memverifikasi hak akses log user administrator dan konfigurasi database aplikasi.',
                    metode: 'Cek dokumen'
                },
                {
                    prosedur: 'Melakukan wawancara dengan tim pengembang software terkait audit keamanan jaringan.',
                    metode: 'Wawancara'
                },
                {
                    prosedur: 'Menguji ketahanan beban server (stress testing) sistem e-audit daerah.',
                    metode: 'Lainnya'
                }
            ];
        }

        const newPkas = tailoredProcedures.map(p => ({
            id: `pka-${Math.random().toString(36).substr(2, 9)}`,
            stId,
            prosedur: p.prosedur,
            metode: p.metode
        }));

        set(state => ({
            pkaList: [...state.pkaList.filter(pka => pka.stId !== stId), ...newPkas],
            isGeneratingPka: false
        }));

        toast.success('PKA Berhasil Dibuat via AI', {
            description: `Berhasil merumuskan ${tailoredProcedures.length} prosedur kerja berdasarkan dokumen pedoman RAG.`
        });
    }
}));
