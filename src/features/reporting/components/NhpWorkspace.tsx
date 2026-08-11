// src/features/reporting/components/NhpWorkspace.tsx
'use client';

import { useReportStore } from '@/store/useReportStore';
import { useKkaStore } from '@/store/useKkaStore';
import { useStStore } from '@/store/useStStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import { 
    Brain, FileText, Send, AlertCircle, ArrowRight, ShieldAlert, CheckCircle, Info 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NhpWorkspaceProps {
    stId: string;
}

export default function NhpWorkspace({ stId }: NhpWorkspaceProps) {
    const { user } = useAuthStore();
    const { stList } = useStStore();
    const { kkaList } = useKkaStore();
    const { nhpList, generateNhpAi, saveNhpDraft, sendNhpToOpd, isGeneratingNhp } = useReportStore();

    // 1. Ambil detail ST
    const st = stList.find(s => s.id === stId);

    // 2. Deteksi Peran (Leader/Ketua Tim vs Anggota) via Query Parameter / Mock User
    const [activeAuditorId, setActiveAuditorId] = useState('auditor-2'); // Default Siti (Anggota)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlType = params.get('type')?.toLowerCase();
            if (urlType === 'ketua') {
                setActiveAuditorId('auditor-1'); // Budi (Ketua)
            } else if (urlType === 'anggota') {
                setActiveAuditorId('auditor-2'); // Siti (Anggota)
            } else if (user?.role === 'AUDITOR' && st) {
                setActiveAuditorId(st.ketuaTimId); // Default ke ketua jika auditor login
            }
        }
    }, [user, st]);

    const isLeader = st?.ketuaTimId === activeAuditorId;

    // 3. Dapatkan temuan KKA yang APPROVED
    const approvedFindings = kkaList.filter(item => item.stId === stId && item.status === 'APPROVED');
    const hasApprovedFindings = approvedFindings.length > 0;

    // 4. Dapatkan Draf NHP
    const nhp = nhpList.find(n => n.stId === stId);

    // Local form states
    const [kondisi, setKondisi] = useState('');
    const [kriteria, setKriteria] = useState('');
    const [sebab, setSebab] = useState('');
    const [akibat, setAkibat] = useState('');
    const [rekomendasi, setRekomendasi] = useState('');

    useEffect(() => {
        if (nhp) {
            setKondisi(nhp.kondisi);
            setKriteria(nhp.kriteria);
            setSebab(nhp.sebab);
            setAkibat(nhp.akibat);
            setRekomendasi(nhp.rekomendasi);
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

        if (currentIndex > targetIndex) return 'bg-green-600 text-white border-green-600';
        if (currentIndex === targetIndex || (step === 1 && currentIndex < 2) || (step === 2 && currentIndex === 1)) return 'bg-blue-600 text-white border-blue-600';
        return 'bg-slate-100 text-slate-400 border-slate-200';
    };

    if (!st) return <div className="text-center py-12 text-slate-500">Surat Tugas Tidak Ditemukan.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* STEPPER PROGRESS */}
            <div className="border border-slate-200 bg-white p-5 rounded-none flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur Pelaporan:</div>
                </div>
                <div className="flex items-center gap-8 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(1, nhp?.status || 'DRAFT')}`}>1</span>
                        <span>1. Penyusunan NHP</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(2, nhp?.status || 'DRAFT')}`}>2</span>
                        <span>2. Tanggapan OPD</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${getStepClass(3, nhp?.status || 'DRAFT')}`}>3</span>
                        <span>3. Finalisasi LHP</span>
                    </div>
                </div>
            </div>

            {/* READ-ONLY BANNER FOR NON-LEADER */}
            {!isLeader && (
                <div className="border border-amber-200 bg-amber-50/20 p-4 rounded-none flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-800">Mode Lihat (Read-only)</h4>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                            Anda masuk sebagai **Anggota Tim**. Penyusunan draf NHP dan pengiriman dokumen ke OPD hanya dapat dilakukan oleh **Ketua Tim (Leader)** Surat Tugas.
                        </p>
                    </div>
                </div>
            )}

            {/* AI COMPILATION TRIGGER PANEL */}
            {isLeader && !nhp && (
                <div className="border border-slate-200 bg-white p-6 text-center space-y-4 rounded-none">
                    <Brain className="w-12 h-12 text-blue-600 mx-auto animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Rumuskan Naskah Hasil Pemeriksaan (NHP) via AI</h3>
                    <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                        AI akan secara cerdas memindai data Kertas Kerja Audit (KKA) yang sudah bertanda **APPROVED** oleh Ketua Tim, dan merangkumnya menjadi draf laporan audit terstruktur.
                    </p>

                    {!hasApprovedFindings ? (
                        <div className="text-xs text-red-650 bg-red-50 p-3 max-w-sm mx-auto border border-red-100 font-semibold leading-relaxed">
                            Belum ada temuan KKA yang berstatus APPROVED. Selesaikan proses peninjauan di Reviewer Portal terlebih dahulu.
                        </div>
                    ) : (
                        <Button
                            onClick={() => generateNhpAi(stId, approvedFindings.length)}
                            disabled={isGeneratingNhp}
                            className="bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-none shadow-none"
                        >
                            {isGeneratingNhp ? 'AI Merumuskan Draf...' : 'Generate Draft NHP via AI'}
                        </Button>
                    )}
                </div>
            )}

            {/* WORKSPACE FORM */}
            {nhp && (
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Formulir Naskah Temuan NHP</h3>
                            <p className="text-slate-400 text-[10px]">Struktur perumusan 5-Unsur Audit Daerah.</p>
                        </div>
                        {isLeader && nhp.status === 'DRAFT' && (
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleSaveDraft}
                                    variant="outline" 
                                    className="rounded-none border-slate-200 text-xs shadow-none"
                                >
                                    Simpan Draf
                                </Button>
                                <Button 
                                    onClick={handleSendToOpd}
                                    className="bg-green-600 hover:bg-green-700 rounded-none text-xs font-bold shadow-none flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    Kirim ke OPD
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* STATUS BANNER */}
                    {nhp.status !== 'DRAFT' && (
                        <div className="border border-green-200 bg-green-50/20 p-4 rounded-none flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <span className="text-xs text-green-800 font-semibold">
                                    Dokumen NHP telah dipublikasikan ke Portal Auditee OPD (Status: **{nhp.status}**).
                                </span>
                            </div>
                            {nhp.status === 'OPD_RESPONDED' && isLeader && (
                                <Link href={`/pelaporan/nhp/${stId}/review-tanggapan?role=auditor&type=ketua`}>
                                    <Button className="bg-slate-850 hover:bg-slate-905 text-xs rounded-none font-bold shadow-none flex items-center gap-1">
                                        Review Tanggapan OPD
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* FORM TEXTAREAS */}
                    <div className="space-y-4">
                        {[
                            { id: 'kondisi', label: '1. Kondisi (Temuan Fakta Lapangan)', value: kondisi, onChange: setKondisi },
                            { id: 'kriteria', label: '2. Kriteria (Acuan Aturan/Perda/SSH)', value: kriteria, onChange: setKriteria },
                            { id: 'sebab', label: '3. Sebab (Alasan Penyimpangan Terjadi)', value: sebab, onChange: setSebab },
                            { id: 'akibat', label: '4. Akibat (Potensi Kerugian Keuangan)', value: akibat, onChange: setAkibat },
                            { id: 'rekomendasi', label: '5. Rekomendasi (Tindakan Perbaikan)', value: rekomendasi, onChange: setRekomendasi }
                        ].map((field) => (
                            <div key={field.id} className="space-y-1.5">
                                <Label htmlFor={field.id} className="text-xs font-bold text-slate-700">{field.label}</Label>
                                <textarea
                                    id={field.id}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={!isLeader || nhp.status !== 'DRAFT'}
                                    placeholder={`Tulis ${field.label.toLowerCase()} di sini...`}
                                    className="w-full h-24 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
