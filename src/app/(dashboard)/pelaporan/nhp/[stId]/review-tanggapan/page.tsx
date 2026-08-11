// src/app/(dashboard)/pelaporan/nhp/[stId]/review-tanggapan/page.tsx
'use client';

import { use } from 'react';
import TanggapanAnalyzer from '@/features/reporting/components/TanggapanAnalyzer';

export default function ReviewTanggapanPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Kaji Ulang Sanggahan OPD</h1>
                <p className="text-slate-500 text-xs mt-1">Gunakan AI RAG PBJ Analyzer untuk mengevaluasi adendum dari auditee.</p>
            </div>
            <TanggapanAnalyzer stId={stId} />
        </div>
    );
}
