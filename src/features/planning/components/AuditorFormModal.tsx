// src/features/planning/components/AuditorFormModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatUnitKerja } from '@/lib/formatters';
import { UserCheck, Shield, Save, X, Building2, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const pegawaiFormSchema = z.object({
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
    nip: z.string().min(5, 'NIP minimal 5 karakter'),
    golongan: z.string().min(1, 'Pilih golongan/pangkat'),
    jabatan: z.string().min(2, 'Jabatan wajib diisi'),
    unitKerja: z.enum(['IRBAN_1', 'IRBAN_2', 'IRBAN_3', 'IRBAN_INVESTIGASI', 'SEKRETARIAT']),
    isAuditorLapangan: z.boolean().default(true),
    opdId: z.string().optional(),
});

type PegawaiFormValues = z.infer<typeof pegawaiFormSchema>;

interface AuditorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editPegawai?: any | null;
}

const GOLONGAN_OPTIONS = [
    'Penata Muda / III-a',
    'Penata Muda Tk I / III-b',
    'Penata / III-c',
    'Penata Tk I / III-d',
    'Pembina / IV-a',
    'Pembina Tk I / IV-b',
    'Pembina Utama Muda / IV-c',
    'Pembina Utama Madya / IV-d',
    'Pembina Utama / IV-e',
];

const JABATAN_SUGGESTIONS = [
    'Auditor Ahli Utama',
    'Auditor Ahli Madya',
    'Auditor Ahli Muda',
    'Auditor Ahli Pertama',
    'PPUPD Ahli Madya',
    'PPUPD Ahli Muda',
    'PPUPD Ahli Pertama',
    'Inspektur Pembantu Wilayah I',
    'Inspektur Pembantu Wilayah II',
    'Inspektur Pembantu Wilayah III',
    'Inspektur Pembantu Investigasi',
    'Kasubag Perencanaan',
    'Kasubag Umum & Kepegawaian',
    'Inspektur Daerah',
];

