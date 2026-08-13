// src/features/planning/components/InspekturApproval.tsx
'use client';

import { useState } from 'react';
import { usePkptStore } from '@/store/usePkptStore';
import { 
    ShieldCheck, AlertCircle, XCircle, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface InspekturApprovalProps {
    isInspektur: boolean;
}

export default function InspekturApproval({ isInspektur }: InspekturApprovalProps) {
    const { 
        draftAgendas, status, tteHash, approveDraft, rejectDraft 
    } = usePkptStore();

    // UI Local States
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionInput, setRejectionInput] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [signingProgress, setSigningProgress] = useState(0);

    // Format Rupiah
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const totalAnggaran = draftAgendas.reduce((sum, item) => sum + item.anggaran, 0);
    const highRiskCount = draftAgendas.filter(item => item.prioritas === 'Tinggi').length;

    // Handle TTE Sign Simulation
    const handleSignTTE = async () => {
        setIsSigning(true);
        setSigningProgress(0);
        
        const interval = setInterval(() => {
            setSigningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        await approveDraft('Inspektur Utama');
        
        setTimeout(() => {
            setIsSigning(false);
        }, 2000);
    };

    // Handle Rejection Submit
    const handleRejectSubmit = () => {
        if (!rejectionInput.trim()) {
            toast.error('Gagal Menolak', { description: 'Alasan penolakan harus diisi.' });
            return;
        }
        rejectDraft(rejectionInput);
        setIsRejectionModalOpen(false);
        setRejectionInput('');
    };

    return (
        <div className="space-y-6">
            {/* STATS SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-slate-200 bg-white rounded-none divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-none">
                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Usulan Audit</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{draftAgendas.length} Objek Kerja</p>
                    <p className="text-[10px] text-slate-500">Sesuai draf AI</p>
                </div>
                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioritas Risiko Tinggi</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{highRiskCount} OPD High Risk</p>
                    <p className="text-[10px] text-slate-500">Kategori NTR Tinggi</p>
                </div>
                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akumulasi Anggaran</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(totalAnggaran)}</p>
                    <p className="text-[10px] text-slate-500">Total usulan operasional</p>
                </div>
            </div>

            {/* LEMBAR KEPUTUSAN */}
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Lembar Keputusan Pimpinan
                </h3>

                {draftAgendas.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                        Belum ada draf usulan yang dibuat oleh Kasubag Perencanaan.
                    </div>
                )}

                {draftAgendas.length > 0 && status === 'DRAF' && (
                    <div className="border border-slate-200 bg-slate-50 p-4 text-center rounded-none space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-700">Menunggu Pengajuan Draf</h4>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                            Draf program kerja sedang dirumuskan oleh Kasubag Perencanaan. Dokumen belum diajukan ke meja pimpinan.
                        </p>
                    </div>
                )}

                 {/* PENDING APPROVAL VIEW */}
                {status === 'MENUNGGU_PERSETUJUAN' && (
                    <div className="space-y-4">
                        <div className="border border-amber-200 bg-amber-50/20 p-4 rounded-none flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-amber-800">Menunggu Pengesahan Dokumen</h4>
                                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                                    Draf PKPT telah diajukan. Tinjau dokumen secara menyeluruh. Sebagai Inspektur, Anda dapat membubuhkan **Tanda Tangan Elektronik (TTE)** untuk mensahkan or **Menolak** draf jika diperlukan revisi anggaran.
                                </p>
                            </div>
                        </div>

                        {isInspektur ? (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsRejectionModalOpen(true)}
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50 rounded-none text-xs font-bold shadow-none"
                                >
                                    <XCircle className="w-4 h-4 mr-1.5" />
                                    Tolak & Minta Revisi
                                </Button>
                                <Button
                                    onClick={handleSignTTE}
                                    disabled={isSigning}
                                    className="bg-green-600 hover:bg-green-700 rounded-none text-xs font-bold shadow-none"
                                >
                                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                                    Sahkan & Bubuhi TTE
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 p-3 text-center text-xs text-slate-500 italic rounded-none leading-relaxed">
                                Status: **MENUNGGU PERSETUJUAN INSPEKTUR**. Aksi persetujuan hanya dapat dilakukan oleh akun dengan peran pimpinan (Inspektur).
                            </div>
                        )}
                    </div>
                )}

                {/* SIGNING PROCESSING */}
                {isSigning && (
                    <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-none space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                            <span className="flex items-center gap-1.5">
                                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                Membubuhkan Tanda Tangan Elektronik (TTE) Daerah...
                            </span>
                            <span>{signingProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 border border-slate-200 rounded-none overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 transition-all duration-300 rounded-none"
                                style={{ width: `${signingProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* SECURE SIGNATURE HASH */}
                {status === 'DISETUJUI' && tteHash && (
                    <div className="border-2 border-emerald-600 bg-emerald-50/30 p-5 rounded-none text-slate-800 space-y-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Dokumen PKPT Sah & Bersertifikat Digital
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Dokumen telah terkunci secara kriptografis dan ditandatangani secara elektronik oleh:
                            </p>
                            <p className="text-xs font-bold text-slate-800 mt-1">
                                Inspektur Utama Daerah &bull; Kantor Inspektorat Daerah
                            </p>
                        </div>
                        <div className="p-3 bg-white border border-emerald-200 text-center font-mono text-[10px] text-emerald-700 w-full sm:w-auto">
                            <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest">TTE Secure Hash</p>
                            <p className="font-bold text-xs mt-1 select-all">{tteHash}</p>
                        </div>
                    </div>
                )}

                {/* READ-ONLY TABLES FOR REVIEW */}
                {draftAgendas.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-700">Daftar Usulan Audit Terlampir:</h4>
                        <div className="border border-slate-200 rounded-none">
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="font-bold text-slate-700 text-xs">Program Audit</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Objek OPD</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[140px]">Alokasi Waktu</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[160px]">Anggaran Audit</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[100px]">Prioritas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftAgendas.map((agenda) => (
                                        <TableRow key={agenda.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                            <TableCell className="text-xs font-bold text-slate-800">{agenda.namaAudit}</TableCell>
                                            <TableCell className="text-xs text-slate-600 font-medium">{agenda.namaOpd}</TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600">{agenda.alokasiWaktu}</TableCell>
                                            <TableCell className="text-xs font-mono font-semibold text-slate-700">
                                                {formatRupiah(agenda.anggaran)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 border rounded-none ${
                                                    agenda.prioritas === 'Tinggi'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : agenda.prioritas === 'Sedang'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {agenda.prioritas}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            {/* REJECTION MODAL */}
            <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-none border border-slate-200 shadow-none">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-sm font-bold text-slate-800">Catatan Revisi PKPT</DialogTitle>
                        <DialogDescription className="text-xs text-slate-400 mt-1">
                            Berikan alasan penolakan agar dapat dikoreksi oleh Kasubag Perencanaan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3">
                        <textarea
                            value={rejectionInput}
                            onChange={(e) => setRejectionInput(e.target.value)}
                            placeholder="Tulis instruksi revisi di sini..."
                            className="w-full h-24 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400"
                        />
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            className="rounded-none border-slate-200 text-xs shadow-none"
                            onClick={() => {
                                setIsRejectionModalOpen(false);
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
