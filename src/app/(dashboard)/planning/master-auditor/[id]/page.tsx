// src/app/(dashboard)/planning/master-auditor/[id]/page.tsx
'use client';

import { use } from 'react';
import AuditorDetail from '@/features/planning/components/AuditorDetail';

export default function MasterAuditorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return <AuditorDetail auditorId={resolvedParams.id} />;
}
