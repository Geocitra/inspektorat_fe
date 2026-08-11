// src/features/planning/components/AiGenerator.tsx
'use client';

import { usePkptStore } from '@/store/usePkptStore';
import { Sparkles, RefreshCw, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AiGeneratorProps {
    isKasubag: boolean;
    onSubmitSuccess: () => void;
}

export default function AiGenerator({ isKasubag, onSubmitSuccess }: AiGeneratorProps) {
    const { 
        draftAgendas, status, rejectionReason, isGenerating, logs,
        generateAiPkpt, updateAgenda, submitToInspektur 
    } = usePkptStore();

    return (
        <div className="space-y-6">
            {/* REJECTION OR DRAFT LOCK BANNER */}
            {rejectionReason && status === 'DRAFT' && (
                <div className="border border-red-200 bg-red-50/50 p-4 rounded-none flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-red-800">Usulan PKPT Ditolak & Perlu Revisi</h4>
                        <p className="text-red-700 text-xs mt-1 font-semibold leading-relaxed">
                            Catatan Revisi: &quot;{rejectionReason}&quot;
                        </p>
                    </div>
                </div>
            )}

            {status !== 'DRAFT' && (
                <div className="border border-amber-200 bg-amber-50/30 p-4 rounded-none flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-800">Draf Dikunci</h4>
                        <p className="text-slate-500 text-xs mt-1">
                            Dokumen sedang diajukan atau sudah diterbitkan. Untuk merombak usulan, Inspektur harus menolak berkas terlebih dahulu agar kembali ke status DRAFT.
                        </p>
                    </div>
                </div>
            )}

            {/* MAIN GENERATOR VIEW */}
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Workspace AI PKPT</h3>
                        <p className="text-slate-400 text-[11px] mt-0.5">Penyusunan draf audit daerah berbasis AI RAG.</p>
                    </div>
                    
                    {status === 'DRAFT' && (
                        isKasubag ? (
                            <Button
                                onClick={generateAiPkpt}
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none shadow-none"
                            >
                                <Sparkles className="w-4 h-4 mr-1.5" />
                                {isGenerating ? 'AI Sedang Memproses...' : 'Generate Draf PKPT via AI'}
                            </Button>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Hanya Kasubag Perencanaan yang dapat men-generate draf AI</span>
                        )
                    )}
                </div>

                {/* TERMINAL CONSOLE LOGS */}
                {logs.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-emerald-400 rounded-none space-y-1 max-h-40 overflow-y-auto">
                        <p className="text-slate-500 text-[10px] border-b border-slate-900 pb-1 mb-2 uppercase font-bold tracking-widest flex items-center gap-1.5">
                            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            AI Engine Terminal Console
                        </p>
                        {logs.map((log, idx) => (
                            <p key={idx} className="leading-relaxed">
                                <span className="text-slate-600 font-bold">&gt;&gt;</span> {log}
                            </p>
                        ))}
                        {isGenerating && <span className="inline-block w-2 h-3 bg-emerald-400 animate-pulse"></span>}
                    </div>
                )}

                {/* AGENDA DRAFT TABLE */}
                {draftAgendas.length > 0 ? (
                    <div className="space-y-4">
                        <div className="border border-slate-200 rounded-none">
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                                        <TableHead className="font-bold text-slate-700 text-xs">Program Audit</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[220px]">Objek Pemeriksaan (OPD)</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[140px]">Alokasi Waktu</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[160px]">Anggaran Audit (Rp)</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs w-[100px]">Prioritas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draftAgendas.map((agenda) => (
                                        <TableRow key={agenda.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                            <TableCell className="p-2">
                                                <Input
                                                    value={agenda.namaAudit}
                                                    disabled={status !== 'DRAFT' || !isKasubag}
                                                    onChange={(e) => updateAgenda(agenda.id, { namaAudit: e.target.value })}
                                                    className="rounded-none border-0 hover:bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 h-8 disabled:bg-transparent disabled:opacity-100"
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 font-medium">
                                                {agenda.namaOpd}
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    value={agenda.alokasiWaktu}
                                                    disabled={status !== 'DRAFT' || !isKasubag}
                                                    onChange={(e) => updateAgenda(agenda.id, { alokasiWaktu: e.target.value })}
                                                    className="rounded-none border-0 hover:bg-slate-50 focus:bg-white text-xs font-mono focus:ring-1 focus:ring-blue-500 h-8 disabled:bg-transparent disabled:opacity-100"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    value={agenda.anggaran}
                                                    disabled={status !== 'DRAFT' || !isKasubag}
                                                    onChange={(e) => updateAgenda(agenda.id, { anggaran: Number(e.target.value) })}
                                                    className="rounded-none border-0 hover:bg-slate-50 focus:bg-white text-xs font-mono font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 h-8 disabled:bg-transparent disabled:opacity-100"
                                                />
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

                        {/* ACTION: SUBMIT TO INSPEKTUR */}
                        {status === 'DRAFT' && isKasubag && (
                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <Button
                                    onClick={() => {
                                        submitToInspektur();
                                        onSubmitSuccess();
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-xs rounded-none font-bold shadow-none"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Ajukan ke Inspektur
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-xs font-bold text-slate-700">Draf PKPT Belum Tersusun</h4>
                        <p className="text-slate-400 text-xs mt-1 max-w-xs">
                            {isKasubag 
                                ? 'Silakan jalankan generator AI untuk merancang program kerja berdasarkan parameter risiko OPD terdaftar.'
                                : 'Menunggu Kasubag Perencanaan menyusun draf program kerja.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
