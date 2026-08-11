// src/features/planning/components/AuditorList.tsx
'use client';

import { useState } from 'react';
import { useAuditorStore } from '@/store/useAuditorStore';
import { Plus, Trash2, UserCheck, Eye, Search, AlertCircle, Award } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AuditorFormModal from './AuditorFormModal';

export default function AuditorList() {
    const { auditorList, deleteAuditor } = useAuditorStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAuditors = auditorList.filter(
        (auditor) =>
            auditor.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            auditor.nip.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Auditor</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola data fungsional auditor, kualifikasi kompetensi, dan status penugasan Surat Tugas.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 rounded-none font-medium text-sm transition-all shadow-none" />}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Auditor
                    </DialogTrigger>
                    
                    <AuditorFormModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </Dialog>
            </div>

            {/* FILTER SEARCH */}
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-3 rounded-none">
                <Search className="w-4 h-4 text-slate-400 ml-1" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama auditor atau nomor NIP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-sm placeholder-slate-400 text-slate-700"
                />
            </div>

            {/* TABLE / EMPTY STATE */}
            <div className="border border-slate-200 bg-white rounded-none">
                {filteredAuditors.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <h3 className="text-base font-bold text-slate-700">Data Auditor Tidak Ditemukan</h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-sm">
                            {searchQuery ? 'Tidak ada hasil pencarian yang cocok. Silakan ganti kata kunci pencarian Anda.' : 'Belum ada pejabat fungsional auditor yang terdaftar di dalam sistem.'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none mt-4 shadow-none"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Registrasi Auditor Pertama
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="font-bold text-slate-700 text-xs">Nama Lengkap & NIP</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Kompetensi Inti</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Status Kesiapan</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Tanggal Terdaftar</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs w-[120px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAuditors.map((auditor) => (
                                <TableRow key={auditor.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none hidden sm:block">
                                                <UserCheck className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{auditor.nama}</p>
                                                <p className="text-[11px] font-mono text-slate-500">NIP. {auditor.nip}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-sm">
                                            {auditor.kompetensi.slice(0, 2).map((comp, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5">
                                                    <Award className="w-2.5 h-2.5 text-slate-400" />
                                                    {comp}
                                                </span>
                                            ))}
                                            {auditor.kompetensi.length > 2 && (
                                                <span className="text-[9px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5">
                                                    +{auditor.kompetensi.length - 2} Lainnya
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 border ${
                                            auditor.status === 'Tersedia'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : auditor.status === 'Ditugaskan'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {auditor.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {new Date(auditor.createdAt).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/planning/master-auditor/${auditor.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-none border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-600"
                                                    title="Profil & Riwayat Penugasan"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600"
                                                onClick={() => {
                                                    if (window.confirm(`Hapus auditor "${auditor.nama}" dari database?`)) {
                                                        deleteAuditor(auditor.id);
                                                        toast.success('Terhapus', { description: `Data auditor ${auditor.nama} berhasil dihapus.` });
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
