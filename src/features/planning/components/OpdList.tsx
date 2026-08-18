// src/features/planning/components/OpdList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Eye, Search, AlertCircle, Building2, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControl } from '@/components/ui/pagination-control';
import OpdCreateModal from './OpdCreateModal';

interface OpdItem {
    id: string;
    namaOpd: string;
    alamat: string;
    gpsKoordinat: string;
    createdAt: string;
    documents?: any[];
    agendaAudits?: any[];
}

export default function OpdList() {
    const [opdList, setOpdList] = useState<OpdItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const fetchOpdList = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/opd');
            setOpdList(res.data || []);
        } catch (err) {
            toast.error('Gagal Mengambil Data OPD', { description: 'Pastikan server backend terhubung.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOpdList();
    }, []);

    // Reset pagination ketika pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleDelete = async (opd: OpdItem) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus data OPD "${opd.namaOpd}"? Semua berkas terkait akan terhapus.`)) return;
        try {
            await api.delete(`/opd/${opd.id}`);
            toast.success('Data OPD Dihapus', { description: `Perangkat daerah ${opd.namaOpd} berhasil dihapus.` });
            fetchOpdList();
        } catch (err: any) {
            toast.error('Gagal Menghapus OPD', {
                description: err.response?.data?.message || 'Data terkait dengan audit aktif.'
            });
        }
    };

    // Filter OPD berdasarkan pencarian nama atau alamat
    const filteredOpd = opdList.filter(
        (opd) =>
            opd.namaOpd.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opd.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opd.gpsKoordinat.includes(searchQuery)
    );

    const totalPages = Math.ceil(filteredOpd.length / pageSize) || 1;
    const paginatedOpd = filteredOpd.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Master Data Perangkat Daerah (OPD)
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Kelola daftar Organisasi Perangkat Daerah sebagai auditi objek pengawasan APIP.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchOpdList}
                        variant="outline"
                        disabled={isLoading}
                        className="rounded-none border-slate-200 text-xs h-8 shadow-none flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        Segarkan
                    </Button>
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 rounded-none font-medium text-xs h-8 transition-all shadow-none flex items-center gap-1.5" 
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah OPD
                    </Button>
                </div>
            </div>

            {/* FILTER PENCARIAN */}
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-2 rounded-none">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama dinas, alamat kantor, atau koordinat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs placeholder-slate-400 text-slate-700"
                />
            </div>

            {/* TABEL DATA LIVE DENGAN PAGINASI KOMPAK */}
            <div className="border border-slate-200 bg-white rounded-none p-3 space-y-2">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                            Memuat data perangkat daerah dari database...
                        </div>
                    ) : filteredOpd.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                            <h3 className="text-sm font-bold text-slate-700">Data OPD Tidak Ditemukan</h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {searchQuery ? 'Tidak ada hasil pencarian yang cocok.' : 'Belum ada Organisasi Perangkat Daerah yang terdaftar di database.'}
                            </p>
                        </div>
                    ) : (
                        <Table className="border-collapse min-w-[850px]">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                    <TableHead className="w-12 font-bold text-slate-700 text-xs text-center">No</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs min-w-[260px]">Nama Perangkat Daerah</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs min-w-[240px]">Alamat Domisili Kantor</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-44">Titik Koordinat GPS</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-32 text-center">Dokumen Berkas</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 text-xs w-24">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOpd.map((opd, index) => {
                                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                                    const docCount = (opd.documents || []).length;

                                    return (
                                        <TableRow key={opd.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                            <TableCell className="font-mono text-slate-400 text-xs text-center">{rowNumber}</TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                <p className="font-bold text-slate-900 text-xs leading-tight">{opd.namaOpd}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {opd.id.slice(0, 8)}...</p>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                <p className="text-xs text-slate-700 leading-snug">{opd.alamat}</p>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span>{opd.gpsKoordinat}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 text-center">
                                                <span className="text-xs font-mono text-slate-600 font-semibold">
                                                    {docCount} Berkas
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-2 px-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* LINK KE HALAMAN DETAIL LENGKAP & EDIT IN-PLACE */}
                                                    <Link href={`/planning/master-opd/${opd.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2.5 rounded-none text-blue-700 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold flex items-center gap-1"
                                                            title="Lihat Profil Lengkap, Kelola Berkas, dan Edit Data"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(opd)}
                                                        title="Hapus OPD"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* PAGINATION */}
                <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredOpd.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    itemName="perangkat daerah"
                />
            </div>

            {/* MODAL TAMBAH OPD BARU */}
            <OpdCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchOpdList}
            />
        </div>
    );
}
