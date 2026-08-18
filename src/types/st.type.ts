// src/types/st.type.ts

export type PeranSt = 'Pengawas_Teknis' | 'Ketua_Tim' | 'Anggota_Tim';
export type StatusSt = 'DRAF' | 'AKTIF' | 'SELESAI';

export interface SuratTugasAuditorItem {
    auditorId: string;
    nama: string;
    nip: string;
    jabatan?: string;
    peranDalamTim: string;
}

export interface SuratTugas {
    id: string;
    noSt: string;
    pkptAgendaId: string;
    namaAudit: string;
    namaOpd: string;
    tglMulai: string;
    tglSelesai: string;
    lokasi: string;
    pengawasTeknisId?: string;
    ketuaTimId: string; // ID Auditor
    anggotaIds: string[]; // List ID Auditor
    stAuditors?: SuratTugasAuditorItem[];
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'SELESAI';
    tteHash?: string;
    signedBy?: string;
    createdAt: string;
}

export interface CreateStAuditorPayload {
    auditorId: string;
    peranDalamTim: PeranSt;
}

export interface CreateStPayload {
    agendaAuditId?: string | null;
    nomorSt: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    auditors: CreateStAuditorPayload[];
}

export interface SignStPayload {
    digitalCertificate: string;
}

export interface RecommendTeamPayload {
    tanggalMulai: string;
    tanggalSelesai: string;
    fokusAudit: string;
}

export interface RecommendedAuditor {
    auditorId: string;
    nama: string;
    jabatan: string;
    peranDalamTim: PeranSt;
    score: number;
}

export interface RecommendTeamResponse {
    fokusAudit: string;
    periodePenugasan: {
        mulai: string;
        selesai: string;
    };
    totalTersedia: number;
    recommendation: RecommendedAuditor[];
}
