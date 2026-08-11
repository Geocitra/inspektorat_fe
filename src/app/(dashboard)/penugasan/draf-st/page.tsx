// src/app/(dashboard)/penugasan/draf-st/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import SuratTugasForm from '@/features/penugasan/components/SuratTugasForm';
import SuratTugasList from '@/features/penugasan/components/SuratTugasList';

export default function DrafStPage() {
    const { user } = useAuthStore();
    const [activeRole, setActiveRole] = useState<'APIP_INTERNAL' | 'APIP_PIMPINAN' | 'AUDITOR' | 'OTHER'>('APIP_INTERNAL');

    // Sinkronisasi Peran Aktif & Override Rujukan Parameter Query (?role=inspektur)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role')?.toUpperCase();
            
            if (urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN') {
                setActiveRole('APIP_PIMPINAN');
            } else if (urlRole === 'KASUBAG' || urlRole === 'APIP_INTERNAL') {
                setActiveRole('APIP_INTERNAL');
            } else if (urlRole === 'AUDITOR') {
                setActiveRole('AUDITOR');
            } else if (user?.role) {
                if (user.role === 'APIP_PIMPINAN' || user.role === 'APIP_INTERNAL' || user.role === 'AUDITOR') {
                    setActiveRole(user.role as any);
                } else {
                    setActiveRole('OTHER');
                }
            }
        }
    }, [user]);

    const isKasubag = activeRole === 'APIP_INTERNAL';
    const isInspektur = activeRole === 'APIP_PIMPINAN';
    const isAuditor = activeRole === 'AUDITOR';

    // Toggle reload list setelah form menyimpan data baru
    const [refreshKey, setRefreshKey] = useState(0);

    if (activeRole === 'OTHER') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak memiliki wewenang untuk mengakses modul Manajemen Surat Tugas. Halaman ini hanya untuk Kasubag Perencanaan, Inspektur, dan Tim Audit.
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
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Manajemen & Pengesahan Surat Tugas (ST)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Workspace Peran: <strong className="text-blue-600">{isInspektur ? 'Inspektur Utama' : isAuditor ? 'Tim Audit (Assignments)' : 'Kasubag Perencanaan'}</strong>
                    </p>
                </div>
            </div>

            {/* FORM PEMBUATAN (Hanya terlihat oleh Kasubag Perencanaan) */}
            {isKasubag && (
                <SuratTugasForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
            )}

            {/* DAFTAR SURAT TUGAS */}
            <SuratTugasList 
                key={refreshKey} 
                isKasubag={isKasubag} 
                isInspektur={isInspektur} 
                isAuditor={isAuditor}
            />
        </div>
    );
}
