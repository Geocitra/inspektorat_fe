// src/store/usePkptStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

export interface OpdRisk {
    opdId: string;
    namaOpd: string;
    kode: string;
    nri: number; 
    nfr: number; 
    ntr: number; 
    prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface HariPemeriksaan {
    pj?: number;
    wkpj?: number;
    dalnis?: number;
    kt?: number;
    at?: number;
    totalHp?: number;
}

export interface AuditAgenda {
    id: string;
    namaAudit: string;
    opdId: string;
    namaOpd: string;
    areaPengawasan: string;
    jenisPengawasan: string;
    tujuanSasaran: string;
    ruangLingkup: string;
    pelaksana: string;
    jadwal: string;
    perkiraanBulan: number;
    alokasiWaktu: string;
    hariPemeriksaan: HariPemeriksaan;
    anggaran: number;
    jumlahLaporan: number;
    saranaPrasarana: string[];
    prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
    keterangan?: string;
}

export type PkptStatus = 'DRAF' | 'MENUNGGU_PERSETUJUAN' | 'DISETUJUI';

interface PkptState {
    pkptId: string | null;
    riskList: OpdRisk[];
    draftAgendas: AuditAgenda[];
    status: PkptStatus;
    rejectionReason: string | null;
    tteHash: string | null;
    isCalculating: boolean;
    isGenerating: boolean;
    isParsingFile: boolean;
    logs: string[];
    
    // Actions Server-Side & Client Sync
    syncWithOpdList: (opds: any[]) => void;
    fetchActivePkpt: (tahun: number) => Promise<void>;
    fetchRiskRanking: (tahun: number) => Promise<void>;
    recalculateRisks: (tahun?: number) => Promise<void>;
    generateAiPkpt: (tahun?: number) => Promise<void>;
    parsePkptFromFile: (file: File, tahun: number) => Promise<void>;
    updateAgenda: (id: string, updated: Partial<AuditAgenda>) => Promise<void>;
    submitToInspektur: () => Promise<void>;
    approveDraft: (signatureName: string) => Promise<void>;
    rejectDraft: (reason: string) => Promise<void>;
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
    pkptId: null,
    riskList: INITIAL_RISKS.map(item => {
        const { ntr, prioritas } = calculateNtrAndPriority(item.nri, item.nfr);
        return { ...item, ntr, prioritas };
    }),
    draftAgendas: [],
    status: 'DRAF',
    rejectionReason: null,
    tteHash: null,
    isCalculating: false,
    isGenerating: false,
    isParsingFile: false,
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

    // 1. Tarik Data Nyata
    fetchActivePkpt: async (tahun) => {
        try {
            const res = await api.get('/pkpt');
            const pkpts = res.data;
            const currentPkpt = pkpts.find((p: any) => p.tahunAnggaran === tahun);

            if (currentPkpt) {
                const mappedAgendas = currentPkpt.agendaAudits.map((a: any) => {
                    const sub = a.substansiDokumen || {};
                    const hp = sub.hariPemeriksaan || {};
                    const totalHp = hp.totalHp || (Number(hp.pj||0) + Number(hp.wkpj||0) + Number(hp.dalnis||0) + Number(hp.kt||0) + Number(hp.at||0));
                    
                    let prioritas: 'Tinggi'|'Sedang'|'Rendah' = 'Tinggi';
                    if (sub.tingkatRisiko) {
                        prioritas = sub.tingkatRisiko;
                    } else {
                        const alasan = String(sub.alasanPrioritas || '').toLowerCase();
                        if (alasan.includes('sedang') || alasan.includes('medium')) prioritas = 'Sedang';
                        else if (alasan.includes('rendah') || alasan.includes('low')) prioritas = 'Rendah';
                    }

                    return {
                        id: a.id,
                        namaAudit: sub.areaPengawasan || a.jenisPengawasan || 'Program Audit',
                        opdId: a.opdId,
                        namaOpd: a.opd?.namaOpd || 'Unknown',
                        areaPengawasan: sub.areaPengawasan || sub.namaAudit || a.jenisPengawasan || 'Program Kerja OPD',
                        jenisPengawasan: a.jenisPengawasan || sub.jenisPengawasan || 'Audit Tujuan Tertentu',
                        tujuanSasaran: sub.tujuanSasaran || 'Pemeriksaan kepatuhan dan akuntabilitas pelaksanaan program.',
                        ruangLingkup: sub.ruangLingkup || 'Belanja Barang/Jasa & Modal',
                        pelaksana: sub.pelaksana || 'Irban 1',
                        jadwal: sub.jadwal || (a.perkiraanBulan ? `TW ${Math.ceil(a.perkiraanBulan / 3)}` : 'TW I'),
                        perkiraanBulan: a.perkiraanBulan || 2,
                        alokasiWaktu: totalHp > 0 ? `${totalHp} HP (${sub.jadwal || `TW ${Math.ceil(a.perkiraanBulan / 3)}`})` : `Target Bulan ke-${a.perkiraanBulan}`,
                        hariPemeriksaan: {
                            pj: hp.pj || 1,
                            wkpj: hp.wkpj || 1,
                            dalnis: hp.dalnis || 10,
                            kt: hp.kt || 15,
                            at: hp.at || 30,
                            totalHp: totalHp || 57,
                        },
                        anggaran: Number(a.estimasiAnggaran) || 0,
                        jumlahLaporan: sub.jumlahLaporan || 1,
                        saranaPrasarana: Array.isArray(sub.saranaPrasarana) ? sub.saranaPrasarana : ['Laptop', 'Printer', 'ATK'],
                        prioritas,
                        keterangan: sub.keterangan || sub.alasanPrioritas || '',
                    };
                });

                set({ 
                    pkptId: currentPkpt.id, 
                    status: currentPkpt.statusPkpt, 
                    draftAgendas: mappedAgendas,
                    rejectionReason: currentPkpt.substansiDokumen?.catatanRevisi || null
                });
            } else {
                set({ pkptId: null, status: 'DRAF', draftAgendas: [], rejectionReason: null });
            }
        } catch (err) {
            console.error('Gagal mengambil data PKPT:', err);
        }
    },

