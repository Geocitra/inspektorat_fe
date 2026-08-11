// src/hooks/queries/useSt.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SuratTugas } from '@/types/st.type';
import { Pegawai } from '@/types/pegawai.type';
import { useStStore } from '@/store/useStStore';

function mapBackendStToLegacy(st: any): SuratTugas {
    const ketuaTim = st.stAuditors?.find((a: any) => a.peranDalamTim === 'Ketua_Tim');
    const anggotaList = st.stAuditors?.filter((a: any) => a.peranDalamTim === 'Anggota_Tim') || [];
    
    return {
        id: st.id,
        noSt: st.nomorSt,
        pkptAgendaId: st.agendaAuditId || '',
        namaAudit: st.agendaAudit?.substansiDokumen?.namaAudit || st.agendaAudit?.jenisPengawasan || 'Audit Pengawasan',
        namaOpd: st.agendaAudit?.opd?.namaOpd || 'Dinas Terkait',
        tglMulai: st.tanggalMulai ? st.tanggalMulai.split('T')[0] : '',
        tglSelesai: st.tanggalSelesai ? st.tanggalSelesai.split('T')[0] : '',
        lokasi: st.agendaAudit?.opd?.alamat || 'Kantor OPD',
        ketuaTimId: ketuaTim?.auditorId || '',
        anggotaIds: anggotaList.map((a: any) => a.auditorId),
        status: st.statusSt === 'DRAF' ? 'PENDING_APPROVAL' : st.statusSt === 'AKTIF' ? 'PUBLISHED' : st.statusSt,
        tteHash: st.signedAt ? `TTE-SHA256-${st.id.substring(0, 8).toUpperCase()}` : '',
        createdAt: st.createdAt || new Date().toISOString(),
    };
}

export function useStListQuery() {
    return useQuery<SuratTugas[]>({
        queryKey: ['surat-tugas'],
        queryFn: async () => {
            const response = await api.get('/surat-tugas');
            const data = response.data;
            
            // Sinkronisasi ke legacy Zustand store agar modul pelaporan/monitoring lainnya tidak pecah
            const mappedData = data.map(mapBackendStToLegacy);
            useStStore.setState({ stList: mappedData });
            return mappedData;
        },
    });
}

export function useStDetailQuery(id?: string) {
    return useQuery<SuratTugas>({
        queryKey: ['surat-tugas', id],
        queryFn: async () => {
            const response = await api.get(`/surat-tugas/${id}`);
            const data = response.data;
            return mapBackendStToLegacy(data);
        },
        enabled: !!id,
    });
}

export function usePegawaiQuery() {
    return useQuery<Pegawai[]>({
        queryKey: ['pegawai'],
        queryFn: async () => {
            const response = await api.get('/pegawai');
            return response.data;
        },
    });
}

export interface Agenda {
    id: string;
    pkptId: string;
    opdId: string;
    jenisPengawasan: string;
    perkiraanBulan: number;
    estimasiAnggaran: string;
    substansiDokumen?: any;
    opd?: {
        id: string;
        namaOpd: string;
        alamat: string;
        gpsKoordinat: string;
    };
    pkpt?: {
        id: string;
        tahunAnggaran: number;
        statusPkpt: string;
    };
    suratTugas?: any;
}

export function useAgendaQuery() {
    return useQuery<Agenda[]>({
        queryKey: ['agenda'],
        queryFn: async () => {
            const response = await api.get('/agenda');
            return response.data;
        },
    });
}
