// src/features/planning/components/AiGenerator.tsx
'use client';

import { useState } from 'react';
import { usePkptStore, AuditAgenda } from '@/store/usePkptStore';
import { 
    RefreshCw, AlertCircle, XCircle, CheckCircle2, Eye, 
    FileText, Shield, Users, Laptop, Printer, Car, 
    FileSpreadsheet, Wrench, ChevronDown, ChevronUp, Layers,
    Clock, Calendar, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AiGeneratorProps {
    isKasubag: boolean;
    onSubmitSuccess: () => void;
}

export default function AiGenerator({ isKasubag, onSubmitSuccess }: AiGeneratorProps) {
    const { 
        draftAgendas, status, rejectionReason, isParsingFile, logs,
        parsePkptFromFile, updateAgenda, submitToInspektur 
    } = usePkptStore();

    const [selectedAgenda, setSelectedAgenda] = useState<AuditAgenda | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const getSaranaIcon = (item: string) => {
        const lower = item.toLowerCase();
        if (lower.includes('laptop') || lower.includes('komputer')) return <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
        if (lower.includes('printer')) return <Printer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
        if (lower.includes('kendaraan') || lower.includes('mobil') || lower.includes('motor')) return <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
        if (lower.includes('kertas') || lower.includes('atk')) return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
        if (lower.includes('ukur') || lower.includes('alat')) return <Wrench className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
        return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    };

    return (
        <div className="space-y-6">
            {/* REJECTION OR DRAFT LOCK BANNER */}
            {rejectionReason && status === 'DRAF' && (
                <div className="border border-red-200 bg-red-50/50 p-4 rounded-none flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-red-800">Usulan PKPT Ditolak & Perlu Revisi</h4>
                        <p className="text-red-700 text-xs mt-1 font-semibold leading-relaxed">
                            Catatan Revisi: &quot;{rejectionReason}&quot;
                        </p>
                    </div>
                </div>
            )}

            {status !== 'DRAF' && (
                <div className="border border-amber-200 bg-amber-50/30 p-4 rounded-none flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-800">Draf Dikunci</h4>
                        <p className="text-slate-500 text-xs mt-1">
                            Dokumen sedang diajukan atau sudah disetujui. Untuk merombak usulan, Inspektur harus menolak berkas terlebih dahulu agar kembali ke status DRAFT.
                        </p>
                    </div>
                </div>
            )}

            {/* MAIN GENERATOR VIEW */}
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Draf Program Kerja Pengawasan Tahunan (PKPT)</h3>
                        <p className="text-slate-400 text-[11px] mt-0.5">Struktur 14 kolom resmi pengawasan berbasis risiko.</p>
                    </div>
                    
                    {status === 'DRAF' && (
                        isKasubag ? (
                            <div className="flex gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.pdf,.docx,.doc"
                                        className="hidden"
                                        id="pkpt-upload-input"
                                        onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                await parsePkptFromFile(e.target.files[0], 2026);
                                            }
                                        }}
                                        disabled={isParsingFile}
                                    />
                                    <Button
                                        onClick={() => document.getElementById('pkpt-upload-input')?.click()}
                                        disabled={isParsingFile}
                                        className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none shadow-none gap-1.5"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isParsingFile ? 'animate-spin' : ''}`} />
                                        {isParsingFile ? 'Mengekstraksi PKPT...' : 'Unggah & Ekstrak Berkas PKPT'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hanya Kasubag Perencanaan yang dapat mengelola draf PKPT</span>
                        )
                    )}
                </div>

                {/* TERMINAL CONSOLE LOGS */}
                {logs.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-emerald-400 rounded-none space-y-1 max-h-40 overflow-y-auto">
                        <p className="text-slate-500 text-[10px] border-b border-slate-900 pb-1 mb-2 uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <RefreshCw className={`w-3 h-3 ${isParsingFile ? 'animate-spin' : ''}`} />
                            AI Engine Terminal Console
                        </p>
                        {logs.map((log, idx) => (
                            <p key={idx} className="leading-relaxed">
                                <span className="text-slate-600 font-bold">&gt;&gt;</span> {log}
                            </p>
                        ))}
                        {isParsingFile && <span className="inline-block w-2 h-3 bg-emerald-400 animate-pulse"></span>}
                    </div>
                )}

                {/* AGENDA DRAFT TABLE (14 STANDAR KOLOM) */}
                {draftAgendas.length > 0 ? (
                    <div className="space-y-4">
                        <div className="border border-slate-200 rounded-none overflow-x-auto">
                            <Table className="border-collapse min-w-[900px]">
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
                                                    title="Lihat 14 Kolom Lengkap"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* ACTION: SUBMIT TO INSPEKTUR */}
                        {status === 'DRAF' && isKasubag && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-500">
                                    Total <strong className="text-slate-800">{draftAgendas.length} agenda pengawasan</strong> siap diajukan ke Inspektur.
                                </p>
                                <Button
                                    onClick={() => {
                                        submitToInspektur();
                                        onSubmitSuccess();
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-xs rounded-none font-bold shadow-none"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Ajukan Usulan ke Inspektur
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Belum Ada Draf PKPT Terdaftar</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                            Silakan unggah dokumen PKPT (Excel / PDF) milik daerah untuk mengekstrak seluruh agenda pengawasan secara otomatis.
                        </p>
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
        </div>
    );
}
