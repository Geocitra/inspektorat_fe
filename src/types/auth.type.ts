// src/types/auth.type.ts

export type SystemRole = 'APIP_INTERNAL' | 'APIP_PIMPINAN' | 'AUDITEE_OPD' | 'KEPALA_DAERAH';

export interface User {
    id: string;
    email: string;
    role: SystemRole;
    pegawaiId?: string | null;
    opdId?: string | null;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}