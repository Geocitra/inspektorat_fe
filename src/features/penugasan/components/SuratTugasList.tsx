// src/features/penugasan/components/SuratTugasList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useStListQuery, usePegawaiQuery } from '@/hooks/queries/useSt';
import { useDeleteStMutation } from '@/hooks/mutations/useStMutation';
import { SuratTugas } from '@/types/st.type';
import { CheckCircle2, Clock, Trash2, Eye, FileText, Send, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PaginationControl } from '@/components/ui/pagination-control';
import SuratTugasTte from './SuratTugasTte';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

interface SuratTugasListProps {
    isKasubag: boolean;
    isInspektur: boolean;
    isAuditor?: boolean;
}

export default function SuratTugasList({ isKasubag, isInspektur, isAuditor }: SuratTugasListProps) {
    const { data: stList = [], isLoading } = useStListQuery();
    const { data: auditorList = [] } = usePegawaiQuery();
    const deleteStMutation = useDeleteStMutation();
    const { user } = useAuthStore();
    const [selectedSt, setSelectedSt] = useState<SuratTugas | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const activeAuditorId = user?.pegawaiId || '';

    // Filter daftar ST untuk Auditor
    const filteredStList = stList.filter(st => {
        if (isAuditor) {
            const isPart = st.ketuaTimId === activeAuditorId 
                || (st.anggotaIds && st.anggotaIds.includes(activeAuditorId))
                || st.pengawasTeknisId === activeAuditorId
                || (st.stAuditors && st.stAuditors.some((a: any) => a.auditorId === activeAuditorId));
            return isPart;
        }
        return true;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredStList.length]);

    const totalPages = Math.ceil(filteredStList.length / pageSize) || 1;
    const paginatedStList = filteredStList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getAuditorName = (id: string) => {
        const fullName = auditorList.find(a => a.id === id)?.nama || 'Auditor';
        // Ambil nama asli jika ada format Jabatan (Nama Lengkap)
        const match = fullName.match(/\(([^)]+)\)/);
        return match && match[1] ? match[1] : fullName;
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daftar Penugasan &amp; Surat Tugas ({filteredStList.length} ST)
                    </h3>
                </div>
            </div>

            <div className="border border-slate-200 bg-white overflow-hidden">
                <div className="p-0 overflow-hidden">
                    {paginatedStList.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                            <h4 className="text-xs font-bold text-slate-700">Tidak Ada Penugasan</h4>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {isAuditor ? 'Anda belum memiliki surat tugas aktif yang ditugaskan kepada Anda.' : 'Silakan terbitkan Surat Tugas baru menggunakan formulir di atas.'}
                            </p>
                        </div>
                    ) : (
                        <Table className="w-full table-fixed border-collapse">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent border-b border-slate-200">
                                    <TableHead className="font-bold text-slate-700 text-xs w-[16%] py-3 px-3">Nomor Surat Tugas</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[22%] py-3 px-3">Program Audit &amp; Objek OPD</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[13%] py-3 px-2">Rentang Tanggal</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[23%] py-3 px-3">Susunan Tim Audit</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[12%] py-3 px-1 text-center">Status</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 text-xs w-[14%] py-3 px-2">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedStList.map((st) => {
                                    const isPublished = st.status === 'PUBLISHED';
                                    const isPending = st.status === 'PENDING_APPROVAL';

                                    return (
                                        <TableRow key={st.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                            <TableCell className="py-2.5 px-3 align-middle">
                                                {st.noSt.includes('/') ? (
                                                    <div className="flex flex-col font-mono text-[11px] leading-tight">
                                                        <span className="font-bold text-slate-900 truncate">
                                                            {st.noSt.split('/').slice(0, 2).join('/')}
                                                        </span>
                                                        {st.noSt.split('/').length > 2 && (
                                                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                                                                /{st.noSt.split('/').slice(2).join('/')}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-xs font-bold text-slate-900 truncate block">
                                                        {st.noSt}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 align-middle">
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-slate-900 text-xs leading-snug truncate">{st.namaAudit}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{st.namaOpd}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-2 whitespace-nowrap align-middle">
                                                <div className="flex flex-col text-[11px] font-mono leading-tight">
                                                    <span className="font-bold text-slate-800">{st.tglMulai}</span>
                                                    <span className="text-[10px] text-slate-400 font-sans my-0.5">s.d.</span>
                                                    <span className="font-bold text-slate-800">{st.tglSelesai}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 overflow-hidden align-middle">
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-1.5 min-w-0" title={`Ketua Tim: ${getAuditorName(st.ketuaTimId)}`}>
                                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 border border-blue-200 font-mono shrink-0">KT</span>
                                                        <span className="text-slate-900 font-bold truncate">{getAuditorName(st.ketuaTimId)}</span>
                                                    </div>
                                                    {st.anggotaIds && st.anggotaIds.length > 0 && (
                                                        <div className="flex items-start gap-1.5 min-w-0" title={`Anggota Tim: ${st.anggotaIds.map(id => getAuditorName(id)).join(', ')}`}>
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 border border-slate-200 font-mono shrink-0 mt-0.5">AT</span>
                                                            <p className="text-[11px] text-slate-600 leading-snug truncate">
                                                                {st.anggotaIds.map(id => getAuditorName(id)).join(', ')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-1 text-center align-middle">
                                                <span className={`text-[11px] font-bold px-1.5 py-0.5 border ${
                                                    isPublished 
                                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                                        : isPending 
                                                        ? 'text-amber-700 bg-amber-50 border-amber-200' 
                                                        : 'text-slate-600 bg-slate-100 border-slate-200'
                                                }`}>
                                                    {isPublished ? 'PUBLISHED' : isPending ? 'MENUNGGU TTE' : 'DRAF'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-2 px-2 align-middle">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Dialog open={isPreviewOpen && selectedSt?.id === st.id} onOpenChange={(open) => {
                                                        setIsPreviewOpen(open);
                                                        if (open) setSelectedSt(st);
                                                    }}>
                                                        {isInspektur && !isPublished ? (
                                                            <DialogTrigger render={
                                                                <Button 
                                                                    size="sm" 
                                                                    onClick={() => setSelectedSt(st)}
                                                                    className="h-7 px-3 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                                    title="Buka Dokumen untuk Sahkan & TTE"
                                                                />
                                                            }>
                                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                                <span>ACC &amp; TTE</span>
                                                            </DialogTrigger>
                                                        ) : (
                                                            <DialogTrigger render={
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={() => setSelectedSt(st)}
                                                                    className="h-7 px-2.5 rounded-none border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-[10px] flex items-center gap-1 whitespace-nowrap"
                                                                    title="Preview Dokumen ST"
                                                                />
                                                            }>
                                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                        
                                                            </DialogTrigger>
                                                        )}
                                                        
                                                        <DialogContent className="sm:max-w-4xl w-[94vw] max-h-[90vh] rounded-none border border-slate-300 p-0 shadow-2xl overflow-hidden flex flex-col my-auto">
                                                            {selectedSt && (
                                                                <SuratTugasTte 
                                                                    st={selectedSt} 
                                                                    isInspektur={isInspektur} 
                                                                    onClose={() => setIsPreviewOpen(false)} 
                                                                />
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>

                                                    {isAuditor && (
                                                        <Link href={`/audit-execution/${st.id}/upload?role=auditor&type=${st.ketuaTimId === activeAuditorId ? 'ketua' : 'anggota'}`}>
                                                            <Button
                                                                variant="outline"
                                                                className="rounded-none border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] h-7 px-2.5 shadow-none font-bold flex items-center gap-1"
                                                            >
                                                                KKA
                                                                <ArrowRight className="w-3 h-3" />
                                                            </Button>
                                                        </Link>
                                                    )}

                                                    {isKasubag && st.status === 'PENDING_APPROVAL' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={async () => {
                                                                if (window.confirm(`Hapus draf Surat Tugas ${st.noSt}?`)) {
                                                                    try {
                                                                        await deleteStMutation.mutateAsync(st.id);
                                                                        toast.success('Draf ST Berhasil Dihapus');
                                                                    } catch (err: any) {
                                                                        toast.error('Gagal menghapus ST', { description: err.response?.data?.message });
                                                                    }
                                                                }
                                                            }}
                                                            className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            title="Hapus Draf ST"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
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
                    totalItems={filteredStList.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    itemName="Surat Tugas"
                />
            </div>
        </div>
    );
}
