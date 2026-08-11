// src/features/planning/components/OpdList.tsx
'use client';

import { useState } from 'react';
import { useOpdStore, Opd } from '@/store/useOpdStore';
import { Plus, Trash2, MapPin, Edit2, Eye, Search, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import OpdFormModal from './OpdFormModal';

export default function OpdList() {
    const { opdList, deleteOpd } = useOpdStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpd, setEditingOpd] = useState<Opd | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter OPD berdasarkan pencarian nama atau kode
    const filteredOpd = opdList.filter(
        (opd) =>
            opd.namaOpd.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opd.kode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format Rupiah
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="space-y-6">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Master Data OPD</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola daftar Organisasi Perangkat Daerah sebagai objek pemeriksaan audit.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingOpd(null);
                }}>
                    <DialogTrigger render={
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 rounded-none font-medium text-sm transition-all shadow-none" 
                            onClick={() => setEditingOpd(null)}
                        />
                    }>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah OPD
                    </DialogTrigger>
                    
                    <OpdFormModal 
                        editingOpd={editingOpd} 
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingOpd(null);
                        }} 
                    />
                </Dialog>
            </div>

            {/* FILTER PENCARIAN */}
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-3 rounded-none">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama dinas atau kode OPD..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-sm placeholder-slate-400 text-slate-700"
                />
            </div>

            {/* TABEL DATA / EMPTY STATE */}
            <div className="border border-slate-200 bg-white rounded-none">
                {filteredOpd.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <h3 className="text-base font-bold text-slate-700">Data OPD Tidak Ditemukan</h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-sm">
                            {searchQuery ? 'Tidak ada hasil pencarian yang cocok. Silakan ubah kata kunci pencarian Anda.' : 'Belum ada Organisasi Perangkat Daerah (OPD) yang terdaftar di dalam sistem.'}
                        </p>
                        {!searchQuery && (
                            <Button 
                                onClick={() => {
                                    setEditingOpd(null);
                                    setIsModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none mt-4 shadow-none"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Registrasi OPD Pertama
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="w-[50px] font-bold text-slate-700 text-xs">No</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Kode</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Nama OPD</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Pagu Anggaran</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Koordinat GPS</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Dokumen RKA/Renstra</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs w-[140px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOpd.map((opd, index) => (
                                <TableRow key={opd.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                    <TableCell className="font-mono text-slate-400 text-xs">{index + 1}</TableCell>
                                    <TableCell className="font-mono font-semibold text-slate-600 text-xs">{opd.kode}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{opd.namaOpd}</p>
                                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{opd.alamat}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-700 text-xs">
                                        {formatRupiah(opd.paguAnggaran)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-1 border border-slate-200 w-fit">
                                            <MapPin className="w-3 h-3 text-blue-500" />
                                            {opd.gpsKoordinat}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {opd.rkaFileName ? (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                                                <span className="truncate max-w-[130px] font-medium" title={opd.rkaFileName}>
                                                    {opd.rkaFileName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 italic">Belum diunggah</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/planning/master-opd/${opd.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-none border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-600"
                                                    title="Histori & Detail"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-slate-600"
                                                onClick={() => {
                                                    setEditingOpd(opd);
                                                    setIsModalOpen(true);
                                                }}
                                                title="Edit Data"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600"
                                                onClick={() => {
                                                    if (window.confirm(`Apakah Anda yakin ingin menghapus OPD "${opd.namaOpd}" dari sistem?`)) {
                                                        deleteOpd(opd.id);
                                                        toast.success('Terhapus', { description: `Data OPD ${opd.namaOpd} berhasil dihapus.` });
                                                    }
                                                }}
                                                title="Hapus Data"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
