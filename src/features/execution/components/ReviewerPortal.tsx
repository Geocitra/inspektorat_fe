import { useState } from 'react';
import { useKkaStore, KkaItem } from '@/store/useKkaStore';
import { useReportStore } from '@/store/useReportStore';
import { 
    CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, MessageSquare, ShieldCheck, Check, RotateCcw, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
            toast.error('Gagal Menolak', { description: 'Harap berikan alasan penolakan atau catatan revisi.' });
            return;
        }

        rejectKkaItem(selectedItem.id, rejectionInput);
        setIsRejectModalOpen(false);
        setSelectedItem(null);
    };

    // Seluruh KKA dianggap selesai direviu jika semuanya APPROVED atau REJECTED
    const isAllProcessed = currentKkaItems.length > 0 && currentKkaItems.every(
        item => item.status === 'APPROVED' || item.status === 'REJECTED'
    );

    const pendingCount = currentKkaItems.filter(
        item => item.status === 'PENDING_REVIEW' || item.status === 'DRAFT'
    ).length;

    const approvedItems = currentKkaItems.filter(item => item.status === 'APPROVED');
    const totalKerugian = approvedItems.reduce((acc, item) => acc + (item.selisih || 0), 0);

    return (
        <div className="space-y-6">
            {/* INSTRUCTION BAR */}
            <div className="border border-slate-200 bg-white p-4 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Sidang Keputusan Reviu KKA &amp; Penetapan Temuan NHP
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Tinjau argumentasi dan hasil deteksi AI. Tentukan apakah temuan disetujui masuk ke Naskah Hasil Pengawasan (NHP).
                    </p>
                </div>
                {pendingCount > 0 ? (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-none whitespace-nowrap">
                        {pendingCount} Temuan Perlu Keputusan
                    </span>
                ) : (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-none whitespace-nowrap flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Semua Temuan Telah Diputuskan
                    </span>
                )}
            </div>

            {/* REVIEW TABLE WITH STRICT FIXED LAYOUT */}
            <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
                {currentKkaItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                        Belum ada temuan kertas kerja yang dimasukkan untuk Surat Tugas ini.
                    </div>
                ) : (
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                            <col style={{ width: '38%' }} />
                            <col style={{ width: '34%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '16%' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                <th className="font-bold text-slate-700 text-xs py-3 px-4">Rincian Temuan &amp; Deviasi</th>
                                <th className="font-bold text-slate-700 text-xs py-3 px-4">Justifikasi Anggota Tim</th>
                                <th className="font-bold text-slate-700 text-xs py-3 px-2 text-center">Status</th>
                                <th className="text-right font-bold text-slate-700 text-xs py-3 px-4">Aksi Keputusan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {currentKkaItems.map((item) => {
                                const isMarkup = item.hargaSpj > item.hargaSsh;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        {/* KOLOM 1: RINCIAN TEMUAN */}
                                        <td className="py-3 px-4 align-top overflow-hidden">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 text-xs leading-snug break-words">
                                                    {item.namaBarang}
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-500 font-semibold">
                                                    SPJ: {formatRupiah(item.hargaSpj)} | SSH: {formatRupiah(item.hargaSsh)}
                                                </p>
                                                {isMarkup ? (
                                                    <p className="text-[10px] text-red-600 font-bold">
                                                        Indikasi Mark-up: +{formatRupiah(item.selisih)}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-emerald-600 font-semibold">
                                                        Sesuai Standar Batas Harga
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* KOLOM 2: JUSTIFIKASI ANGGOTA TIM */}
                                        <td className="py-3 px-4 align-top overflow-hidden">
                                            {item.justifikasi ? (
                                                <div className="flex items-start gap-2 bg-slate-50 p-2.5 border border-slate-200 text-slate-800 break-words">
                                                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                                                    <span className="text-[11px] leading-relaxed break-words">
                                                        {item.justifikasi}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="p-2 border border-dashed border-slate-200 bg-slate-50/50 text-[11px] text-slate-400 italic">
                                                    Belum diisi keterangan klarifikasi lapangan
                                                </div>
                                            )}
                                        </td>

                                        {/* KOLOM 3: STATUS BADGE */}
                                        <td className="py-3 px-2 align-top text-center overflow-hidden">
                                            <span className={`inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-0.5 border ${
                                                item.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : item.status === 'REJECTED'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : item.status === 'PENDING_REVIEW'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {item.status === 'APPROVED' 
                                                    ? 'DISETUJUI' 
                                                    : item.status === 'REJECTED' 
                                                    ? 'DITOLAK' 
                                                    : item.status === 'PENDING_REVIEW'
                                                    ? 'BUTUH REVIU'
                                                    : 'DRAF KKA'}
                                            </span>
                                        </td>

                                        {/* KOLOM 4: TOMBOL KEPUTUSAN KETUA TIM */}
                                        <td className="py-3 px-4 align-top text-right overflow-hidden">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {item.status === 'PENDING_REVIEW' || item.status === 'DRAFT' ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            onClick={() => handleRejectClick(item)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2.5 rounded-none border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold shadow-none cursor-pointer"
                                                            title="Tolak temuan ini (tidak dimasukkan ke NHP)"
                                                        >
                                                            Tolak
                                                        </Button>
                                                        <Button
                                                            onClick={() => approveKkaItem(item.id)}
                                                            size="sm"
                                                            className="h-7 px-3 rounded-none bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-none cursor-pointer"
                                                            title="Setujui temuan ini masuk ke NHP"
                                                        >
                                                            Setujui
                                                        </Button>
                                                    </div>
                                                ) : item.status === 'APPROVED' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            Disetujui
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRejectClick(item)}
                                                            className="text-[10px] text-slate-400 hover:text-slate-600 underline flex items-center gap-0.5"
                                                            title="Ubah keputusan"
                                                        >
                                                            <RotateCcw className="w-2.5 h-2.5" /> Ubah
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-bold">
                                                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                                Ditolak
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => approveKkaItem(item.id)}
                                                                className="text-[10px] text-slate-400 hover:text-slate-600 underline flex items-center gap-0.5"
                                                                title="Ubah keputusan"
                                                            >
                                                                <RotateCcw className="w-2.5 h-2.5" /> Ubah
                                                            </button>
                                                        </div>
                                                        {item.rejectionReason && (
                                                            <p className="text-[10px] text-slate-500 italic max-w-[160px] truncate" title={item.rejectionReason}>
                                                                Alasan: &quot;{item.rejectionReason}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* KARTU PENERBITAN DRAF NHP RESMI */}
            {isAllProcessed && (
                <div className="border border-emerald-600 bg-emerald-50/30 p-5 rounded-none space-y-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            Seluruh Keputusan Temuan Telah Tuntas
                        </h4>
                        <p className="text-xs text-slate-600 max-w-xl">
                            Sebanyak <strong>{approvedItems.length} Temuan</strong> telah disetujui dengan total indikasi kerugian/pemborosan sebesar <strong className="text-red-600">{formatRupiah(totalKerugian)}</strong>.
                        </p>
                    </div>

                    <Button
                        onClick={async () => {
                            const { generateNhpAi, nhpList } = useReportStore.getState();
                            const existingNhp = nhpList.find(n => n.stId === stId);
                            if (!existingNhp) {
                                await generateNhpAi(stId, approvedItems.length);
                            }
                            toast.success('Draf NHP Resmi Berhasil Diterbitkan', {
                                description: 'Mengarahkan ke Workspace Penyusunan NHP & Tanggapan OPD...'
                            });
                            window.location.href = `/pelaporan/nhp/${stId}?role=auditor&type=ketua`;
                        }}
                        className="rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Terbitkan &amp; Buka NHP (Naskah Hasil Pengawasan) ➔</span>
                    </Button>
                </div>
            )}

            {/* MODAL PENOLAKAN KKA */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="sm:max-w-md rounded-none border border-slate-300">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Tolak Temuan KKA (Keluarkan dari NHP)
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Berikan catatan alasan mengapa temuan ini ditolak atau tidak dimasukkan ke dalam naskah dinas resmi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <div className="bg-slate-50 p-2.5 border border-slate-200 text-xs">
                            <p className="font-bold text-slate-800">{selectedItem?.namaBarang}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Nilai SPJ: {selectedItem ? formatRupiah(selectedItem.hargaSpj) : 0}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Alasan Penolakan / Keterangan Revisi:</label>
                            <textarea
                                value={rejectionInput}
                                onChange={(e) => setRejectionInput(e.target.value)}
                                placeholder="Contoh: Bukti pendukung telah dipenuhi oleh dinas / bukan termasuk objek temuan..."
                                className="w-full h-24 p-2.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-600 rounded-none resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRejectModalOpen(false)}
                            className="rounded-none text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleRejectSubmit}
                            className="rounded-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            Konfirmasi Tolak Temuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
