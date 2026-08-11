// src/app/(dashboard)/planning/master-auditor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AuditorList from '@/features/planning/components/AuditorList';

export default function MasterAuditorPage() {
    const { user } = useAuthStore();
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role')?.toUpperCase();
            if (urlRole) {
                setActiveRole(urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN' ? 'APIP_PIMPINAN' : 'APIP_INTERNAL');
            } else if (user?.role) {
                setActiveRole(user.role);
            }
        }
    }, [user]);

    if (activeRole && activeRole !== 'APIP_INTERNAL') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak memiliki wewenang untuk mengakses modul Manajemen Auditor. Halaman ini hanya diperuntukkan bagi Kasubag Perencanaan.
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dashboard Utama
                    </Button>
                </Link>
            </div>
        );
    }

    return <AuditorList />;
}
