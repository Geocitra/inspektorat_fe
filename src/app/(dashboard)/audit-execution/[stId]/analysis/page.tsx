// src/app/(dashboard)/audit-execution/[stId]/analysis/page.tsx
'use client';

import { use } from 'react';
import AnomalyDashboard from '@/features/execution/components/AnomalyDashboard';

export default function AnomalyAnalysisPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;

    return <AnomalyDashboard stId={stId} />;
}
