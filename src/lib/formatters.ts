// src/lib/formatters.ts

/**
 * Normalisasi nama Unit Kerja Irban dari format database (ENUM)
 * ke tampilan teks resmi yang elegan dan baku.
 */
export const formatUnitKerja = (unit?: string | null): string => {
    if (!unit) return 'Irban Wilayah I';
    const u = unit.toUpperCase();

    if (u === 'IRBAN_1' || u === 'IRBAN 1' || u === 'IRB.I') return 'Irban Wilayah I';
    if (u === 'IRBAN_2' || u === 'IRBAN 2' || u === 'IRB.II') return 'Irban Wilayah II';
    if (u === 'IRBAN_3' || u === 'IRBAN 3' || u === 'IRB.III') return 'Irban Wilayah III';
    if (u === 'IRBAN_INVESTIGASI' || u === 'INVESTIGASI' || u === 'IRB.INV') return 'Irban Investigasi';
    if (u === 'SEKRETARIAT') return 'Sekretariat';

    return unit.replace(/_/g, ' ');
};

/**
 * Normalisasi nama peran pengguna sistem (Role)
 */
export const formatRoleName = (role?: string | null): string => {
    if (!role) return 'Aparatur APIP';
    const r = role.toUpperCase();

    if (r === 'APIP_INTERNAL') return 'Kasubag Perencanaan & Penugasan';
    if (r === 'APIP_PIMPINAN') return 'Inspektur Utama Daerah';
    if (r === 'AUDITOR') return 'Auditor Fungsional Lapangan';
    if (r === 'OPD_CLIENT') return 'Perangkat Daerah (Auditi)';

    return role.replace(/_/g, ' ');
};

/**
 * Format tanggal Indonesia baku (contoh: 17 Agustus 2026)
 */
export const formatIndonesianDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};
