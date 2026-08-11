// src/features/planning/components/OpdFormModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOpdStore, Opd } from '@/store/useOpdStore';
import { opdFormSchema, OpdFormValues } from '../schemas/opdSchema';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface OpdFormModalProps {
    editingOpd: Opd | null;
    onClose: () => void;
}

export default function OpdFormModal({ editingOpd, onClose }: OpdFormModalProps) {
    const { addOpd, updateOpd } = useOpdStore();
    const [fileUpload, setFileUpload] = useState<File | null>(null);

    // Inisialisasi Form
    const form = useForm<OpdFormValues>({
        resolver: zodResolver(opdFormSchema),
        defaultValues: { namaOpd: '', kode: '', alamat: '', gpsKoordinat: '', paguAnggaran: '' },
    });

    // Reset/Pre-fill form saat ganti data edit
    useEffect(() => {
        if (editingOpd) {
            form.reset({
                namaOpd: editingOpd.namaOpd,
                kode: editingOpd.kode,
                alamat: editingOpd.alamat,
                gpsKoordinat: editingOpd.gpsKoordinat,
                paguAnggaran: editingOpd.paguAnggaran.toString(),
            });
        } else {
            form.reset({ namaOpd: '', kode: '', alamat: '', gpsKoordinat: '', paguAnggaran: '' });
        }
        setFileUpload(null);
    }, [editingOpd, form]);

    const onSubmit = (values: OpdFormValues) => {
        const payload = {
            namaOpd: values.namaOpd,
            kode: values.kode,
            alamat: values.alamat,
            gpsKoordinat: values.gpsKoordinat,
            paguAnggaran: Number(values.paguAnggaran),
            rkaFile: fileUpload,
        };

        if (editingOpd) {
            updateOpd(editingOpd.id, payload);
            toast.success('Berhasil Diperbarui', { description: `Data ${values.namaOpd} berhasil disimpan.` });
        } else {
            addOpd(payload);
            toast.success('Berhasil Disimpan', { description: `Data ${values.namaOpd} telah ditambahkan ke sistem.` });
        }

        onClose();
    };

    return (
        <DialogContent className="sm:max-w-[450px] rounded-none border border-slate-200 shadow-none">
            <DialogHeader className="border-b border-slate-100 pb-3">
                <DialogTitle className="text-lg font-bold text-slate-800">
                    {editingOpd ? 'Edit Data OPD' : 'Registrasi OPD Baru'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                    Lengkapi formulir instansi di bawah ini secara teliti.
                </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <FormField
                                control={form.control}
                                name="namaOpd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Nama OPD</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="Contoh: Dinas Pendidikan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <FormField
                                control={form.control}
                                name="kode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Kode OPD</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="DISDIK-01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="alamat"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-700">Alamat Lengkap</FormLabel>
                                <FormControl>
                                    <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="Contoh: Jl. Genteng Kali No. 33" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="gpsKoordinat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Koordinat GPS</FormLabel>
                                    <FormControl>
                                        <Input className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="-7.2504,112.7688" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paguAnggaran"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Pagu Anggaran (Rp)</FormLabel>
                                    <FormControl>
                                        <Input type="number" className="rounded-none border-slate-200 text-sm focus:border-blue-500" placeholder="Pagu Anggaran" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">Unggah Dokumen RKA/Renstra</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept=".pdf,.docx,.xlsx"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFileUpload(e.target.files[0]);
                                    }
                                }}
                                className="rounded-none border-slate-200 text-xs text-slate-600 file:mr-3 file:py-1 file:px-2 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                            />
                        </div>
                        {editingOpd?.rkaFileName && !fileUpload && (
                            <p className="text-[11px] text-slate-500 italic">File saat ini: {editingOpd.rkaFileName}</p>
                        )}
                    </div>

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
                            {editingOpd ? 'Simpan Perubahan' : 'Registrasi OPD'}
                        </Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
}
