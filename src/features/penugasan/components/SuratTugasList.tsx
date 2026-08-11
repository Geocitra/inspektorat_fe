// src/features/penugasan/components/SuratTugasList.tsx
'use client';

import { useState } from 'react';
import { useStListQuery, usePegawaiQuery } from '@/hooks/queries/useSt';
import { useDeleteStMutation } from '@/hooks/mutations/useStMutation';
import { SuratTugas } from '@/types/st.type';
import { CheckCircle2, Clock, Trash2, Eye, FileText, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import SuratTugasTte from './SuratTugasTte';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
                <h3 className="text-sm font-bold text-slate-800">Daftar Penugasan & Surat Tugas ({stList.length} ST)</h3>
            </div>

            <div className="border border-slate-200 bg-white rounded-none">
                {filteredStList.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-xs font-bold text-slate-700">Tidak Ada Penugasan</h4>
                        <p className="text-slate-400 text-xs mt-1">
                            {isAuditor ? 'Anda belum memiliki surat tugas aktif yang ditugaskan kepada Anda.' : 'Silakan rancang Surat Tugas baru menggunakan formulir di atas.'}
                        </p>
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="font-bold text-slate-700 text-xs w-[160px]">Nomor ST</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Program Audit & Objek OPD</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[160px]">Rentang Tanggal</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Tim Audit</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs w-[150px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStList.map((st) => (
                                <TableRow key={st.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                    <TableCell className="font-mono text-xs font-bold text-slate-800">{st.noSt}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs leading-normal">{st.namaAudit}</p>
                                            <p className="text-[10px] text-slate-400 font-semibold">{st.namaOpd}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px] text-slate-600">
                                        {st.tglMulai} s/d {st.tglSelesai}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-slate-800 font-bold">
                                                <span className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1 py-0.2 mr-1">Ketua</span>
                                                {getAuditorName(st.ketuaTimId)}
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                                <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 mr-1">Anggota</span>
                                                {st.anggotaIds.map(id => getAuditorName(id)).join(', ')}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border rounded-none ${
                                            st.status === 'PUBLISHED'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : st.status === 'PENDING_APPROVAL'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                            {st.status === 'PUBLISHED' ? (
                                                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                                            ) : (
                                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            )}
                                            {st.status === 'PUBLISHED' ? 'PUBLISHED' : st.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : 'DRAFT'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* PREVIEW & TTE MODAL BUTTON */}
                                            <Dialog open={isPreviewOpen && selectedSt?.id === st.id} onOpenChange={(open) => {
                                                setIsPreviewOpen(open);
                                                if (open) setSelectedSt(st);
                                            }}>
                                                 <DialogTrigger render={
                                                     <Button 
                                                         variant="ghost" 
                                                         size="icon" 
                                                         onClick={() => setSelectedSt(st)}
                                                         className="h-8 w-8 rounded-none border border-slate-200 hover:bg-slate-50 text-slate-600"
                                                         title={isInspektur && st.status === 'PENDING_APPROVAL' ? 'Review & TTE' : 'Preview PDF'}
                                                     />
                                                 }>
                                                     {isInspektur && st.status === 'PENDING_APPROVAL' ? (
                                                         <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                     ) : (
                                                         <Eye className="w-4 h-4" />
                                                     )}
                                                 </DialogTrigger>
                                                
                                                <DialogContent className="sm:max-w-[700px] rounded-none border border-slate-200 p-0 shadow-none overflow-hidden">
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
                                                        className="rounded-none border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] h-8 px-3.5 shadow-none font-bold flex items-center gap-1"
                                                    >
                                                        Buka KKA
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Button>
                                                </Link>
                                            )}

                                            {/* AJUKAN (Hanya Kasubag & status DRAFT/PENDING_APPROVAL) */}
                                            {isKasubag && st.status === 'PENDING_APPROVAL' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        toast.success('Sudah Diajukan', {
                                                            description: 'Surat Tugas sudah berada dalam antrean persetujuan TTE pimpinan.'
                                                        });
                                                    }}
                                                    className="h-8 w-8 rounded-none border border-slate-200 hover:bg-green-50 hover:text-green-700 text-slate-600"
                                                    title="Ajukan ke Inspektur"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </Button>
                                            )}

                                            {/* HAPUS (Hanya Kasubag & status DRAFT/PENDING_APPROVAL) */}
                                            {isKasubag && st.status === 'PENDING_APPROVAL' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
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
                                                    className="h-8 w-8 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600"
                                                    title="Hapus Draf"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
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
