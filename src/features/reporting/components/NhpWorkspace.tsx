// src/features/reporting/components/NhpWorkspace.tsx
'use client';

import { useReportStore } from '@/store/useReportStore';
import { useKkaStore } from '@/store/useKkaStore';
import { useStListQuery } from '@/hooks/queries/useSt';
import { useState, useEffect } from 'react';
import { 
    Brain, FileText, Send, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, 
    Building2, Sparkles, RefreshCw, Save 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NhpWorkspaceProps {
    stId: string;
}

export default function NhpWorkspace({ stId }: NhpWorkspaceProps) {
    const { data: stData = [] } = useStListQuery();
    const { kkaList, loadSampleSpjForDisdik, approveKkaItem } = useKkaStore();
    const { nhpList, generateNhpAi, saveNhpDraft, sendNhpToOpd, isGeneratingNhp } = useReportStore();

    // 1. Ambil detail ST
    const st = stData.find(s => s.id === stId) || {
        id: stId,
        noSt: 'ST.700.1.2/001/ITDA-IRB.I/2026',
        namaOpd: 'Dinas Pendidikan Kota Surabaya',
        namaAudit: 'Evaluasi Rencana & Kepatuhan Keuangan'
    };

    // 2. Selalu berikan wewenang Ketua Tim
    const isLeader = true;

    // 3. Pastikan KKA terisi dan berstatus APPROVED
    useEffect(() => {
        if (stId) {
            const currentItems = kkaList.filter(k => k.stId === stId);
            if (currentItems.length === 0) {
                loadSampleSpjForDisdik(stId);
            }
        }
    }, [stId, kkaList.length]);

    const approvedFindings = kkaList.filter(item => item.stId === stId && item.status === 'APPROVED');
    const hasApprovedFindings = approvedFindings.length > 0 || kkaList.length > 0;

    // 4. Dapatkan Draf NHP
    const nhp = nhpList.find(n => n.stId === stId);

    // Auto-generate NHP jika belum ada
    useEffect(() => {
        if (stId && !nhp && hasApprovedFindings) {
            generateNhpAi(stId, 2);
        }
    }, [stId, nhp, hasApprovedFindings]);

    // Local form states
    const [kondisi, setKondisi] = useState('');
    const [kriteria, setKriteria] = useState('');
    const [sebab, setSebab] = useState('');
    const [akibat, setAkibat] = useState('');
    const [rekomendasi, setRekomendasi] = useState('');

    useEffect(() => {
        if (nhp) {
            setKondisi(nhp.kondisi || '');
            setKriteria(nhp.kriteria || '');
            setSebab(nhp.sebab || '');
            setAkibat(nhp.akibat || '');
            setRekomendasi(nhp.rekomendasi || '');
        }
    }, [nhp]);

    const handleSaveDraft = () => {
        saveNhpDraft(stId, { kondisi, kriteria, sebab, akibat, rekomendasi });
    };

    const handleSendToOpd = () => {
        if (!kondisi || !kriteria || !sebab || !akibat || !rekomendasi) {
            toast.error('Gagal Mengirim NHP', { description: 'Harap lengkapi semua unsur audit sebelum mengirim dokumen.' });
            return;
        }
        sendNhpToOpd(stId);
    };

    // Helper untuk Stepper Progress
    const getStepClass = (step: number, currentStatus: string) => {
        const statuses = ['DRAFT', 'SENT_TO_OPD', 'OPD_RESPONDED', 'LHP_READY', 'COMPLETED'];
        const currentIndex = statuses.indexOf(currentStatus);
        
        let targetIndex = 0;
        if (step === 1) targetIndex = 0; // NHP
        if (step === 2) targetIndex = 2; // Tanggapan (OPD_RESPONDED)
        if (step === 3) targetIndex = 3; // LHP (LHP_READY)

        if (currentIndex > targetIndex) return 'bg-emerald-600 text-white border-emerald-600 font-bold';
        if (currentIndex === targetIndex || (step === 1 && currentIndex < 2) || (step === 2 && currentIndex === 1)) return 'bg-blue-600 text-white border-blue-600 font-bold';
        return 'bg-slate-100 text-slate-400 border-slate-200';
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* STEPPER PROGRESS */}
            <div className="border border-slate-200 bg-white p-4 rounded-none flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur Pelaporan:</span>
                </div>
                <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(1, nhp?.status || 'DRAFT')}`}>1</span>
                        <span className={nhp?.status === 'DRAFT' || !nhp ? 'text-blue-700 font-bold' : 'text-slate-700'}>1. Penyusunan NHP</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(2, nhp?.status || 'DRAFT')}`}>2</span>
                        <span className={nhp?.status === 'SENT_TO_OPD' || nhp?.status === 'OPD_RESPONDED' ? 'text-blue-700 font-bold' : 'text-slate-400'}>2. Tanggapan Auditi (OPD)</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(3, nhp?.status || 'DRAFT')}`}>3</span>
                        <span className={nhp?.status === 'LHP_READY' || nhp?.status === 'COMPLETED' ? 'text-emerald-700 font-bold' : 'text-slate-400'}>3. Finalisasi LHP</span>
                    </div>
                </div>
            </div>

            {/* RINGKASAN SURAT TUGAS & TEMUAN KKA */}
            <div className="border border-slate-200 bg-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Sasaran Audit: {st.namaOpd} &bull; {st.noSt}
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Program: {st.namaAudit} &bull; Dasar Penyusunan: 2 Temuan KKA Disetujui (Sewa Sound System &amp; Genset).
                    </p>
                </div>

                {!nhp && (
                    <Button
                        onClick={() => generateNhpAi(stId, 2)}
                        disabled={isGeneratingNhp}
                        className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 shadow-none flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isGeneratingNhp ? 'Merumuskan...' : '✨ Rumuskan NHP via AI'}</span>
                    </Button>
                )}
            </div>

            {/* WORKSPACE FORM 5 UNSUR AUDIT */}
            {nhp && (
                <div className="border border-slate-200 bg-white p-6 rounded-none space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Formulir Naskah Hasil Pengawasan (NHP)</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Format standar perumusan 5-Unsur Audit BPKP RI.</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDraft}
                                className="rounded-none border-slate-300 text-xs font-semibold h-8 px-3 flex items-center gap-1 cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5 text-slate-600" />
                                Simpan Draf
                            </Button>

                            {nhp.status === 'DRAFT' && (
                                <Button
                                    size="sm"
                                    onClick={handleSendToOpd}
                                    className="rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-3.5 shadow-none flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim NHP ke Dinas Pendidikan (Auditi)</span>
                                </Button>
                            )}

                            {nhp.status !== 'DRAFT' && (
                                <Link href={`/pelaporan/lhp/${stId}`}>
                                    <Button
                                        size="sm"
                                        className="rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-3.5 shadow-none flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>Lanjut ke Tahap LHP Final</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {nhp.status === 'SENT_TO_OPD' && (
                        <div className="border border-blue-200 bg-blue-50/50 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Draf NHP Telah Dikirim ke Portal Dinas Pendidikan</p>
                                <p className="text-[11px] text-blue-700 mt-0.5">
                                    Dokumen sedang menunggu jadwal Exit Meeting dan pengunggahan Surat Tanggapan Resmi oleh pihak auditi.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 text-xs font-sans">
                        {/* 1. KONDISI */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="bg-slate-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">1</span>
                                Kondisi (Fakta Temuan Hasil Uji Petik KKA):
                            </Label>
                            <textarea
                                value={kondisi}
                                onChange={(e) => setKondisi(e.target.value)}
                                className="w-full h-24 p-3 border border-slate-300 rounded-none text-xs focus:border-blue-600 focus:outline-none leading-relaxed font-sans"
                            />
                        </div>

                        {/* 2. KRITERIA */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="bg-slate-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">2</span>
                                Kriteria (Dasar Regulasi &amp; Standar yang Dilanggar):
                            </Label>
                            <textarea
                                value={kriteria}
                                onChange={(e) => setKriteria(e.target.value)}
                                className="w-full h-24 p-3 border border-slate-300 rounded-none text-xs focus:border-blue-600 focus:outline-none leading-relaxed font-sans"
                            />
                        </div>

                        {/* 3. SEBAB */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="bg-slate-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">3</span>
                                Sebab (Akar Masalah / Faktor Kelalaian):
                            </Label>
                            <textarea
                                value={sebab}
                                onChange={(e) => setSebab(e.target.value)}
                                className="w-full h-20 p-3 border border-slate-300 rounded-none text-xs focus:border-blue-600 focus:outline-none leading-relaxed font-sans"
                            />
                        </div>

                        {/* 4. AKIBAT */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="bg-slate-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">4</span>
                                Akibat (Dampak Finansial &amp; Kerugian Daerah):
                            </Label>
                            <textarea
                                value={akibat}
                                onChange={(e) => setAkibat(e.target.value)}
                                className="w-full h-20 p-3 border border-slate-300 rounded-none text-xs focus:border-blue-600 focus:outline-none leading-relaxed font-sans text-red-700 font-semibold"
                            />
                        </div>

                        {/* 5. REKOMENDASI */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="bg-slate-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">5</span>
                                Rekomendasi (Tindakan Penyetoran Kasda &amp; Penertiban Administrasi):
                            </Label>
                            <textarea
                                value={rekomendasi}
                                onChange={(e) => setRekomendasi(e.target.value)}
                                className="w-full h-28 p-3 border border-slate-300 rounded-none text-xs focus:border-blue-600 focus:outline-none leading-relaxed font-sans"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
