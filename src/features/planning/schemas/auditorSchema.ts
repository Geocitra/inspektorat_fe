import { z } from 'zod';

export const auditorSchema = z.object({
    nama: z.string().min(3, 'Nama minimal 3 karakter').max(255),
    nip: z.string().min(10, 'NIP minimal 10 digit').max(50).regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
    status: z.enum(['Aktif', 'Tersedia', 'Ditugaskan']),
    kompetensiInput: z.string().min(3, 'Tulis minimal satu kompetensi, pisahkan dengan koma'),
});

export type AuditorFormValues = z.infer<typeof auditorSchema>;
