// src/app/(dashboard)/page.tsx
'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function DashboardHomePage() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Utama</h1>
                <p className="text-slate-500 mt-1">Selamat datang kembali di Pusat Kendali APIP Suite.</p>
            </div>

            <Card className="bg-blue-600 text-white shadow-md border-0">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ShieldCheck className="w-6 h-6 text-blue-200" />
                        Status Keamanan Aktif
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-blue-100">
                        Anda masuk sebagai <strong className="text-white">{user?.email}</strong> dengan hak akses <strong className="text-white">{user?.role}</strong>.
                        Semua aktivitas di dalam sistem ini terekam dan dilindungi oleh Security Ledger yang bersifat *Immutable*.
                    </p>
                </CardContent>
            </Card>

            {/* Di fase-fase berikutnya, kita bisa menambahkan grafik atau statistik di sini */}
        </div>
    );
}