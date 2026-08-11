// src/features/execution/components/ReviewerPortal.tsx
'use client';

import { useState } from 'react';
import { useKkaStore, KkaItem } from '@/store/useKkaStore';
import { 
    CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, MessageSquare, ShieldCheck, Check 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ReviewerPortalProps {
    stId: string;
}

export default function ReviewerPortal({ stId }: ReviewerPortalProps) {
    const { kkaList, approveKkaItem, rejectKkaItem } = useKkaStore();
    const [selectedItem, setSelectedItem] = useState<KkaItem | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionInput, setRejectionInput] = useState('');

    // Filter KKA items for this ST
    const currentKkaItems = kkaList.filter(item => item.stId === stId);

    // Format Rupiah
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const handleRejectClick = (item: KkaItem) => {
        setSelectedItem(item);
        setRejectionInput('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = () => {
        if (!selectedItem) return;
        if (!rejectionInput.trim()) {
            toast.error('Gagal Menolak', { description: 'Harap berikan alasan penolakan revisi.' });
            return;
        }

        rejectKkaItem(selectedItem.id, rejectionInput);
        setIsRejectModalOpen(false);
        setSelectedItem(null);
    };

    // Cek apakah seluruh KKA untuk ST ini sudah tuntas direview (tidak ada DRAFT atau PENDING_REVIEW)
    const isAllProcessed = currentKkaItems.length > 0 && currentKkaItems.every(
        item => item.status === 'APPROVED' || item.status === 'REJECTED'
    );

    const pendingCount = currentKkaItems.filter(item => item.status === 'PENDING_REVIEW').length;

    return (
        <div className="space-y-6">
            {/* INSTRUCTION BAR */}
            <div className="border border-slate-200 bg-white p-4 rounded-none flex justify-between items-center gap-4">
                <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status Review KKA</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Tinjau argumentasi justifikasi auditor lapangan. Anda harus mengambil keputusan atas {currentKkaItems.length} temuan.
                    </p>
                </div>
                {pendingCount > 0 && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-none whitespace-nowrap">
                        {pendingCount} Butuh Review
                    </span>
                )}
            </div>

            {/* REVIEW TABLE */}
            <div className="border border-slate-200 bg-white rounded-none">
                {currentKkaItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-450 text-xs italic">
                        Belum ada temuan kertas kerja yang dimasukkan oleh Anggota Tim.
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="font-bold text-slate-700 text-xs">Rincian Temuan & Deviasi</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Justifikasi Anggota Tim</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs w-[220px]">Aksi Keputusan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentKkaItems.map((item) => {
                                const isMarkup = item.hargaSpj > item.hargaSsh;
                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="max-w-[280px]">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-800 text-xs leading-normal">{item.namaBarang}</p>
                                                <p className="text-[10px] font-mono text-slate-550 font-semibold">
                                                    SPJ: {formatRupiah(item.hargaSpj)} | SSH: {formatRupiah(item.hargaSsh)}
                                                </p>
                                                {isMarkup && (
                                                    <p className="text-[10px] text-red-600 font-bold">
                                                        Indikasi Mark-up: +{formatRupiah(item.selisih)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-700 leading-relaxed font-sans font-medium max-w-[280px] whitespace-normal break-words">
                                             {item.justifikasi ? (
                                                 <div className="flex items-start gap-1">
                                                     <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                     <span>{item.justifikasi}</span>
                                                 </div>
                                             ) : (
                                                 <span className="text-slate-400 italic text-[11px]">Belum diisi oleh anggota</span>
                                             )}
                                         </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border rounded-none ${
                                                item.status === 'APPROVED'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : item.status === 'REJECTED'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : item.status === 'PENDING_REVIEW'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                         <TableCell className="text-right">
                                             <div className="flex justify-end items-center gap-2">
                                                 {item.status === 'PENDING_REVIEW' ? (
                                                     <>
                                                         <Button
                                                             onClick={() => handleRejectClick(item)}
                                                             variant="outline"
                                                             className="h-8 rounded-none border-red-200 text-red-600 hover:bg-red-55/40 hover:text-red-700 text-xs font-bold shadow-none"
                                                         >
                                                             Tolak
                                                         </Button>
                                                         <Button
                                                             onClick={() => approveKkaItem(item.id)}
                                                             className="h-8 rounded-none bg-green-600 hover:bg-green-700 text-xs font-bold text-white shadow-none"
                                                         >
                                                             Setujui
                                                         </Button>
                                                     </>
                                                 ) : item.status === 'APPROVED' ? (
                                                     <div className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-bold">
                                                         <Check className="w-3.5 h-3.5 text-green-600" />
                                                         Disetujui
                                                     </div>
                                                 ) : (
                                                     <div className="flex flex-col items-end gap-1.5">
                                                         <div className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold">
                                                             <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                             Ditolak
                                                         </div>
                                                         <p className="text-[10px] text-slate-550 font-bold italic max-w-[180px] truncate" title={item.rejectionReason}>
                                                             Revisi: &quot;{item.rejectionReason}&quot;
                                                         </p>
                                                     </div>
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

            {/* FLOW SUCCESS CARD (LANJUTKAN KE NHP) */}
            {isAllProcessed && (
                <div className="border border-green-600 bg-green-50/20 p-5 rounded-none space-y-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-green-800 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            Kertas Kerja Audit Tuntas Dikaji
                        </h4>
                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                            Seluruh berkas temuan SPJ anomali telah diproses oleh Ketua Tim. Silakan lanjutkan untuk memformulasikan draf NHP.
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            toast.success('Navigasi Tahap 5', { description: 'Penyusunan NHP (Naskah Hasil Pemeriksaan) akan diaktifkan di tahap selanjutnya.' });
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-xs rounded-none font-bold shadow-none flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                        Lanjutkan ke Penyusunan NHP
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* REJECTION REASON MODAL */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-none border border-slate-200 shadow-none">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-sm font-bold text-slate-800">Catatan Penolakan Temuan</DialogTitle>
                        <DialogDescription className="text-xs text-slate-400 mt-1">
                            Berikan koreksi agar dapat diperbaiki oleh auditor pelaksana (anggota tim).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3">
                        <textarea
                            value={rejectionInput}
                            onChange={(e) => setRejectionInput(e.target.value)}
                            placeholder="Contoh: Lampirkan bukti kuitansi pembanding atau minta penelusuran lebih lanjut..."
                            className="w-full h-24 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400"
                        />
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            className="rounded-none border-slate-200 text-xs shadow-none"
                            onClick={() => {
                                setIsRejectModalOpen(false);
                                setRejectionInput('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleRejectSubmit}
                            className="bg-red-600 hover:bg-red-700 rounded-none text-xs shadow-none"
                        >
                            Kirim Alasan Penolakan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
