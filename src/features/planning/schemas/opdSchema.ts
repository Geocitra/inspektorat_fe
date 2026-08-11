import { z } from 'zod';

export const opdFormSchema = z.object({
    namaOpd: z.string().min(3, 'Nama minimal 3 karakter').max(255),
    kode: z.string().min(2, 'Kode minimal 2 karakter').max(20),
    alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
    gpsKoordinat: z.string().regex(
        /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/,
        'Koordinat harus berformat "latitude, longitude"'
    ),
    paguAnggaran: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'Pagu anggaran harus berupa angka positif',
    }),
});

export type OpdFormValues = z.infer<typeof opdFormSchema>;
