// src/types/pegawai.type.ts

import { Opd } from './opd.type';

export interface Pegawai {
    id: string;
    nip: string;
    nama: string;
    golongan?: string | null;
    jabatan?: string | null;
    opdId: string;
    sumberData: 'MANUAL' | 'SINKRONISASI_BKD';
    terakhirDisinkronkan?: string | null;
    opd: Opd;
}

export interface CreatePegawaiPayload {
    nip: string;
    nama: string;
    golongan?: string;
    jabatan?: string;
    opdId: string;
}

export interface SyncPegawaiPayload {
    nip: string;
    nama: string;
    golongan?: string;
    jabatan?: string;
    namaOpdAsal: string;
}