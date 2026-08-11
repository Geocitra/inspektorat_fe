// src/features/monitoring/components/ComplianceDashboard.tsx
'use client';

import { useTlhpStore } from '@/store/useTlhpStore';
import { 
    RefreshCw, ShieldCheck, TrendingUp, AlertCircle, Award, BarChart3, Database 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComplianceDashboard() {
    const { tlhpList, recalculateComplianceScores, isRecalculatingCompliance } = useTlhpStore();

    // Hitung real-time kepatuhan Dinas Pendidikan dari useTlhpStore
    const disdikFinds = tlhpList.filter(t => t.opdName === 'Dinas Pendidikan');
    const resolvedDisdik = disdikFinds.filter(t => t.status === 'SESUAI').length;
    const disdikScore = disdikFinds.length > 0 ? Math.round((resolvedDisdik / disdikFinds.length) * 100) : 100;

    // Mock OPD ranking data
    const complianceData = [
        { name: 'Dinas Pendidikan', score: disdikScore, totalFindings: disdikFinds.length, resolved: resolvedDisdik, color: 'text-blue-600', strokeColor: '#2563eb' },
        { name: 'Dinas Kesehatan', score: 80, totalFindings: 5, resolved: 4, color: 'text-emerald-600', strokeColor: '#059669' },
        { name: 'Dinas Perhubungan', score: 50, totalFindings: 4, resolved: 2, color: 'text-amber-600', strokeColor: '#d97706' },
        { name: 'Dinas Pekerjaan Umum (Bina Marga)', score: 20, totalFindings: 10, resolved: 2, color: 'text-red-600', strokeColor: '#dc2626' }
    ].sort((a, b) => b.score - a.score);

    // SVG parameters untuk Radial Progress
    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* HUB HEADER & SYNC CONTROL */}
            <div className="border border-slate-200 bg-white p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Compliance Leaderboard (Redis Cache)
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Skor kepatuhan real-time seluruh Organisasi Perangkat Daerah (OPD) Kota Surabaya.
                    </p>
                </div>

                <Button
                    onClick={recalculateComplianceScores}
                    disabled={isRecalculatingCompliance}
                    className="bg-slate-800 hover:bg-slate-900 text-xs font-bold rounded-none shadow-none flex items-center gap-1.5"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRecalculatingCompliance ? 'animate-spin' : ''}`} />
                    {isRecalculatingCompliance ? 'Recalculating via BullMQ...' : 'Sync & Recalculate (Redis)'}
                </Button>
            </div>

            {/* BULLMQ RUNNING STATUS BANNER */}
            {isRecalculatingCompliance && (
                <div className="border border-blue-200 bg-blue-50/20 p-4 rounded-none flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-600 animate-bounce flex-shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            BullMQ Job Worker #1092 Active
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            Worker memproses antrean kalkulasi ulang skor kepatuhan, membersihkan cache Redis, dan menulis data ledger ke database.
                        </p>
                    </div>
                </div>
            )}

            {/* RADIAL CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {complianceData.map((opd, idx) => {
                    const strokeDashoffset = circumference - (opd.score / 100) * circumference;
                    
                    return (
                        <div key={opd.name} className="border border-slate-200 bg-white p-5 rounded-none flex flex-col items-center text-center space-y-4 relative">
                            {/* Ranking Badge */}
                            <span className="absolute top-2 left-2 text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 border border-slate-200 text-slate-500 rounded-none">
                                Rank #{idx + 1}
                            </span>

                            {/* Radial Chart (SVG) */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    {/* Track circle */}
                                    <circle
                                        cx="50" cy="50" r={radius}
                                        stroke="#f1f5f9" strokeWidth="8" fill="transparent"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="50" cy="50" r={radius}
                                        stroke={opd.strokeColor} strokeWidth="8" fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="square"
                                        className="transition-all duration-700 ease-in-out"
                                    />
                                </svg>
                                <span className="absolute text-sm font-extrabold text-slate-800">{opd.score}%</span>
                            </div>

                            {/* Info */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-850 truncate max-w-[160px]" title={opd.name}>{opd.name}</h4>
                                <p className="text-[10px] text-slate-450 font-bold">
                                    Tuntas: {opd.resolved} dari {opd.totalFindings} temuan
                                </p>
                            </div>

                            {/* Kepatuhan badge */}
                            <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-2 py-0.5 border rounded-none uppercase ${
                                opd.score >= 80 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : opd.score >= 50 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {opd.score >= 80 ? 'Kepatuhan Tinggi' : opd.score >= 50 ? 'Kepatuhan Sedang' : 'Kepatuhan Rendah'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* SCORE SUMMARY BOARD */}
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Analisis Pengawasan Daerah (APIP Overview)
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-650 leading-relaxed font-sans">
                    <div className="space-y-2 border-r border-slate-100 pr-6">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1">
                            <Award className="w-4 h-4 text-blue-600" />
                            Catatan Terbaik:
                        </h4>
                        <p>
                            **{complianceData[0].name}** berada pada peringkat teratas kepatuhan daerah dengan tingkat penyelesaian temuan sebesar **{complianceData[0].score}%**. Kecepatan tindak lanjut melampaui rata-rata target pengawasan pemerintah kota.
                        </p>
                    </div>
                    <div className="space-y-2 pl-2">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-red-650" />
                            Butuh Intervensi Pimpinan:
                        </h4>
                        <p>
                            **{complianceData[complianceData.length - 1].name}** masih menempati posisi terendah dengan kepatuhan **{complianceData[complianceData.length - 1].score}%**. Direkomendasikan kepada Inspektur Utama untuk mengeluarkan nota peringatan tertulis.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
