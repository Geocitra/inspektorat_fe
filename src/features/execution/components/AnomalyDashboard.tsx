// src/features/execution/components/AnomalyDashboard.tsx
'use client';

import { useState } from 'react';
import { useKkaStore, KkaItem } from '@/store/useKkaStore';
import { 
    AlertTriangle, Brain, FileText, CheckCircle2, XCircle, ArrowRight, HelpCircle 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AnomalyDashboardProps {
    stId: string;
}

export default function AnomalyDashboard({ stId }: AnomalyDashboardProps) {
    const { kkaList, saveJustification } = useKkaStore();
    const [selectedItem, setSelectedItem] = useState<KkaItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [justifikasiInput, setJustifikasiInput] = useState('');

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

    const handleOpenAnalysis = (item: KkaItem) => {
        setSelectedItem(item);
        setJustifikasiInput(item.justifikasi || '');
        setIsModalOpen(true);
    };

    const handleSaveJustification = () => {
        if (!selectedItem) return;
        if (!justifikasiInput.trim()) {
            toast.error('Justifikasi Wajib Diisi', { description: 'Harap berikan keterangan justifikasi logis pemeriksaan Anda.' });
            return;
        }

        saveJustification(selectedItem.id, justifikasiInput);
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-800">Kertas Kerja Audit (KKA) & Anomaly Tracker</h3>
                <p className="text-slate-500 text-xs mt-1">Cross-match data SPJ belanja dengan acuan SSH daerah Kota Surabaya menggunakan AI Engine.</p>
            </div>

            {currentKkaItems.length === 0 ? (
                <div className="border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center rounded-none">
                    <AlertTriangle className="w-10 h-10 text-slate-300 mb-2" />
                    <h4 className="text-xs font-bold text-slate-700">Belum Ada Data SPJ</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm leading-relaxed">
                        Kertas Kerja Audit masih kosong. Silakan unggah berkas Excel SPJ terlebih dahulu untuk menjalankan deteksi.
                    </p>
                </div>
            ) : (
                <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
                    {/* Sticky Header Scroll Container */}
                    <div className="max-h-[350px] overflow-y-auto">
                        <Table className="border-collapse table-fixed w-full">
                            <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-slate-700 text-xs w-[50px]">No</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[240px]">Rincian Barang Realisasi</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-right w-[130px]">Harga SPJ</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-right w-[130px]">Harga SSH</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-right w-[135px]">Selisih (Markup)</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Status KKA</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 text-xs w-[120px]">Tindakan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentKkaItems.map((item, index) => {
                                    const isMarkup = item.hargaSpj > item.hargaSsh;
                                    return (
                                        <TableRow 
                                            key={item.id} 
                                            className={`border-b border-slate-200 last:border-0 hover:bg-slate-50/30 transition-all ${
                                                isMarkup 
                                                    ? 'bg-red-50/50 hover:bg-red-50/70 text-red-955' 
                                                    : 'hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <TableCell className="font-mono text-[11px] text-slate-400">{index + 1}</TableCell>
                                            <TableCell className="font-semibold text-slate-800 text-xs truncate" title={item.namaBarang}>
                                                {item.namaBarang}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold text-slate-750">
                                                {formatRupiah(item.hargaSpj)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-slate-500">
                                                {formatRupiah(item.hargaSsh)}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-xs font-bold ${isMarkup ? 'text-red-600' : 'text-slate-400'}`}>
                                                {isMarkup ? `+${formatRupiah(item.selisih)}` : '0'}
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
                                                    {item.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                    {item.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-500" />}
                                                    {item.status === 'PENDING_REVIEW' && <ClockPlaceholderIcon />}
                                                    {item.status.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => handleOpenAnalysis(item)}
                                                    variant="outline"
                                                    className={`h-7 px-2.5 text-[10px] rounded-none shadow-none font-bold ${
                                                        isMarkup 
                                                            ? 'border-red-200 text-red-700 hover:bg-red-100/50 bg-white' 
                                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {isMarkup ? (
                                                        <span className="flex items-center gap-1">
                                                            <Brain className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                                            Analisis AI
                                                        </span>
                                                    ) : (
                                                        'Kaji Ulang'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* AI ANALYSIS & JUSTIFICATION DIALOG */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-none border border-slate-200 shadow-none p-5">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                            AI Anomaly & Deskripsi Fisik
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400 mt-1">
                            Hasil pemindaian spesifikasi audit oleh AI RAG.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-4 py-2">
                            {/* Comparison block */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 border border-slate-150 rounded-none">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Harga SPJ (Kuitansi)</p>
                                    <p className="font-bold text-red-600 mt-0.5">{formatRupiah(selectedItem.hargaSpj)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Harga Standard SSH</p>
                                    <p className="font-bold text-slate-800 mt-0.5">{formatRupiah(selectedItem.hargaSsh)}</p>
                                </div>
                            </div>

                            {/* AI Narrative */}
                            <div className="space-y-1 bg-blue-50/30 border border-blue-100 p-3 rounded-none">
                                <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                                    <Brain className="w-3.5 h-3.5 text-blue-600" />
                                    Temuan AI RAG:
                                </h4>
                                <p className="text-slate-700 text-xs leading-relaxed italic mt-1 font-sans">
                                    &quot;{selectedItem.aiNarasi}&quot;
                                </p>
                            </div>

                            {/* Rejection Alert Box */}
                            {selectedItem.status === 'REJECTED' && selectedItem.rejectionReason && (
                                <div className="border border-red-200 bg-red-50/50 p-3 rounded-none flex items-start gap-2">
                                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-red-800">Ditolak oleh Ketua Tim</p>
                                        <p className="text-red-700 text-xs mt-0.5 leading-relaxed font-semibold">
                                            Catatan: &quot;{selectedItem.rejectionReason}&quot;
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Justification Textarea Form */}
                            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                <label htmlFor="justifikasi" className="text-xs font-bold text-slate-700">Justifikasi Pemeriksa Auditor:</label>
                                <textarea
                                    id="justifikasi"
                                    value={justifikasiInput}
                                    onChange={(e) => setJustifikasiInput(e.target.value)}
                                    disabled={selectedItem.status === 'APPROVED' || selectedItem.status === 'PENDING_REVIEW'}
                                    placeholder="Tulis alasan justifikasi auditor terkait selisih harga ini..."
                                    className="w-full h-20 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                                {(selectedItem.status === 'APPROVED' || selectedItem.status === 'PENDING_REVIEW') && (
                                    <p className="text-[10px] text-slate-400 italic">Justifikasi dikunci karena temuan sudah diserahkan/disetujui.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            className="rounded-none border-slate-200 text-xs shadow-none"
                            onClick={() => {
                                setIsModalOpen(false);
                                setSelectedItem(null);
                            }}
                        >
                            Tutup
                        </Button>
                        {selectedItem && selectedItem.status !== 'APPROVED' && selectedItem.status !== 'PENDING_REVIEW' && (
                            <Button
                                onClick={handleSaveJustification}
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs shadow-none font-bold"
                            >
                                Simpan ke KKA
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component clock placeholder icon
function ClockPlaceholderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-amber-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
