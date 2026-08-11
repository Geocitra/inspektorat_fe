// src/app/(opd)/portal/tlhp/[stId]/page.tsx
'use client';

import { use } from 'react';
import TlhpUploadPortal from '@/features/monitoring/components/TlhpUploadPortal';

export default function OpdTlhpPortalPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Portal Tindak Lanjut Hasil Pemeriksaan (TLHP)</h1>
                <p className="text-slate-500 text-xs mt-1">Unggah berkas bukti penyelesaian dan foto fisik koordinat GPS proyek.</p>
            </div>
            <TlhpUploadPortal stId={stId} />
        </div>
    );
}
