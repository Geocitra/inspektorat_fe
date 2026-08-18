// src/components/layout/NavigationBreadcrumb.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROUTE_LABELS: Record<string, string> = {
    'planning': 'Perencanaan PKPT',
    'opd': 'Master OPD',
    'risk-analysis': 'Analisis Risiko',
    'knowledge-base': 'Knowledge Base Regulasi',
    'penugasan': 'Manajemen Surat Tugas',
    'draf-st': 'Surat Tugas & Penugasan',
    'pka-template': 'Penyusunan PKA',
    'audit-execution': 'Pelaksanaan Audit Lapangan',
    'upload': '1. Unggah SPJ & KKA',
    'analysis': '2. Analisis Deteksi AI',
    'review': '3. Reviu KKA & NHP',
    'pelaporan': 'Pelaporan & Hasil Audit',
    'nhp': 'Naskah Hasil Pemeriksaan (NHP)',
    'lhp': 'Laporan Hasil Pemeriksaan (LHP)',
    'monitoring': 'Monitoring Pengawasan',
    'compliance-score': 'Skor Kepatuhan OPD',
    'follow-up': 'Tindak Lanjut (TLHP)',
};

export default function NavigationBreadcrumb() {
    const pathname = usePathname();
    const router = useRouter();

    if (!pathname || pathname === '/') {
        return null;
    }

    const segments = pathname.split('/').filter(Boolean);

    // Jangan tampilkan jika di halaman utama
    if (segments.length === 0) return null;

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs">
            {/* TOMBOL BACK & BREADCRUMB TRAILS */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-7 px-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-none flex items-center gap-1.5 cursor-pointer"
                    title="Kembali ke halaman sebelumnya"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                </Button>

                <div className="h-4 w-px bg-slate-200" />

                {/* BREADCRUMB PATH */}
                <nav className="flex items-center gap-1.5 text-slate-500 overflow-x-auto">
                    <Link 
                        href="/" 
                        className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                    </Link>

                    {segments.map((seg, idx) => {
                        const href = `/${segments.slice(0, idx + 1).join('/')}`;
                        const isLast = idx === segments.length - 1;
                        const label = ROUTE_LABELS[seg] || (seg.length > 20 ? `${seg.substring(0, 8)}...` : seg);

                        return (
                            <div key={href} className="flex items-center gap-1.5">
                                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                {isLast ? (
                                    <span className="font-bold text-slate-800">
                                        {label}
                                    </span>
                                ) : (
                                    <Link 
                                        href={href} 
                                        className="hover:text-blue-600 font-medium transition-colors"
                                    >
                                        {label}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