    fetchRiskRanking: async (tahun) => {
        try {
            const res = await api.get(`/pkpt/ranking/${tahun}`);
            const mapped = res.data.map((r: any) => ({
                opdId: r.opdId,
                namaOpd: r.opd?.namaOpd || '',
                kode: r.opd?.kode || '',
                nri: Number(r.nri),
                nfr: Number(r.nfr),
                ntr: Number(r.ntr),
                prioritas: Number(r.ntr) >= 7.5 ? 'Tinggi' : Number(r.ntr) >= 5.5 ? 'Sedang' : 'Rendah'
            }));
            set({ riskList: mapped });
        } catch (err) {}
    },

    // 2. Memicu Kalkulasi Engine Asli di NestJS
    recalculateRisks: async (tahun: number = 2026) => {
        set({ isCalculating: true });
        try {
            await api.post('/pkpt/calculate-risk', { tahun });
            await get().fetchRiskRanking(tahun);
            toast.success('Kalkulasi Selesai', { description: 'Engine berhasil memperbarui skor NTR seluruh OPD.' });
        } catch (err: any) {
            toast.error('Gagal Kalkulasi', { description: err.response?.data?.message || 'Error server.' });
        } finally {
            set({ isCalculating: false });
        }
    },

    // 3. Generate via Ollama RAG (Live)
    generateAiPkpt: async (tahun: number = 2026) => {
        set({ isGenerating: true, logs: [] });
        const addLog = (text: string) => set(state => ({ logs: [...state.logs, text] }));
        
        try {
            addLog('[1/3] Menghubungi NestJS Backend untuk orkestrasi AI...');
            addLog('[2/3] Membaca data rujukan Knowledge Base RAG & Profil Risiko OPD...');
            
            await api.post('/pkpt/generate-draft', { tahunAnggaran: tahun });
            
            addLog('[3/3] Ekstraksi JSON selesai, menyimpan transaksi ke PostgreSQL...');
            
            await get().fetchActivePkpt(tahun);
            toast.success('Draf PKPT Berhasil Dibuat', { description: 'AI E-Audit berhasil menyusun program berdasarkan risiko.' });
        } catch (err: any) {
            toast.error('AI Gagal Memproses', { description: err.response?.data?.message || 'Waktu tunggu LLM habis.' });
        } finally {
            set({ isGenerating: false });
        }
    },