export default function AuditorFormModal({ isOpen, onClose, onSuccess, editPegawai }: AuditorFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inspektoratOpdId, setInspektoratOpdId] = useState<string>('');

    const form = useForm<PegawaiFormValues>({
        resolver: zodResolver(pegawaiFormSchema) as any,
        defaultValues: {
            nama: '',
            nip: '',
            golongan: 'Penata / III-c',
            jabatan: 'Auditor Ahli Muda',
            unitKerja: 'IRBAN_1',
            isAuditorLapangan: true,
        },
    });

    // Fetch default OPD Inspektorat
    useEffect(() => {
        const fetchOpd = async () => {
            try {
                const res = await api.get('/opd');
                const itda = res.data.find((o: any) => 
                    o.namaOpd.toLowerCase().includes('inspektorat') || 
                    o.namaOpd.toLowerCase().includes('itda')
                ) || res.data[0];
                if (itda) setInspektoratOpdId(itda.id);
            } catch (err) {
                console.error('Failed to fetch OPD list:', err);
            }
        };
        fetchOpd();
    }, []);

    // Set value jika edit mode
    useEffect(() => {
        if (editPegawai) {
            form.reset({
                nama: editPegawai.nama || '',
                nip: editPegawai.nip || '',
                golongan: editPegawai.golongan || 'Penata / III-c',
                jabatan: editPegawai.jabatan || '',
                unitKerja: editPegawai.unitKerja || 'IRBAN_1',
                isAuditorLapangan: editPegawai.isAuditorLapangan !== false,
                opdId: editPegawai.opdId,
            });
        } else {
            form.reset({
                nama: '',
                nip: '',
                golongan: 'Penata / III-c',
                jabatan: 'Auditor Ahli Muda',
                unitKerja: 'IRBAN_1',
                isAuditorLapangan: true,
            });
        }
    }, [editPegawai, isOpen, form]);

    const onSubmit = async (values: PegawaiFormValues) => {
        setIsSubmitting(true);
        try {
            const targetOpdId = values.opdId || inspektoratOpdId;
            if (!targetOpdId) {
                toast.error('Data OPD belum siap, silakan coba sesaat lagi.');
                return;
            }

            if (editPegawai?.id) {
                // Update
                await api.put(`/pegawai/${editPegawai.id}`, {
                    ...values,
                    opdId: targetOpdId,
                });
                toast.success('Data Pegawai Diperbarui', {
                    description: `Perubahan data untuk ${values.nama} berhasil disimpan.`
                });
            } else {
                // Create
                await api.post('/pegawai', {
                    ...values,
                    opdId: targetOpdId,
                });
                toast.success('Pegawai Berhasil Didaftarkan', {
                    description: `Pegawai ${values.nama} telah masuk ke sistem database.`
                });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error('Gagal Menyimpan Data', {
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] rounded-none p-0 overflow-hidden border-slate-300 shadow-2xl">
                <DialogHeader className="bg-slate-900 text-white p-4">
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        {editPegawai ? 'Edit Profil Pegawai APIP' : 'Registrasi Pegawai / Auditor Baru'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs mt-0.5">
                        Kelola data aparatur pengawas, alokasi wilayah kerja Irban, dan status penugasan lapangan.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs text-slate-700">
                        {/* Nama Lengkap & Gelar */}
                        <FormField
                            control={form.control}
                            name="nama"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Nama Lengkap &amp; Gelar</FormLabel>
                                    <FormControl>
                                        <Input className="rounded-none border-slate-200 text-xs h-9 focus:border-blue-500" placeholder="Contoh: Budi Santoso, S.E., M.Ak., CFrA" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* NIP & Golongan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="nip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">NIP (Nomor Induk Pegawai)</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-slate-200 text-xs h-9 font-mono focus:border-blue-500" placeholder="19850101-01" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="golongan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Pangkat / Golongan</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-none border-slate-200 text-xs h-9 focus:border-blue-500">
                                                    <SelectValue placeholder="Pilih golongan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-none max-h-56">
                                                {GOLONGAN_OPTIONS.map((gol) => (
                                                    <SelectItem key={gol} value={gol} className="text-xs">
                                                        {gol}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Jabatan Fungsional / Struktural */}
                        <FormField
                            control={form.control}
                            name="jabatan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                        <span>Jabatan Kedinasan</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Auditor / PPUPD / Struktural</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input 
                                            list="jabatan-suggestions"
                                            className="rounded-none border-slate-200 text-xs h-9 focus:border-blue-500" 
                                            placeholder="Contoh: Auditor Ahli Muda" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <datalist id="jabatan-suggestions">
                                        {JABATAN_SUGGESTIONS.map((j) => (
                                            <option key={j} value={j} />
                                        ))}
                                    </datalist>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Unit Kerja Wilayah Pengawasan (Irban) */}
                        <FormField
                            control={form.control}
                            name="unitKerja"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">
                                        Kelompok Wilayah Kerja Pengawasan (Irban)
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full rounded-none border-slate-200 text-xs h-9 focus:border-blue-500 font-semibold text-slate-800">
                                                <SelectValue placeholder="Pilih unit kerja...">
                                                    {formatUnitKerja(field.value)}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-none w-[var(--radix-select-trigger-width)] min-w-[360px] p-1 shadow-lg border-slate-200">
                                            <SelectItem value="IRBAN_1" className="text-xs py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-700">Irban Wilayah I</span>
                                                    <span className="text-slate-400 font-normal">&bull; Bidang Pemerintahan &amp; Sosbud</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="IRBAN_2" className="text-xs py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-indigo-700">Irban Wilayah II</span>
                                                    <span className="text-slate-400 font-normal">&bull; Bidang Infrastruktur &amp; PBJ</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="IRBAN_3" className="text-xs py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-emerald-700">Irban Wilayah III</span>
                                                    <span className="text-slate-400 font-normal">&bull; Bidang Pendidikan &amp; Keuangan</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="IRBAN_INVESTIGASI" className="text-xs py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-purple-700">Irban Investigasi</span>
                                                    <span className="text-slate-400 font-normal">&bull; Kasus Khusus, Tipikor &amp; Fraud</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="SEKRETARIAT" className="text-xs py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700">Sekretariat</span>
                                                    <span className="text-slate-400 font-normal">&bull; Pimpinan &amp; Pejabat Non-Lapangan</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Toggle Personil Lapangan (Clean Row Divider, No Nested Box) */}
                        <FormField
                            control={form.control}
                            name="isAuditorLapangan"
                            render={({ field }) => (
                                <FormItem className="pt-2 pb-1 border-t border-slate-100 flex items-center justify-between space-y-0">
                                    <div className="pr-4">
                                        <FormLabel className="text-xs font-bold text-slate-800 cursor-pointer">
                                            Dapat Ditugaskan di Surat Tugas Lapangan
                                        </FormLabel>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Centang untuk fungsional Auditor &amp; PPUPD. Hilangkan centang untuk pejabat struktural/admin.
                                        </p>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="w-4 h-4 text-blue-600 rounded-none border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="rounded-none border-slate-200 text-xs shadow-none"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none px-5"
                            >
                                <Save className={`w-3.5 h-3.5 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data Pegawai'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
