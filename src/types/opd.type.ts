// src/types/opd.type.ts

export interface Opd {
    id: string;
    namaOpd: string;
    alamat: string;
    gpsKoordinat: string;
    createdAt: string;
}

export interface CreateOpdPayload {
    namaOpd: string;
    alamat: string;
    gpsKoordinat: string;
}