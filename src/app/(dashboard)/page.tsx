// src/app/(dashboard)/page.tsx
'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ShieldCheck, Building2, Users, BookOpen, FileCheck, ArrowRight, Upload, Plus 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardHomePage() {
    const { user } = useAuthStore();
    const role = user?.role || 'APIP_INTERNAL';
    const isKasubag = role === 'APIP_INTERNAL';

    // Mock statistik
    const statOpd = 14;
    const statAuditor = 8;
    const statRegulasi = 24;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* WELCOME BANNER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Utama</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Selamat datang kembali di Pusat Kendali APIP Suite E-Audit AI.
                </p>
            </div>

            {/* SECURITY PROFILE BANNER */}
            <Card className="bg-slate-800 text-white shadow-none border-0 rounded-none">
                <CardContent className="p-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                            <p className="text-slate-300 font-bold">Kredensial Sesi Aktif:</p>
                            <p className="text-slate-100 font-mono mt-0.5">{user?.email} &bull; Peran: {role === 'APIP_PIMPINAN' ? 'Inspektur' : role === 'AUDITOR' ? 'Auditor' : 'Kasubag Perencanaan'}</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none tracking-widest uppercase">
                        Secure System
                    </span>
                </CardContent>
            </Card>

            {/* STAT CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-slate-200 bg-white rounded-none shadow-none">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">OPD Terdaftar</CardTitle>
                        <Building2 className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-extrabold text-slate-800">{statOpd}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Organisasi Perangkat Daerah Surabaya</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white rounded-none shadow-none">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditor Aktif</CardTitle>
                        <Users className="w-4 h-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-extrabold text-slate-800">{statAuditor}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Database Pemeriksa Fungsional</p>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white rounded-none shadow-none">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regulasi Ingested AI</CardTitle>
                        <BookOpen className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-extrabold text-slate-800">{statRegulasi}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Dokumen SOP & Regulasi Chunked</p>
                    </CardContent>
                </Card>
            </div>

            {/* STATUS PKPT WORKFLOW TRACKER */}
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Perencanaan PKPT Tahunan</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Progress penyusunan perencanaan berbasis risiko daerah tahun berjalan.</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-650 pt-2">
                    <div className="flex items-center gap-1.5 text-green-600">
                        <span className="w-4 h-4 flex items-center justify-center border border-green-600 text-[9px] bg-green-600 text-white rounded-none">✓</span>
                        <span>1. Draft Rencana</span>
                    </div>
                    <div className="h-0.5 w-12 bg-green-600"></div>
                    <div className="flex items-center gap-1.5 text-green-600">
                        <span className="w-4 h-4 flex items-center justify-center border border-green-600 text-[9px] bg-green-600 text-white rounded-none">✓</span>
                        <span>2. Review Inspektur</span>
                    </div>
                    <div className="h-0.5 w-12 bg-green-600"></div>
                    <div className="flex items-center gap-1.5 text-blue-650">
                        <span className="w-4 h-4 flex items-center justify-center border border-blue-600 text-[9px] bg-blue-600 text-white rounded-none">3</span>
                        <span>3. Sah / Publikasi</span>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS FOR KASUBAG */}
            {isKasubag && (
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pintu Pintasan (Quick Actions)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Kelola data awal dan administrasi secara cepat.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/planning/ingestion">
                            <Button className="bg-slate-800 hover:bg-slate-900 rounded-none text-xs shadow-none font-bold flex items-center gap-1.5">
                                <Upload className="w-4 h-4 text-slate-400" />
                                Upload Regulasi Baru
                            </Button>
                        </Link>
                        <Link href="/penugasan/draf-st">
                            <Button className="bg-blue-650 hover:bg-blue-700 rounded-none text-xs shadow-none font-bold flex items-center gap-1.5">
                                <Plus className="w-4 h-4" />
                                Buat Surat Tugas Baru
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
