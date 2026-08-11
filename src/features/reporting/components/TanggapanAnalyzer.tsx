// src/features/reporting/components/TanggapanAnalyzer.tsx
'use client';

import { useReportStore } from '@/store/useReportStore';
import { useStStore } from '@/store/useStStore';
import { useState } from 'react';
import { 
    Brain, FileText, Sparkles, CheckCircle2, XCircle, ArrowRight, Info, BookOpen, Download 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TanggapanAnalyzerProps {
    stId: string;
}

export default function TanggapanAnalyzer({ stId }: TanggapanAnalyzerProps) {
    const { nhpList, tanggapanList, aiFeedbackList, analyzeTanggapanAi, createLhpDraft, isAnalyzingTanggapan } = useReportStore();
    const { stList } = useStStore();
    const router = useRouter();

    const st = stList.find(s => s.id === stId);
    const nhp = nhpList.find(n => n.stId === stId);
    const tanggapan = tanggapanList.find(t => t.stId === stId);
    const feedback = aiFeedbackList.find(f => f.stId === stId);

    const handleAnalyze = async () => {
        await analyzeTanggapanAi(stId);
    };

    const handleCreateLhp = () => {
        createLhpDraft(stId);
        // Arahkan ke rute LHP
        router.push(`/pelaporan/lhp/${stId}?role=inspektur`);
    };

    if (!st || !nhp) return <div className="text-center py-12 text-slate-500">Data Laporan NHP tidak ditemukan.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* STEPPER PROGRESS */}
            <div className="border border-slate-200 bg-white p-5 rounded-none flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur Pelaporan:</div>
                </div>
                <div className="flex items-center gap-8 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="w-5 h-5 flex items-center justify-center border border-green-600 text-[10px] bg-green-600 text-white rounded-none">✓</span>
                        <span>1. Penyusunan NHP</span>
                    </div>
                    <div className="h-px w-8 bg-green-200"></div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center border border-blue-600 bg-blue-600 text-white text-[10px] rounded-none">2</span>
                        <span className="text-blue-600">2. Tanggapan OPD</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center border border-slate-200 text-slate-400 text-[10px] rounded-none">3</span>
                        <span>3. Finalisasi LHP</span>
                    </div>
                </div>
            </div>

            {/* SIDE-BY-SIDE PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT: TEMUAN NHP */}
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Temuan Awal Temuan (NHP)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Rumusan 5 unsur yang telah diserahkan.</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                        <div>
                            <p className="font-bold text-slate-800">Kondisi:</p>
                            <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 border border-slate-100">{nhp.kondisi}</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Rekomendasi Utama:</p>
                            <p className="text-slate-650 mt-1 leading-relaxed bg-slate-50 p-2.5 border border-slate-100">{nhp.rekomendasi}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: TANGGAPAN OPD */}
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                        <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Berkas Sanggahan OPD</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Dokumen tanggapan adendum terunggah.</p>
                        </div>
                    </div>

                    {tanggapan ? (
                        <div className="space-y-4">
                            <div className="border border-slate-250 p-4 bg-slate-50/50 rounded-none flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={tanggapan.fileName}>
                                            {tanggapan.fileName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Diunggah: {tanggapan.uploadDate}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="border-slate-200 text-[10px] h-7 rounded-none shadow-none flex items-center gap-1"
                                    onClick={() => toast.success('Mengunduh Berkas Tanggapan...')}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download NHP
                                </Button>
                            </div>

                            {/* ANALYZE TRIGGER BUTTON */}
                            {!feedback && (
                                <div className="pt-2">
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzingTanggapan}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-none shadow-none flex items-center justify-center gap-1.5"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {isAnalyzingTanggapan ? 'AI Menganalisis PBJ...' : 'Analisis Kesesuaian PBJ via AI'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-44 border border-dashed border-slate-300 bg-slate-50/20 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                            <Info className="w-8 h-8 text-slate-300 mb-2" />
                            <h4 className="text-xs font-bold text-slate-700">Menunggu Tanggapan</h4>
                            <p className="text-slate-400 text-[10px] mt-1 max-w-[200px] leading-relaxed">
                                Auditee OPD belum menyerahkan berkas tanggapan pembelaan diri secara formal.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI FEEDBACK ANALYSIS RESULT */}
            {feedback && (
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                            AI Feedback Analyzer (Evaluasi Aturan PBJ)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                        
                        {/* DECISION CARD */}
                        <div className="md:col-span-1 border border-slate-200 p-4 rounded-none bg-slate-50 flex flex-col justify-center items-center text-center space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saran Rekomendasi AI</p>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border rounded-none ${
                                feedback.saran === 'TOLAK_SANGGAHAN'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                                {feedback.saran === 'TOLAK_SANGGAHAN' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {feedback.saran === 'TOLAK_SANGGAHAN' ? 'Tolak Sanggahan' : 'Terima Sanggahan'}
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold">Lanjut ke penyusunan LHP</p>
                        </div>

                        {/* EXPLANATION */}
                        <div className="md:col-span-2 space-y-2">
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                Argumentasi Regulasi LKPP:
                            </p>
                            <p className="text-slate-600 text-xs leading-relaxed font-sans bg-blue-50/20 p-3 border border-blue-100/50">
                                {feedback.analisis}
                            </p>
                        </div>
                    </div>

                    {/* ACTION: COMPILE LHP */}
                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <Button
                            onClick={handleCreateLhp}
                            className="bg-slate-800 hover:bg-slate-900 text-xs font-bold rounded-none shadow-none flex items-center gap-1.5"
                        >
                            Finalisasi & Buat Draf LHP
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
