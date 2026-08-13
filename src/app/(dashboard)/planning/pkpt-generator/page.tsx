// src/app/(dashboard)/planning/pkpt-generator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useOpdStore } from '@/store/useOpdStore';
import { usePkptStore } from '@/store/usePkptStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    ShieldAlert, Calculator, Sparkles, ShieldCheck, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import RiskAssessment from '@/features/planning/components/RiskAssessment';
import AiGenerator from '@/features/planning/components/AiGenerator';
import InspekturApproval from '@/features/planning/components/InspekturApproval';

export default function PkptGeneratorPage() {
    // 1. Sync data OPD dari Master Data store
    const { opdList } = useOpdStore();
    const { status, syncWithOpdList, fetchActivePkpt, fetchRiskRanking } = usePkptStore();

    useEffect(() => {
        syncWithOpdList(opdList);
        fetchActivePkpt(2026);
        fetchRiskRanking(2026);
    }, [opdList, syncWithOpdList, fetchActivePkpt, fetchRiskRanking]);

    // 2. Deteksi Role Aktif berdasarkan Login User & URL Override (untuk testing cepat)
    const { user } = useAuthStore();
    const [activeRole, setActiveRole] = useState<'APIP_INTERNAL' | 'APIP_PIMPINAN'>('APIP_INTERNAL');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role')?.toUpperCase();
            
            if (urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN') {
                setActiveRole('APIP_PIMPINAN');
            } else if (urlRole === 'KASUBAG' || urlRole === 'APIP_INTERNAL') {
                setActiveRole('APIP_INTERNAL');
            } else if (user?.role) {
                if (user.role === 'APIP_PIMPINAN' || user.role === 'APIP_INTERNAL') {
                    setActiveRole(user.role);
                }
            }
        }
    }, [user]);

    const isInspektur = activeRole === 'APIP_PIMPINAN';
    const isKasubag = activeRole === 'APIP_INTERNAL';

    // Tabs state
    const [activeTab, setActiveTab] = useState<'risk' | 'generator' | 'approval'>('risk');

    if (activeRole && activeRole !== 'APIP_INTERNAL' && activeRole !== 'APIP_PIMPINAN') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak memiliki wewenang untuk mengakses modul PKPT. Modul ini hanya diperuntukkan bagi Kasubag Perencanaan dan Inspektur.
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dashboard Utama
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* HEADER WORKSPACE (Menunjukkan Ruang Kerja sesuai Peran Aktif) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-blue-600" />
                        Risk-Based Planning & PKPT
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Workspace: <strong className="text-blue-600">{isInspektur ? 'Inspektur (Persetujuan & TTE)' : 'Kasubag Perencanaan (Penyusunan Draf)'}</strong>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 font-bold uppercase">Role Login</p>
                        <p className="text-xs font-semibold text-slate-700 capitalize">{user?.role?.replace('_', ' ') || 'Guest'}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold">Status Dokumen:</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 border rounded-none ${
                            status === 'DISETUJUI'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : status === 'MENUNGGU_PERSETUJUAN'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {status === 'DISETUJUI' ? <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> : null}
                            {status === 'DISETUJUI' ? 'PUBLISHED' : status === 'MENUNGGU_PERSETUJUAN' ? 'PENDING APPROVAL' : 'DRAFT'}
                        </span>
                    </div>
                </div>
            </div>

            {/* TAB CONTROLLERS */}
            <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                    onClick={() => setActiveTab('risk')}
                    className={`px-4 py-3 text-xs font-bold border-r border-slate-200 flex items-center gap-2 transition-all ${
                        activeTab === 'risk'
                            ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Calculator className="w-4 h-4" />
                    1. Analisis Risiko OPD
                </button>
                <button
                    onClick={() => setActiveTab('generator')}
                    className={`px-4 py-3 text-xs font-bold border-r border-slate-200 flex items-center gap-2 transition-all ${
                        activeTab === 'generator'
                            ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    2. AI PKPT Generator
                </button>
                <button
                    onClick={() => setActiveTab('approval')}
                    className={`px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'approval'
                            ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    3. Persetujuan Inspektur
                </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'risk' && <RiskAssessment isKasubag={isKasubag} />}
            {activeTab === 'generator' && <AiGenerator isKasubag={isKasubag} onSubmitSuccess={() => setActiveTab('approval')} />}
            {activeTab === 'approval' && <InspekturApproval isInspektur={isInspektur} />}
        </div>
    );
}