    // 4. File Upload (Sudah Live sebelumnya, kita rapikan refresh datanya)
    parsePkptFromFile: async (file, tahun) => {
        set({ isParsingFile: true, logs: [] });
        const addLog = (text: string) => set(state => ({ logs: [...state.logs, text] }));

        try {
            addLog(`Membaca file biner "${file.name}"...`);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tahunAnggaran', tahun.toString());

            await api.post('/pkpt/parse-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            addLog('Ekstraksi dan Fuzzy Match selesai. Merender tabel...');
            await get().fetchActivePkpt(tahun);
            
            toast.success('Ekstraksi Dokumen Berhasil');
        } catch (error: any) {
            toast.error('Gagal Ekstraksi PKPT', { description: error.response?.data?.message || error.message });
        } finally {
            set({ isParsingFile: false });
        }
    },

    // 5. Simpan Editan Manual Kasubag per-baris ke Database
    updateAgenda: async (id, updated) => {
        try {
            const current = get().draftAgendas.find(a => a.id === id);
            const merged = { ...current, ...updated };

            const hp = merged.hariPemeriksaan || {};
            const totalHp = Number(hp.dalnis || 0) + Number(hp.kt || 0) + Number(hp.at || 0) + Number(hp.pj || 0) + Number(hp.wkpj || 0);

            const payload = {
                jenisPengawasan: merged.jenisPengawasan,
                perkiraanBulan: merged.perkiraanBulan || 2,
                estimasiAnggaran: merged.anggaran || 0,
                substansiDokumen: {
                    areaPengawasan: merged.areaPengawasan || merged.namaAudit,
                    namaAudit: merged.areaPengawasan || merged.namaAudit,
                    jenisPengawasan: merged.jenisPengawasan,
                    tujuanSasaran: merged.tujuanSasaran,
                    ruangLingkup: merged.ruangLingkup,
                    pelaksana: merged.pelaksana,
                    jadwal: merged.jadwal,
                    hariPemeriksaan: {
                        ...hp,
                        totalHp: totalHp > 0 ? totalHp : hp.totalHp || 50,
                    },
                    jumlahLaporan: merged.jumlahLaporan || 1,
                    saranaPrasarana: merged.saranaPrasarana || ['Laptop', 'Printer', 'ATK'],
                    tingkatRisiko: merged.prioritas,
                    keterangan: merged.keterangan || '',
                    alasanPrioritas: merged.keterangan || '',
                }
            };

            await api.put(`/pkpt/agenda/${id}`, payload);
            
            // Update UI state
            set(state => ({
                draftAgendas: state.draftAgendas.map(agenda => {
                    if (agenda.id === id) {
                        return {
                            ...agenda,
                            ...updated,
                            alokasiWaktu: totalHp > 0 ? `${totalHp} HP (${merged.jadwal || 'TW I'})` : agenda.alokasiWaktu,
                            hariPemeriksaan: {
                                ...hp,
                                totalHp: totalHp > 0 ? totalHp : hp.totalHp || 50,
                            }
                        };
                    }
                    return agenda;
                })
            }));

            toast.success('Rincian Baris Berhasil Diperbarui', {
                description: `Agenda untuk ${merged.namaOpd} berhasil disimpan.`
            });
        } catch (err: any) {
            toast.error('Gagal Menyimpan Perubahan', {
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        }
    },

    // 6. Alur Persetujuan Resmi
    submitToInspektur: async () => {
        const pkptId = get().pkptId;
        if (!pkptId) return;
        try {
            await api.post(`/pkpt/${pkptId}/submit`);
            set({ status: 'MENUNGGU_PERSETUJUAN' });
            toast.success('Draf PKPT Diajukan ke Inspektur');
        } catch (err) {
            toast.error('Gagal mengajukan draf.');
        }
    },

    rejectDraft: async (reason) => {
        const pkptId = get().pkptId;
        if (!pkptId) return;
        try {
            await api.post(`/pkpt/${pkptId}/reject`, { catatanRevisi: reason });
            set({ status: 'DRAF', rejectionReason: reason });
            toast.warning('Draf PKPT Dikembalikan ke Kasubag');
        } catch (err) {
            toast.error('Gagal menolak draf.');
        }
    },

    approveDraft: async (signatureName) => {
        const pkptId = get().pkptId;
        const authUser = useAuthStore.getState().user;
        if (!pkptId || !authUser?.pegawaiId) return;

        try {
            // Asumsikan Inspektur menggunakan pegawaiId-nya
            await api.post(`/pkpt/${pkptId}/approve`, { approvedByInspekturId: authUser.pegawaiId });
            
            const randomHash = 'E-AUDIT-TTE-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
            
            set({ status: 'DISETUJUI', tteHash: randomHash, rejectionReason: null });
            toast.success('PKPT Sah', { description: `Ditandatangani secara elektronik (TTE) atas nama ${signatureName}.` });
        } catch (err: any) {
            toast.error('Gagal mengesahkan PKPT', { description: err.response?.data?.message });
        }
    }
}));
