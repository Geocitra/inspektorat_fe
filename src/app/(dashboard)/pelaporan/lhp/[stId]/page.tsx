// src/app/(dashboard)/pelaporan/lhp/[stId]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import LhpWorkspace from '@/features/reporting/components/LhpWorkspace';

export default function LhpPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;
    const { user } = useAuthStore();

    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const urlRole = searchParams.get('role')?.toUpperCase();
            if (urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN') {
                setActiveRole('APIP_PIMPINAN');
            } else if (urlRole === 'KASUBAG' || urlRole === 'APIP_INTERNAL') {
                setActiveRole('APIP_INTERNAL');
            } else if (urlRole === 'AUDITOR') {
                setActiveRole('AUDITOR');
            } else if (user?.role) {
                setActiveRole(user.role);
            }
        }
    }, [user]);

    const isInspektur = activeRole === 'APIP_PIMPINAN';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Finalisasi Laporan Hasil Pemeriksaan (LHP)</h1>
                    <p className="text-slate-500 text-xs mt-1">Kompilasi temuan audit mutlak yang telah ditindaklanjuti secara sah.</p>
                </div>

                {/* Role Status Tag */}
                <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-none font-bold text-slate-700">
                    Peran TTE: <strong className="text-blue-600">{isInspektur ? 'Inspektur Utama (Active)' : 'Auditor / Kasubag (Locked)'}</strong>
                </div>
            </div>
            <LhpWorkspace stId={stId} isInspektur={isInspektur} />
        </div>
    );
}
