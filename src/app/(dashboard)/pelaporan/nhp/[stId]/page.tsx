// src/app/(dashboard)/pelaporan/nhp/[stId]/page.tsx
'use client';

import { use } from 'react';
import NhpWorkspace from '@/features/reporting/components/NhpWorkspace';

export default function NhpPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Penyusunan Naskah Hasil Pemeriksaan (NHP)</h1>
                <p className="text-slate-500 text-xs mt-1">Gunakan AI RAG untuk merangkum temuan pengawasan KKA yang disetujui.</p>
            </div>
            <NhpWorkspace stId={stId} />
        </div>
    );
}
