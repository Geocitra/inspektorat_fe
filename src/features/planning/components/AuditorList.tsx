// src/features/planning/components/AuditorList.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Trash2, UserCheck, Eye, Search, AlertCircle, 
    Building2, Briefcase, Edit3, Shield, Users, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatUnitKerja } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControl } from '@/components/ui/pagination-control';
import AuditorFormModal from './AuditorFormModal';

interface PegawaiItem {
    id: string;
    nip: string;
    nama: string;
    golongan?: string;
    jabatan?: string;
    unitKerja?: 'IRBAN_1' | 'IRBAN_2' | 'IRBAN_3' | 'IRBAN_INVESTIGASI' | 'SEKRETARIAT';
    isAuditorLapangan: boolean;
    stAuditors?: Array<{ suratTugas: { id: string; nomorSt: string } }>;
    opd?: { namaOpd: string };
}

const TAB_FILTERS = [
    { key: 'ALL', label: 'Semua Aparatur' },
    { key: 'IRBAN_1', label: 'Irban Wilayah I' },
    { key: 'IRBAN_2', label: 'Irban Wilayah II' },
    { key: 'IRBAN_3', label: 'Irban Wilayah III' },
    { key: 'IRBAN_INVESTIGASI', label: 'Irban Investigasi' },
    { key: 'SEKRETARIAT', label: 'Sekretariat' },
];

