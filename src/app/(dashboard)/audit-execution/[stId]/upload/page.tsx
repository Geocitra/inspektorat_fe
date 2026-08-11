// src/app/(dashboard)/audit-execution/[stId]/upload/page.tsx
'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadSpj from '@/features/execution/components/UploadSpj';

export default function SpjUploadPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;
    const router = useRouter();

    return (
        <UploadSpj 
            stId={stId} 
            onUploadSuccess={() => {
                // Setelah upload berhasil, arahkan ke tab Analisis Anomali dengan parameter role terjaga
                router.push(`/audit-execution/${stId}/analysis?role=auditor&type=anggota`);
            }} 
        />
    );
}
