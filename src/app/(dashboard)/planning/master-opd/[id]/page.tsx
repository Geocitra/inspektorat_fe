// src/app/(dashboard)/planning/master-opd/[id]/page.tsx
'use client';

import { use } from 'react';
import OpdDetail from '@/features/planning/components/OpdDetail';

export default function MasterOpdDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return <OpdDetail opdId={resolvedParams.id} />;
}