export default function AuditorList() {
    const [pegawaiList, setPegawaiList] = useState<PegawaiItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPegawai, setEditingPegawai] = useState<PegawaiItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string>('ALL');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const fetchPegawai = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/pegawai');
            setPegawaiList(res.data || []);
        } catch (err) {
            toast.error('Gagal Mengambil Data Pegawai');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPegawai();
    }, []);

    // Reset page ketika filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const handleDelete = async (pegawai: PegawaiItem) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus data "${pegawai.nama}"?`)) return;
        try {
            await api.delete(`/pegawai/${pegawai.id}`);
            toast.success('Data Pegawai Dihapus');
            fetchPegawai();
        } catch (err: any) {
            toast.error('Gagal Menghapus Pegawai', {
                description: err.response?.data?.message || 'Data terkait dengan penugasan lain.'
            });
        }
    };

    const handleOpenEdit = (pegawai: PegawaiItem) => {
        setEditingPegawai(pegawai);
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingPegawai(null);
        setIsModalOpen(true);
    };

    const filteredPegawai = pegawaiList.filter((pegawai) => {
        const matchesSearch = 
            pegawai.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pegawai.nip.includes(searchQuery) ||
            (pegawai.jabatan || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'ALL' || pegawai.unitKerja === activeTab;

        return matchesSearch && matchesTab;
    });

    const totalPages = Math.ceil(filteredPegawai.length / pageSize) || 1;
    const paginatedPegawai = filteredPegawai.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getUnitBadge = (unit?: string) => {
        const formatted = formatUnitKerja(unit);
        switch (unit) {
            case 'IRBAN_1':
                return <span className="text-[11px] font-bold text-blue-700">{formatted}</span>;
            case 'IRBAN_2':
                return <span className="text-[11px] font-bold text-indigo-700">{formatted}</span>;
            case 'IRBAN_3':
                return <span className="text-[11px] font-bold text-emerald-700">{formatted}</span>;
            case 'IRBAN_INVESTIGASI':
                return <span className="text-[11px] font-bold text-purple-700">{formatted}</span>;
            case 'SEKRETARIAT':
                return <span className="text-[11px] font-semibold text-slate-600">{formatted}</span>;
            default:
                return <span className="text-[11px] font-semibold text-slate-600">{formatted}</span>;
        }
    };

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Manajemen Aparatur &amp; Auditor APIP
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Kelola data aparatur Inspektorat, pengelompokan unit Irban, dan status personil dinas lapangan.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchPegawai}
                        variant="outline"
                        disabled={isLoading}
                        className="rounded-none border-slate-200 text-xs h-8 shadow-none flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        Segarkan
                    </Button>
                    <Button 
                        onClick={handleOpenCreate}
                        className="bg-blue-600 hover:bg-blue-700 rounded-none font-medium text-xs h-8 transition-all shadow-none flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Aparatur
                    </Button>
                </div>
            </div>

            {/* TAB FILTER IRBAN */}
            <div className="space-y-2.5">
                <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
                    {TAB_FILTERS.map((tab) => {
                        const count = tab.key === 'ALL' 
                            ? pegawaiList.length 
                            : pegawaiList.filter(p => p.unitKerja === tab.key).length;

                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors border-b-2 whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                                <span className={`text-[10px] font-mono ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                                    ({count})
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* SEARCH INPUT BAR */}
                <div className="flex items-center gap-2 border border-slate-200 bg-white p-2 rounded-none">
                    <Search className="w-4 h-4 text-slate-400 ml-1" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama aparatur, NIP, atau jabatan kedinasan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-xs placeholder-slate-400 text-slate-700"
                    />
                </div>
            </div>

            {/* TABLE DATA PEGAWAI DENGAN PAGINASI KOMPAK */}
            <div className="border border-slate-200 bg-white rounded-none p-3 space-y-2">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                            Memuat data aparatur Inspektorat...
                        </div>
                    ) : filteredPegawai.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                            <h3 className="text-sm font-bold text-slate-700">Tidak Ada Data Pegawai</h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {searchQuery ? 'Tidak ada hasil yang sesuai dengan kata kunci pencarian.' : 'Belum ada aparatur pada unit kerja ini.'}
                            </p>
                        </div>
                    ) : (
                        <Table className="border-collapse min-w-[800px]">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                    <TableHead className="font-bold text-slate-700 text-xs w-12 text-center">No</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs min-w-[240px]">Nama Aparatur &amp; NIP</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs min-w-[180px]">Jabatan &amp; Golongan</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-36">Kelompok Wilayah (Irban)</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-32 text-center">Status Lapangan</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-28 text-center">Beban ST</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 text-xs w-20">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPegawai.map((pegawai, index) => {
                                    const activeStCount = (pegawai.stAuditors || []).length;
                                    const rowNumber = (currentPage - 1) * pageSize + index + 1;

                                    return (
                                        <TableRow key={pegawai.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                            <TableCell className="font-mono text-xs text-slate-400 text-center">
                                                {rowNumber}
                                            </TableCell>

                                            <TableCell className="py-2.5 px-3">
                                                <p className="font-bold text-slate-900 text-xs leading-tight">
                                                    {pegawai.nama}
                                                </p>
                                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                    NIP. {pegawai.nip}
                                                </p>
                                            </TableCell>

                                            <TableCell className="py-2.5 px-3">
                                                <p className="text-xs font-medium text-slate-800">{pegawai.jabatan || 'Aparatur APIP'}</p>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pegawai.golongan || '-'}</p>
                                            </TableCell>

                                            <TableCell className="py-2.5 px-3">
                                                {getUnitBadge(pegawai.unitKerja)}
                                            </TableCell>

                                            <TableCell className="py-2.5 px-3 text-center">
                                                {pegawai.isAuditorLapangan ? (
                                                    <span className="text-[11px] font-bold text-emerald-700">
                                                        Auditor Lapangan
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        Non-Lapangan
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="py-2.5 px-3 text-center font-mono text-xs font-semibold">
                                                <span className={activeStCount === 0 ? 'text-slate-400' : 'text-amber-700 font-bold'}>
                                                    {activeStCount} ST Aktif
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center py-2 px-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(pegawai)}
                                                        className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                        title="Edit Data Pegawai"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(pegawai)}
                                                        className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        title="Hapus Pegawai"
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

                {/* PAGINASI KONTROL */}
                <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredPegawai.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    itemName="aparatur"
                />
            </div>

            {/* MODAL FORM TAMBAH / EDIT PEGAWAI */}
            <AuditorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPegawai}
                editPegawai={editingPegawai}
            />
        </div>
    );
}
