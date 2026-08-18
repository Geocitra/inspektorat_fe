// src/features/planning/components/InspekturApproval.tsx
'use client';

import { useState } from 'react';
import { usePkptStore, AuditAgenda } from '@/store/usePkptStore';
import { 
    ShieldCheck, AlertCircle, XCircle, RefreshCw, Eye, 
    Layers, Users, Shield, Laptop, Printer, Car, FileSpreadsheet, 
    Wrench, FileText, CheckCircle2, Clock
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
    const [selectedAgenda, setSelectedAgenda] = useState<AuditAgenda | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const highRiskCount = draftAgendas.filter(item => item.prioritas === 'Tinggi').length;
    const totalHpKeseluruhan = draftAgendas.reduce((sum, item) => sum + (item.hariPemeriksaan?.totalHp || 50), 0);

    const getSaranaIcon = (item: string) => {
        const lower = item.toLowerCase();
        if (lower.includes('laptop') || lower.includes('komputer')) return <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
        if (lower.includes('printer')) return <Printer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
        if (lower.includes('kendaraan') || lower.includes('mobil') || lower.includes('motor')) return <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
        if (lower.includes('kertas') || lower.includes('atk')) return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
        if (lower.includes('ukur') || lower.includes('alat')) return <Wrench className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
        return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    };

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
                    <p className="text-[10px] text-slate-500">14 Kolom Standar Pengawasan</p>
                </div>
                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioritas Risiko Tinggi</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{highRiskCount} OPD High Risk</p>
                    <p className="text-[10px] text-slate-500">Kategori NTR Tertinggi</p>
                </div>
                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akumulasi Beban Kerja Tim</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{totalHpKeseluruhan} Hari Pemeriksaan</p>
                    <p className="text-[10px] text-slate-500">Total Hari Pemeriksaan (JUM HP)</p>
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
                                    Draf PKPT telah diajukan. Tinjau dokumen secara menyeluruh. Sebagai Inspektur, Anda dapat membubuhkan <strong>Tanda Tangan Elektronik (TTE)</strong> untuk mensahkan atau <strong>Menolak</strong> draf jika diperlukan revisi alokasi waktu/fokus pengawasan.
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
                                Status: <strong>MENUNGGU PERSETUJUAN INSPEKTUR</strong>. Aksi persetujuan hanya dapat dilakukan oleh akun dengan peran pimpinan (Inspektur).
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

                {/* READ-ONLY 14 KOLOM TABLE FOR REVIEW */}
                {draftAgendas.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-700">Daftar Usulan Pengawasan Terlampir:</h4>
                        <div className="border border-slate-200 rounded-none overflow-x-auto">
                            <Table className="border-collapse min-w-[850px]">
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="font-bold text-slate-700 text-xs w-12 text-center">No</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs min-w-[220px]">Area Pengawasan & Objek (OPD)</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs min-w-[180px]">Jenis Pengawasan</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-28">Pelaksana</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-24 text-center">Jadwal</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-28 text-center">Total HP</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-24 text-center">Risiko</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-20 text-center">Rincian</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftAgendas.map((agenda, index) => (
                                        <TableRow key={agenda.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                            <TableCell className="font-mono text-xs text-slate-400 text-center font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-xs leading-snug">
                                                        {agenda.areaPengawasan || agenda.namaAudit}
                                                    </p>
                                                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                                                        <Shield className="w-3 h-3 text-blue-500" />
                                                        {agenda.namaOpd}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <span className="text-xs text-slate-700 font-medium">
                                                    {agenda.jenisPengawasan}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200 inline-block">
                                                    {agenda.pelaksana || 'Irban 1'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-3 text-center">
                                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block">
                                                    {agenda.jadwal || 'TW I'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-3 text-center font-mono text-xs font-bold text-slate-800">
                                                {agenda.hariPemeriksaan?.totalHp || 50} HP
                                            </TableCell>
                                            <TableCell className="text-center p-3">
                                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 border rounded-none ${
                                                    agenda.prioritas === 'Tinggi'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : agenda.prioritas === 'Sedang'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {agenda.prioritas}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAgenda(agenda);
                                                        setIsDetailOpen(true);
                                                    }}
                                                    className="h-7 w-7 p-0 rounded-none border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-500"
                                                    title="Lihat Rincian 14 Kolom"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DETAIL 14 KOLOM LENGKAP */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl rounded-none p-0 overflow-hidden border-slate-300">
                    <DialogHeader className="bg-slate-900 text-white p-4">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            Rincian Standar 14 Kolom Agenda Pengawasan
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAgenda && (
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700 divide-y divide-slate-100">
                            {/* Header Overview */}
                            <div className="space-y-1 pb-3">
                                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                                    {selectedAgenda.pelaksana || 'Irban 1'} • {selectedAgenda.jadwal || 'TW I'}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 mt-1.5">{selectedAgenda.areaPengawasan}</h4>
                                <p className="text-slate-500 font-medium">Perangkat Daerah: <strong className="text-slate-800">{selectedAgenda.namaOpd}</strong></p>
                            </div>

                            {/* Jenis & Ruang Lingkup */}
                            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Pengawasan</p>
                                    <p className="font-semibold text-slate-800 mt-0.5">{selectedAgenda.jenisPengawasan}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruang Lingkup</p>
                                    <p className="font-semibold text-slate-800 mt-0.5">{selectedAgenda.ruangLingkup || 'Semua Belanja Kegiatan'}</p>
                                </div>
                            </div>

                            {/* Tujuan dan Sasaran */}
                            <div className="pt-3 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    Tujuan & Sasaran Pemeriksaan
                                </p>
                                <div className="bg-slate-50 p-3 border border-slate-200 font-sans text-slate-700 whitespace-pre-line leading-relaxed">
                                    {selectedAgenda.tujuanSasaran || 'Pemeriksaan kepatuhan dan akuntabilitas pelaksanaan program kerja.'}
                                </div>
                            </div>

                            {/* Matriks Hari Pemeriksaan (HP) */}
                            <div className="pt-3 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    Matriks Alokasi Hari Pemeriksaan (HP Tim)
                                </p>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                                    <div className="bg-slate-50 border border-slate-200 p-2">
                                        <p className="text-[10px] text-slate-400 font-bold">PJ</p>
                                        <p className="text-sm font-mono font-bold text-slate-800">{selectedAgenda.hariPemeriksaan?.pj || 1}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-2">
                                        <p className="text-[10px] text-slate-400 font-bold">WK PJ</p>
                                        <p className="text-sm font-mono font-bold text-slate-800">{selectedAgenda.hariPemeriksaan?.wkpj || 1}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-2">
                                        <p className="text-[10px] text-slate-400 font-bold">Dalnis</p>
                                        <p className="text-sm font-mono font-bold text-slate-800">{selectedAgenda.hariPemeriksaan?.dalnis || 10}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-2">
                                        <p className="text-[10px] text-slate-400 font-bold">Ketua Tim</p>
                                        <p className="text-sm font-mono font-bold text-slate-800">{selectedAgenda.hariPemeriksaan?.kt || 15}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-2">
                                        <p className="text-[10px] text-slate-400 font-bold">Anggota</p>
                                        <p className="text-sm font-mono font-bold text-slate-800">{selectedAgenda.hariPemeriksaan?.at || 30}</p>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 p-2">
                                        <p className="text-[10px] text-blue-600 font-bold">Total HP</p>
                                        <p className="text-sm font-mono font-bold text-blue-800">{selectedAgenda.hariPemeriksaan?.totalHp || 57}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sarana & Prasarana + Jumlah Laporan */}
                            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sarana dan Prasarana</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedAgenda.saranaPrasarana && selectedAgenda.saranaPrasarana.length > 0 ? (
                                            selectedAgenda.saranaPrasarana.map((item, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200 font-medium">
                                                    {getSaranaIcon(item)}
                                                    {item}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic">Laptop, Printer, ATK</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Laporan (JUM LAP)</p>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedAgenda.jumlahLaporan || 1} Laporan Hasil Audit</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Tingkat Risiko: <strong className="text-slate-700">{selectedAgenda.prioritas}</strong></p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
