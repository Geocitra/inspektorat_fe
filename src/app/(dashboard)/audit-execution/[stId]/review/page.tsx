// src/app/(dashboard)/audit-execution/[stId]/review/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStStore } from '@/store/useStStore';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import ReviewerPortal from '@/features/execution/components/ReviewerPortal';

export default function ReviewPage({ params }: { params: Promise<{ stId: string }> }) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;
    const { user } = useAuthStore();
    const { stList } = useStStore();
    const [isKetua, setIsKetua] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const urlType = searchParams.get('type')?.toLowerCase();
            const st = stList.find(s => s.id === stId);
            
            if (st) {
                if (urlType === 'anggota') {
                    setIsKetua(false);
                } else if (urlType === 'ketua') {
                    setIsKetua(true);
                } else {
                    // Fallback berdasarkan mock id matching
                    setIsKetua(st.ketuaTimId === 'auditor-1');
                }
            }
        }
    }, [user, stList, stId]);

    if (!isKetua) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak (Khusus Ketua Tim)</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak diperkenankan mengakses halaman Review KKA. Halaman ini hanya diperuntukkan bagi Ketua Tim penugasan Surat Tugas ini.
                </p>
                <Link href={`/audit-execution/${stId}/analysis?role=auditor&type=anggota`}>
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dasbor Analisis KKA
                    </Button>
                </Link>
            </div>
        );
    }

    return <ReviewerPortal stId={stId} />;
}
