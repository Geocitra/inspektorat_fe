// src/app/(dashboard)/opd/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, MapPin } from 'lucide-react';

import { useGetOpd } from '@/hooks/queries/useGetOpd';
import { useCreateOpd, useDeleteOpd } from '@/hooks/mutations/useOpdMutation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// 1. SKEMA VALIDASI ZOD (Sama persis dengan aturan Backend)
const opdSchema = z.object({
    namaOpd: z.string().min(3, 'Nama minimal 3 karakter').max(255),
    alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
    gpsKoordinat: z.string().regex(
        /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
        'Format GPS tidak valid. Gunakan format: latitude,longitude (Contoh: -7.2504,112.7688)'
    ),
});

type OpdFormValues = z.infer<typeof opdSchema>;

export default function OpdPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pemanggilan Hooks
    const { data: opdList, isLoading, isError } = useGetOpd();
    const createMutation = useCreateOpd();
    const deleteMutation = useDeleteOpd();

    // Inisialisasi React Hook Form
    const form = useForm<OpdFormValues>({
        resolver: zodResolver(opdSchema),
        defaultValues: { namaOpd: '', alamat: '', gpsKoordinat: '' },
    });

    // Handler Submit
    const onSubmit = (values: OpdFormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                form.reset();         // Kosongkan form
                setIsModalOpen(false); // Tutup modal
            },
        });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Master Data OPD</h1>
                    <p className="text-slate-500 text-sm">Kelola daftar Organisasi Perangkat Daerah sebagai objek pemeriksaan.</p>
                </div>

                {/* TOMBOL TAMBAH & DIALOG */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    {/* PERBAIKAN: Gunakan render={} menggantikan asChild */}
                    <DialogTrigger render={
                        <Button className="bg-blue-600 hover:bg-blue-700" />}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah OPD
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Registrasi OPD Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan data instansi. Pastikan titik GPS akurat untuk validasi anti-fraud pelaporan bukti fisik.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="namaOpd"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama OPD</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Dinas Pendidikan" {...field} disabled={createMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="alamat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alamat Lengkap</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Jl. Sudirman No. 1" {...field} disabled={createMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gpsKoordinat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Titik Koordinat GPS</FormLabel>
                                            <FormControl>
                                                <Input placeholder="-7.250445, 112.768845" {...field} disabled={createMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                                        {createMutation.isPending ? 'Menyimpan...' : 'Simpan Data OPD'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* TABEL DATA */}
            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]">No</TableHead>
                            <TableHead>Nama OPD</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Koordinat Geografis</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                            </TableRow>
                        )}
                        {isError && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-red-500">Gagal mengambil data dari server.</TableCell>
                            </TableRow>
                        )}
                        {opdList && opdList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Belum ada data OPD yang terdaftar.</TableCell>
                            </TableRow>
                        )}
                        {opdList && opdList.map((opd, index) => (
                            <TableRow key={opd.id}>
                                <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                                <TableCell className="font-semibold text-slate-800">{opd.namaOpd}</TableCell>
                                <TableCell className="text-slate-600">{opd.alamat}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-100 p-1.5 rounded w-fit">
                                        <MapPin className="w-3 h-3 text-blue-500" />
                                        {opd.gpsKoordinat}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                            if (window.confirm('Yakin ingin menghapus OPD ini?')) {
                                                deleteMutation.mutate(opd.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}