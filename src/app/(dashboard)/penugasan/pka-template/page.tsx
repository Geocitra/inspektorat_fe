// src/app/(dashboard)/penugasan/pka-template/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import PkaWorkspace from '@/features/penugasan/components/PkaWorkspace';

export default function PkaTemplatePage() {
    const { user } = useAuthStore();
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role')?.toUpperCase();
            if (urlRole === 'AUDITOR') {
                setActiveRole('AUDITOR');
            } else if (urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN') {
                setActiveRole('APIP_PIMPINAN');
            } else if (urlRole === 'KASUBAG' || urlRole === 'APIP_INTERNAL') {
                setActiveRole('APIP_INTERNAL');
            } else if (user?.role) {
                setActiveRole(user.role);
            }
        }
    }, [user]);

    // Hanya Tim Audit (AUDITOR) yang menyusun PKA secara teknis
    if (activeRole && activeRole !== 'AUDITOR') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak memiliki wewenang untuk menyusun Program Kerja Audit secara teknis. Modul ini khusus diperuntukkan bagi peran Tim Audit (Auditor).
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dashboard Utama
                    </Button>
                </Link>
            </div>
        );
    }

    return <PkaWorkspace />;
}
