// src/features/planning/components/AuditorFormModal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuditorStore } from '@/store/useAuditorStore';
import { auditorSchema, AuditorFormValues } from '../schemas/auditorSchema';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuditorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuditorFormModal({ isOpen, onClose }: AuditorFormModalProps) {
    const { addAuditor } = useAuditorStore();

    const form = useForm<AuditorFormValues>({
        resolver: zodResolver(auditorSchema),
        defaultValues: { nama: '', nip: '', status: 'Tersedia', kompetensiInput: '' },
    });

    useEffect(() => {
        if (!isOpen) {
            form.reset({ nama: '', nip: '', status: 'Tersedia', kompetensiInput: '' });
        }
    }, [isOpen, form]);

    const onSubmit = (values: AuditorFormValues) => {
        const kompetensi = values.kompetensiInput
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        addAuditor({
            nama: values.nama,
            nip: values.nip,
            status: values.status,
            kompetensi,
        });

        toast.success('Auditor Ditambahkan', {
            description: `Auditor ${values.nama} berhasil didaftarkan ke sistem.`
        });
        onClose();
    };

    return (
        <DialogContent className="sm:max-w-[450px] rounded-none border border-slate-200 shadow-none">
            <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-lg font-bold text-slate-800">Registrasi Auditor Baru</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                    Masukkan profil auditor. Tentukan kompetensi dan kualifikasi sertifikasi yang dimilikinya.
                </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
                    <FormField
                        control={form.control}
                        name="nama"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-700">Nama Lengkap & Gelar</FormLabel>
                                <FormControl>
                                    <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="Contoh: Budi Santoso, S.E., Ak." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="nip"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">NIP (Nomor Induk Pegawai)</FormLabel>
                                    <FormControl>
                                        <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="19850920..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Status Awal</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-none border-slate-200 text-sm focus:border-blue-500">
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="Tersedia">Tersedia (Ready)</SelectItem>
                                            <SelectItem value="Aktif">Aktif (Dinas)</SelectItem>
                                            <SelectItem value="Ditugaskan">Ditugaskan (On Mission)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="kompetensiInput"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-700">Keahlian & Sertifikasi</FormLabel>
                                <FormControl>
                                    <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="Contoh: IT Audit, CISA, PBJ (Pisahkan dengan koma)" {...field} />
                                </FormControl>
                                <p className="text-[10px] text-slate-400 mt-1">Gunakan tanda koma ( , ) untuk memisahkan daftar keahlian/sertifikasi.</p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-none border-slate-200 text-xs shadow-none"
                            onClick={onClose}
                        >
                            Batal
                        </Button>
                        <Button type="submit" className="rounded-none bg-blue-600 hover:bg-blue-700 text-xs shadow-none">
                            Daftarkan Auditor
                        </Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
}
