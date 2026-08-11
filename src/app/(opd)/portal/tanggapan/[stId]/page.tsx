// src/app/(opd)/portal/tanggapan/[stId]/page.tsx
'use client';

import { use } from 'react';
import OpdPortal from '@/features/reporting/components/OpdPortal';

export default function OpdTanggapanPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;

    return <OpdPortal stId={stId} />;
}
