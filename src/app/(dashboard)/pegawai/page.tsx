// src/app/(dashboard)/pegawai/page.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, RefreshCcw, UserCircle } from 'lucide-react';

import { useGetPegawai } from '@/hooks/queries/useGetPegawai';
import { useGetOpd } from '@/hooks/queries/useGetOpd';
import { useCreatePegawai, useDeletePegawai, useSyncPegawai } from '@/hooks/mutations/usePegawaiMutation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// SKEMA VALIDASI ZOD (Create Pegawai Manual) - Persis seperti Backend
const pegawaiSchema = z.object({
    nip: z.string().min(10, 'NIP minimal 10 digit').max(50).regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
    nama: z.string().min(3, 'Nama minimal 3 karakter').max(255),
    golongan: z.string().optional(),
    jabatan: z.string().optional(),
    opdId: z.string().uuid('Pilih OPD terlebih dahulu'),
});

type PegawaiFormValues = z.infer<typeof pegawaiSchema>;

export default function PegawaiPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Queries
    const { data: pegawaiList, isLoading, isError } = useGetPegawai();
    const { data: opdList } = useGetOpd();

    // Mutations
    const createMutation = useCreatePegawai();
    const deleteMutation = useDeletePegawai();
    const syncMutation = useSyncPegawai();

    // Form State
    const form = useForm<PegawaiFormValues>({
        resolver: zodResolver(pegawaiSchema),
        defaultValues: { nip: '', nama: '', golongan: '', jabatan: '', opdId: '' },
    });

    const onSubmit = (values: PegawaiFormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                form.reset();
                setIsModalOpen(false);
            },
        });
    };

    // Handler Simulasi Webhook BKD (Rate Limiter Test)
    const handleSimulasiSync = () => {
        if (!opdList || opdList.length === 0) {
            toast.error('Gagal', { description: 'Buat minimal 1 data OPD di halaman OPD terlebih dahulu.' });
            return;
        }

        // Bangun payload tiruan seakan-olah dikirim dari aplikasi BKD
        const dummyData = {
            nip: `19800${Math.floor(Math.random() * 10000)}200501100${Math.floor(Math.random() * 10)}`,
            nama: `Pegawai Dummy ${Math.floor(Math.random() * 100)}`,
            golongan: 'Penata / III-c',
            jabatan: 'Auditor Muda',
            namaOpdAsal: opdList[0].namaOpd, // Menggunakan OPD yang sudah terdaftar di sistem lokal kita
        };

        syncMutation.mutate(dummyData);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Master Data Pegawai</h1>
                    <p className="text-slate-500 text-sm">Kelola daftar aparatur dan auditor yang terdaftar dalam sistem.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* TOMBOL SINKRONISASI BKD (SIMULASI API PUSH) */}
                    <Button
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                        onClick={handleSimulasiSync}
                        disabled={syncMutation.isPending}
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        Simulasi Sync BKD
                    </Button>

                    {/* DIALOG TAMBAH PEGAWAI MANUAL */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Pegawai
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Registrasi Pegawai Manual</DialogTitle>
                                <DialogDescription>
                                    Data ini biasanya dikelola lewat sinkronisasi BKD, namun dapat ditambah secara manual jika diperlukan.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="nip"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIP</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Masukkan NIP (Hanya Angka)" {...field} disabled={createMutation.isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nama"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama Lengkap</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: Budi Santoso, S.E." {...field} disabled={createMutation.isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="golongan"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Golongan</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Contoh: III-b" {...field} disabled={createMutation.isPending} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="jabatan"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Jabatan</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Contoh: Auditor Muda" {...field} disabled={createMutation.isPending} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="opdId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Asal OPD / Instansi</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="-- Pilih Instansi --" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {opdList?.map((opd) => (
                                                            <SelectItem key={opd.id} value={opd.id}>
                                                                {opd.namaOpd}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4 flex justify-end">
                                        <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pegawai'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* TABEL DATA */}
            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Identitas Pegawai</TableHead>
                            <TableHead>Jabatan & Golongan</TableHead>
                            <TableHead>Asal Instansi (OPD)</TableHead>
                            <TableHead>Sumber Data</TableHead>
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
                        {pegawaiList && pegawaiList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">Belum ada data pegawai yang terdaftar.</TableCell>
                            </TableRow>
                        )}
                        {pegawaiList && pegawaiList.map((pegawai) => (
                            <TableRow key={pegawai.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-full">
                                            <UserCircle className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{pegawai.nama}</p>
                                            <p className="text-xs text-slate-500 font-mono">NIP: {pegawai.nip}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm text-slate-700">{pegawai.jabatan || '-'}</p>
                                    <p className="text-xs text-slate-500">{pegawai.golongan || '-'}</p>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">
                                    {pegawai.opd?.namaOpd}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pegawai.sumberData === 'SINKRONISASI_BKD'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {pegawai.sumberData === 'SINKRONISASI_BKD' ? 'API BKD' : 'Manual'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                            if (window.confirm('Yakin ingin menghapus pegawai ini?')) {
                                                deleteMutation.mutate(pegawai.id);
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