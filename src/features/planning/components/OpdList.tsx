// src/features/planning/components/OpdList.tsx
'use client';

import { useState } from 'react';
import { useOpdStore, Opd } from '@/store/useOpdStore';
import { Plus, Trash2, MapPin, Edit2, Eye, Search, AlertCircle, FileSpreadsheet, Building2 } from 'lucide-react';
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
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Master Data Perangkat Daerah (OPD)
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Kelola daftar Organisasi Perangkat Daerah sebagai auditi objek pengawasan APIP.
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingOpd(null);
                }}>
                    <DialogTrigger render={
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 rounded-none font-medium text-xs h-8 transition-all shadow-none flex items-center gap-1.5" 
                            onClick={() => setEditingOpd(null)}
                        />
                    }>
                        <Plus className="w-3.5 h-3.5" />
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
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-2.5 rounded-none">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama dinas atau kode OPD..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs placeholder-slate-400 text-slate-700"
                />
            </div>

            {/* TABEL DATA (CLEAN ROW DIVIDERS, NO OVERBOXED CELLS) */}
            <div className="border border-slate-200 bg-white rounded-none overflow-x-auto">
                {filteredOpd.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <h3 className="text-sm font-bold text-slate-700">Data OPD Tidak Ditemukan</h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {searchQuery ? 'Tidak ada hasil pencarian yang cocok. Silakan ganti kata kunci pencarian Anda.' : 'Belum ada Organisasi Perangkat Daerah yang terdaftar di sistem.'}
                        </p>
                    </div>
                ) : (
                    <Table className="border-collapse min-w-[850px]">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="w-12 font-bold text-slate-700 text-xs text-center">No</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-28">Kode</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs min-w-[240px]">Nama Perangkat Daerah</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-40">Pagu Anggaran</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-40">Koordinat GPS</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-36">Dokumen RKA</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 text-xs w-24">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOpd.map((opd, index) => (
                                <TableRow key={opd.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                    <TableCell className="font-mono text-slate-400 text-xs text-center">{index + 1}</TableCell>
                                    <TableCell className="font-mono font-semibold text-slate-600 text-xs">{opd.kode}</TableCell>
                                    <TableCell className="py-3 px-3">
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs leading-tight">{opd.namaOpd}</p>
                                            <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{opd.alamat}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-800 text-xs font-mono">
                                        {formatRupiah(opd.paguAnggaran)}
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span>{opd.gpsKoordinat}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        {opd.rkaFileName ? (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span className="truncate max-w-[120px] font-medium" title={opd.rkaFileName}>
                                                    {opd.rkaFileName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 italic">Belum ada</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center py-2 px-2">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link href={`/planning/master-opd/${opd.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Histori & Detail OPD"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                onClick={() => {
                                                    setEditingOpd(opd);
                                                    setIsModalOpen(true);
                                                }}
                                                title="Edit Data OPD"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (window.confirm(`Apakah Anda yakin ingin menghapus OPD "${opd.namaOpd}"?`)) {
                                                        deleteOpd(opd.id);
                                                        toast.success('Terhapus', { description: `Data OPD ${opd.namaOpd} berhasil dihapus.` });
                                                    }
                                                }}
                                                title="Hapus OPD"
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
