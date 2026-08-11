// src/features/reporting/components/LhpWorkspace.tsx
'use client';

import { useState } from 'react';
import { useReportStore } from '@/store/useReportStore';
import { useStStore } from '@/store/useStStore';
import { 
    ShieldCheck, RefreshCw, FileText, CheckCircle2, Lock, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LhpWorkspaceProps {
    stId: string;
    isInspektur: boolean;
}

export default function LhpWorkspace({ stId, isInspektur }: LhpWorkspaceProps) {
    const { lhpList, signLhpTte, isSigningLhp } = useReportStore();
    const { stList } = useStStore();
    const [signingProgress, setSigningProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');

    const st = stList.find(s => s.id === stId);
    const lhp = lhpList.find(l => l.stId === stId);

    const handleSignTte = async () => {
        setSigningProgress(0);
        setProgressLabel('Compiling Final Report...');

        // Tahap 1: Compiling
        const interval = setInterval(() => {
            setSigningProgress(prev => {
                if (prev >= 45 && prev < 50) {
                    setProgressLabel('Applying SHA-256 Signature...');
                }
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 120);

        await signLhpTte(stId);
    };

    if (!st) return <div className="text-center py-12 text-slate-500">Surat Tugas Tidak Ditemukan.</div>;
    if (!lhp) return <div className="text-center py-12 text-slate-500">Berkas draf LHP belum dibentuk. Harap selesaikan review tanggapan terlebih dahulu.</div>;

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
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="w-5 h-5 flex items-center justify-center border border-green-600 text-[10px] bg-green-600 text-white rounded-none">✓</span>
                        <span>2. Tanggapan OPD</span>
                    </div>
                    <div className="h-px w-8 bg-green-200"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center border text-[10px] ${
                            lhp.status === 'SIGNED'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-blue-600 text-white border-blue-600 animate-pulse'
                        }`}>3</span>
                        <span className={lhp.status === 'SIGNED' ? 'text-green-600' : 'text-blue-600'}>3. Finalisasi LHP</span>
                    </div>
                </div>
            </div>

            {/* MOCK PREVIEW PAPER LHP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* PDF PREVIEW COLUMN */}
                <div className="md:col-span-2 bg-slate-100 p-6 flex justify-center border border-slate-200 min-h-[480px]">
                    {/* Mock paper */}
                    <div className="w-full max-w-[480px] bg-white border border-slate-350 p-8 font-serif text-[11px] text-slate-800 space-y-5 relative rounded-none shadow-sm">
                        
                        {/* KOP Surat */}
                        <div className="text-center border-b-2 border-double border-slate-800 pb-3 space-y-1">
                            <h2 className="text-xs font-bold uppercase tracking-wider">Pemerintah Kota Surabaya</h2>
                            <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900">Badan Inspektorat Daerah</h1>
                            <p className="text-[9px] font-sans text-slate-500 italic">Laporan Hasil Pemeriksaan Final Pengawasan</p>
                        </div>

                        {/* Judul LHP */}
                        <div className="text-center space-y-0.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider underline">Laporan Hasil Pemeriksaan (LHP)</h3>
                            <p className="text-[9px] font-sans font-semibold text-slate-500">Nomor: {lhp.noLhp}</p>
                        </div>

                        {/* Isi LHP Ringkas */}
                        <div className="space-y-3 font-sans leading-relaxed text-slate-700">
                            <p className="font-semibold text-slate-850">A. KESIMPULAN AUDIT</p>
                            <p className="pl-2 border-l-2 border-slate-300">
                                Berdasarkan rangkaian pengujian realisasi belanja daerah pada **{st.namaOpd}** terkait program kerja **{st.namaAudit}**, Inspektorat Daerah menetapkan temuan akhir yang bersifat **Mutlak** (tidak dapat disanggah lagi).
                            </p>

                            <p className="font-semibold text-slate-850 mt-4">B. REKOMENDASI TINDAK LANJUT (TLHP)</p>
                            <p className="pl-2 border-l-2 border-slate-300">
                                Diinstruksikan kepada Kepala **{st.namaOpd}** untuk segera menindaklanjuti rekomendasi penyetoran sisa anggaran kemahalan harga barang ke Kas Daerah Surabaya selambat-lambatnya 60 hari kerja setelah LHP ini diterbitkan.
                            </p>
                        </div>

                        {/* Signatures / TTE Certificate */}
                        <div className="flex justify-end pt-8 font-sans">
                            <div className="w-[180px] text-center space-y-4">
                                <p className="text-[9px] text-slate-500 font-semibold">Surabaya, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                
                                {lhp.status === 'SIGNED' && lhp.tteHash ? (
                                    <div className="border border-emerald-600 bg-emerald-50/20 p-2 text-center space-y-1 select-all rounded-none">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                                        <p className="text-[8px] font-bold text-emerald-800 uppercase tracking-widest">LHP Sah & TTE Locked</p>
                                        <p className="text-[6px] font-mono text-emerald-700 truncate">{lhp.tteHash}</p>
                                        <p className="text-[7px] text-slate-500 font-bold mt-1">Inspektur Utama</p>
                                    </div>
                                ) : (
                                    <div className="h-14 flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-[10px] italic">
                                        Draft LHP (Unsigned)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIDE CONTROLS COLUMN */}
                <div className="md:col-span-1 space-y-4">
                    <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aksi Pengesahan LHP</h3>
                        </div>

                        {/* STATUS MESSAGE */}
                        {lhp.status === 'SIGNED' ? (
                            <div className="border border-emerald-200 bg-emerald-50/20 p-4 text-center rounded-none space-y-2">
                                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                                <h4 className="text-xs font-bold text-emerald-800">LHP Berhasil Diterbitkan</h4>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                    Dokumen laporan hasil pemeriksaan audit telah sah terdaftar di Security Ledger Daerah. Status Surat Tugas {st.noSt} kini resmi bertanda **SELESAI**.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 border border-slate-100">
                                    Status: **DRAFT LHP (MENUNGGU TTE)**. Inspektur Utama harus membubuhkan Tanda Tangan Elektronik untuk menerbitkan laporan ini secara formal.
                                </p>

                                {isInspektur ? (
                                    <Button
                                        onClick={handleSignTte}
                                        disabled={isSigningLhp}
                                        className="w-full bg-green-600 hover:bg-green-700 text-xs font-bold rounded-none shadow-none flex items-center justify-center gap-1.5"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Sahkan LHP (TTE)
                                    </Button>
                                ) : (
                                    <div className="border border-amber-250 bg-amber-50/20 p-3 rounded-none flex items-start gap-2">
                                        <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-850 leading-relaxed">
                                            Aksi TTE terkunci. Hanya Inspektur Utama yang diperkenankan menandatangani dokumen LHP Final.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SIGNING STATUS PROGRESS */}
                        {isSigningLhp && (
                            <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-none space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-bold text-blue-850">
                                    <span className="flex items-center gap-1.5">
                                        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                        {progressLabel}
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
                    </div>
                </div>

            </div>
        </div>
    );
}
