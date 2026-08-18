// src/features/penugasan/components/SuratTugasList.tsx
'use client';

import { useState } from 'react';
import { useStListQuery, usePegawaiQuery } from '@/hooks/queries/useSt';
import { useDeleteStMutation } from '@/hooks/mutations/useStMutation';
import { SuratTugas } from '@/types/st.type';
import { CheckCircle2, Clock, Trash2, Eye, FileText, Send, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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

    // Deteksi auditor fungsional yang aktif berdasarkan mock user
    const activeAuditorId = user?.pegawaiId || '';

    // Filter daftar ST: Kasubag/Inspektur melihat semua, Auditor hanya melihat tugasnya yang sudah PUBLISHED
    const filteredStList = stList.filter(st => {
        if (isAuditor) {
            const isPart = st.ketuaTimId === activeAuditorId || st.anggotaIds.includes(activeAuditorId);
            return st.status === 'PUBLISHED' && isPart;
        }
        return true;
    });

    // Dapatkan nama auditor berdasarkan ID
    const getAuditorName = (id: string) => {
        return auditorList.find(a => a.id === id)?.nama || 'Unknown Auditor';
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Penugasan &amp; Surat Tugas ({filteredStList.length} ST)
                </h3>
            </div>

            <div className="border border-slate-200 bg-white rounded-none overflow-x-auto">
                {filteredStList.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <h4 className="text-xs font-bold text-slate-700">Tidak Ada Penugasan</h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {isAuditor ? 'Anda belum memiliki surat tugas aktif yang ditugaskan kepada Anda.' : 'Silakan terbitkan Surat Tugas baru menggunakan formulir di atas.'}
                        </p>
                    </div>
                ) : (
                    <Table className="border-collapse min-w-[850px]">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="font-bold text-slate-700 text-xs w-44">Nomor Surat Tugas</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs min-w-[240px]">Program Audit &amp; Objek OPD</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-44">Rentang Tanggal</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs min-w-[200px]">Susunan Tim Audit</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-32 text-center">Status</TableHead>
                                <TableHead className="text-center font-bold text-slate-700 text-xs w-28">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStList.map((st) => {
                                const isPublished = st.status === 'PUBLISHED';
                                const isPending = st.status === 'PENDING_APPROVAL';

                                return (
                                    <TableRow key={st.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                        <TableCell className="font-mono text-xs font-bold text-slate-900 py-3 px-3">
                                            {st.noSt}
                                        </TableCell>
                                        <TableCell className="py-3 px-3">
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs leading-snug">{st.namaAudit}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{st.namaOpd}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-600 py-3 px-3">
                                            <span>{st.tglMulai}</span>
                                            <span className="text-slate-400 mx-1">s/d</span>
                                            <span>{st.tglSelesai}</span>
                                        </TableCell>
                                        <TableCell className="py-3 px-3">
                                            <div className="space-y-0.5 text-xs">
                                                <p className="text-slate-900 font-bold">
                                                    <span className="text-[10px] font-semibold text-blue-700 mr-1.5 font-mono">KT:</span>
                                                    {getAuditorName(st.ketuaTimId)}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                                    <span className="text-[10px] font-semibold text-slate-400 mr-1.5 font-mono">AT:</span>
                                                    {st.anggotaIds.map(id => getAuditorName(id)).join(', ')}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-3 text-center">
                                            <span className={`text-xs font-bold ${
                                                isPublished 
                                                    ? 'text-emerald-700' 
                                                    : isPending 
                                                    ? 'text-amber-700' 
                                                    : 'text-slate-600'
                                            }`}>
                                                {isPublished ? 'PUBLISHED' : isPending ? 'MENUNGGU TTE' : 'DRAF'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center py-2 px-2">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* PREVIEW & TTE MODAL BUTTON */}
                                                <Dialog open={isPreviewOpen && selectedSt?.id === st.id} onOpenChange={(open) => {
                                                    setIsPreviewOpen(open);
                                                    if (open) setSelectedSt(st);
                                                }}>
                                                    <DialogTrigger render={
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => setSelectedSt(st)}
                                                            className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            title={isInspektur && st.status === 'PENDING_APPROVAL' ? 'Review & TTE' : 'Preview ST'}
                                                        />
                                                    }>
                                                        {isInspektur && st.status === 'PENDING_APPROVAL' ? (
                                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </DialogTrigger>
                                                    
                                                    <DialogContent className="sm:max-w-[720px] max-h-[85vh] rounded-none border border-slate-200 p-0 shadow-2xl overflow-hidden flex flex-col my-auto">
                                                        {selectedSt && (
                                                            <SuratTugasTte 
                                                                st={selectedSt} 
                                                                isInspektur={isInspektur}
                                                                onClose={() => setIsPreviewOpen(false)} 
                                                            />
                                                        )}
                                                    </DialogContent>
                                                </Dialog>

                                                {/* KKA MODULE REDIRECT (Hanya untuk Auditor) */}
                                                {isAuditor && (
                                                    <Link href={`/audit-execution/${st.id}/upload?role=auditor&type=${st.ketuaTimId === activeAuditorId ? 'ketua' : 'anggota'}`}>
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-none border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] h-7 px-2.5 shadow-none font-bold flex items-center gap-1"
                                                        >
                                                            Buka KKA
                                                            <ArrowRight className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* HAPUS (Hanya Kasubag & status DRAFT/PENDING_APPROVAL) */}
                                                {isKasubag && st.status === 'PENDING_APPROVAL' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (window.confirm(`Hapus draf Surat Tugas ${st.noSt}?`)) {
                                                                try {
                                                                    await deleteStMutation.mutateAsync(st.id);
                                                                    toast.success('Draf ST Berhasil Dihapus', { description: 'Surat Tugas telah dihapus dari sistem.' });
                                                                } catch (err: any) {
                                                                    toast.error('Gagal menghapus ST', { description: err.response?.data?.message || 'Terjadi kesalahan.' });
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
        </div>
    );
}
