// src/store/usePkptStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';

export interface OpdRisk {
    opdId: string;
    namaOpd: string;
    kode: string;
    nri: number; // Nilai Risiko Inheren
    nfr: number; // Nilai Frekuensi Risiko
    ntr: number; // Nilai Tingkat Risiko (Skor Akhir)
    prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface AuditAgenda {
    id: string;
    namaAudit: string;
    opdId: string;
    namaOpd: string;
    alokasiWaktu: string;
    anggaran: number;
    prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
}

export type PkptStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';

interface PkptState {
    riskList: OpdRisk[];
    draftAgendas: AuditAgenda[];
    status: PkptStatus;
    rejectionReason: string | null;
    tteHash: string | null;
    isCalculating: boolean;
    isGenerating: boolean;
    logs: string[];
    
    // Actions
    syncWithOpdList: (opds: any[]) => void;
    recalculateRisks: () => Promise<void>;
    generateAiPkpt: () => Promise<void>;
    updateAgenda: (id: string, updated: Partial<AuditAgenda>) => void;
    submitToInspektur: () => void;
    approveDraft: (signatureName: string) => Promise<void>;
    rejectDraft: (reason: string) => void;
}

// Initial risk seed matching the 3 seeded OPDs
const INITIAL_RISKS: Omit<OpdRisk, 'ntr' | 'prioritas'>[] = [
    { opdId: 'opd-1', namaOpd: 'Dinas Pendidikan', kode: 'DISDIK-01', nri: 7.2, nfr: 6.5 },
    { opdId: 'opd-2', namaOpd: 'Dinas Kesehatan', kode: 'DINKES-02', nri: 6.0, nfr: 5.2 },
    { opdId: 'opd-3', namaOpd: 'Dinas Pekerjaan Umum dan Penataan Ruang', kode: 'DPUPR-03', nri: 8.8, nfr: 9.0 }
];

// Helper to calculate NTR and Priority
const calculateNtrAndPriority = (nri: number, nfr: number) => {
    const ntr = Number((nri * 0.7 + nfr * 0.3).toFixed(2));
    let prioritas: 'Tinggi' | 'Sedang' | 'Rendah' = 'Rendah';
    if (ntr >= 7.5) {
        prioritas = 'Tinggi';
    } else if (ntr >= 5.5) {
        prioritas = 'Sedang';
    }
    return { ntr, prioritas };
};

export const usePkptStore = create<PkptState>((set, get) => ({
    riskList: INITIAL_RISKS.map(item => {
        const { ntr, prioritas } = calculateNtrAndPriority(item.nri, item.nfr);
        return { ...item, ntr, prioritas };
    }),
    draftAgendas: [],
    status: 'DRAFT',
    rejectionReason: null,
    tteHash: null,
    isCalculating: false,
    isGenerating: false,
    logs: [],

    // Sync with OPD Master Data to dynamically load newly registered OPDs
    syncWithOpdList: (opds) => {
        const currentRisks = get().riskList;
        const updatedRisks = opds.map(opd => {
            const existing = currentRisks.find(r => r.opdId === opd.id);
            if (existing) {
                // Keep existing risks but update name and code if edited
                return {
                    ...existing,
                    namaOpd: opd.namaOpd,
                    kode: opd.kode
                };
            } else {
                // Initialize default risks for new OPDs
                const nri = Number((4 + Math.random() * 4).toFixed(1)); // 4.0 - 8.0
                const nfr = Number((3 + Math.random() * 6).toFixed(1)); // 3.0 - 9.0
                const { ntr, prioritas } = calculateNtrAndPriority(nri, nfr);
                return {
                    opdId: opd.id,
                    namaOpd: opd.namaOpd,
                    kode: opd.kode,
                    nri,
                    nfr,
                    ntr,
                    prioritas
                };
            }
        });
        
        // Remove risk calculations for deleted OPDs
        const filteredRisks = updatedRisks.filter(r => opds.some(opd => opd.id === r.opdId));
        
        set({ riskList: filteredRisks });
    },

    recalculateRisks: async () => {
        set({ isCalculating: true });
        
        // Simulate Math Engine Delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        set((state) => {
            const updated = state.riskList.map(risk => {
                // Simulate slight dynamic risk updates (within 1 to 10 limits)
                const nriDelta = (Math.random() - 0.5) * 0.6;
                const nfrDelta = (Math.random() - 0.5) * 0.8;
                
                const newNri = Number(Math.max(1, Math.min(10, risk.nri + nriDelta)).toFixed(1));
                const newNfr = Number(Math.max(1, Math.min(10, risk.nfr + nfrDelta)).toFixed(1));
                
                const { ntr, prioritas } = calculateNtrAndPriority(newNri, newNfr);
                return {
                    ...risk,
                    nri: newNri,
                    nfr: newNfr,
                    ntr,
                    prioritas
                };
            });
            
            return {
                riskList: updated,
                isCalculating: false
            };
        });
        
        toast.success('Kalkulasi Selesai', {
            description: 'Mesin Matematika berhasil memperbarui skor risiko inheren & frekuensi seluruh OPD.'
        });
    },

    generateAiPkpt: async () => {
        set({ isGenerating: true, logs: [] });
        const addLog = (text: string) => set(state => ({ logs: [...state.logs, text] }));
        
        // Simulate AI Pipeline logging
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        
        addLog('[1/6] Mengumpulkan parameter profil risiko seluruh OPD terdaftar...');
        await delay(500);
        addLog('[2/6] Membaca data prioritas risiko (Dinas PUPR teridentifikasi sebagai High Risk)...');
        await delay(500);
        addLog('[3/6] Memanggil Mesin RAG AI dengan referensi "SOP_Audit_Kinerja_2025"...');
        await delay(600);
        addLog('[4/6] Menganalisis korelasi pagu anggaran dan lokasi geografis anti-fraud...');
        await delay(500);
        addLog('[5/6] Menyusun draf program kerja audit tahunan berdasarkan alokasi sumber daya...');
        await delay(400);
        addLog('[6/6] Memvalidasi draf sesuai skema JSON PKPT daerah... Selesai.');
        await delay(300);

        const risks = get().riskList;
        const generatedAgendas: AuditAgenda[] = risks.map((risk, index) => {
            let namaAudit = '';
            let alokasiWaktu = '';
            let anggaran = 0;
            
            if (risk.prioritas === 'Tinggi') {
                namaAudit = `Audit Investigatif & Kepatuhan Pembangunan Infrastruktur Fisik (${risk.namaOpd})`;
                alokasiWaktu = '18 Hari Kerja';
                anggaran = 120000000; // 120jt
            } else if (risk.prioritas === 'Sedang') {
                namaAudit = `Audit Kinerja & Kepatuhan Pengelolaan Anggaran Dekonsentrasi (${risk.namaOpd})`;
                alokasiWaktu = '12 Hari Kerja';
                anggaran = 75000000; // 75jt
            } else {
                namaAudit = `Review Kepatuhan Belanja Operasional Rutin Harian (${risk.namaOpd})`;
                alokasiWaktu = '8 Hari Kerja';
                anggaran = 45000000; // 45jt
            }

            return {
                id: `agenda-${index}-${Date.now()}`,
                namaAudit,
                opdId: risk.opdId,
                namaOpd: risk.namaOpd,
                alokasiWaktu,
                anggaran,
                prioritas: risk.prioritas
            };
        });

        set({
            draftAgendas: generatedAgendas,
            isGenerating: false
        });

        toast.success('Draf PKPT Berhasil Dibuat', {
            description: 'AI E-Audit berhasil merekomendasikan program kerja berbasis analisis risiko.'
        });
    },

    updateAgenda: (id, updated) => {
        set(state => ({
            draftAgendas: state.draftAgendas.map(agenda => 
                agenda.id === id ? { ...agenda, ...updated } : agenda
            )
        }));
    },

    submitToInspektur: () => {
        set({ status: 'PENDING_APPROVAL' });
        toast.info('Draf PKPT Diajukan', {
            description: 'Dokumen PKPT berhasil dikirim ke meja Inspektur untuk ditinjau.'
        });
    },

    approveDraft: async (signatureName) => {
        // Simulate digital signature TTE delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const randomHash = 'E-AUDIT-TTE-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
        
        set({
            status: 'PUBLISHED',
            tteHash: randomHash,
            rejectionReason: null
        });

        toast.success('PKPT Disahkan', {
            description: `Dokumen berhasil ditandatangani secara elektronik (TTE) atas nama ${signatureName}.`
        });
    },

    rejectDraft: (reason) => {
        set({
            status: 'DRAFT',
            rejectionReason: reason
        });

        toast.warning('Draf PKPT Ditolak', {
            description: 'Dokumen dikembalikan ke Kasubag Perencanaan untuk direvisi.'
        });
    }
}));
