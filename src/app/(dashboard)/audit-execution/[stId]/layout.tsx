// src/app/(dashboard)/audit-execution/[stId]/layout.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStStore } from '@/store/useStStore';
import { useAuditorStore } from '@/store/useAuditorStore';
import { AlertCircle, FileText, UserCheck, ShieldAlert, Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AuditExecutionLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ stId: string }>;
}) {
    const resolvedParams = use(params);
    const { stId } = resolvedParams;
    const pathname = usePathname();
    const router = useRouter();

    const { user } = useAuthStore();
    const { stList } = useStStore();
    const { auditorList } = useAuditorStore();

    // 1. Validasi keberadaan Surat Tugas
    const st = stList.find(s => s.id === stId);

    // 2. Deteksi Peran Uji Coba Cepat (Ketua vs Anggota) via Query Parameter (?type=ketua)
    const [activeAuditorId, setActiveAuditorId] = useState('auditor-2'); // Default Siti Rahma (Anggota)
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const urlType = searchParams.get('type')?.toLowerCase();
            const urlRole = searchParams.get('role')?.toUpperCase();

            // Set role
            if (urlRole) {
                setActiveRole(urlRole);
            } else if (user?.role) {
                setActiveRole(user.role);
            }

            // Set pegawai ID based on type
            if (urlType === 'ketua') {
                setActiveAuditorId('auditor-1'); // Budi Santoso (Ketua)
            } else if (urlType === 'anggota') {
                setActiveAuditorId('auditor-2'); // Siti Rahma (Anggota)
            } else {
                // Sesuai user yang login
                if (user?.role === 'AUDITOR') {
                    // Default ke Budi jika dia adalah ketua di ST ini
                    setActiveAuditorId(st?.ketuaTimId === 'auditor-1' ? 'auditor-1' : 'auditor-2');
                }
            }
        }
    }, [user, st]);

    if (!st || st.status !== 'PUBLISHED') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Surat Tugas Tidak Valid</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Surat Tugas yang Anda cari tidak ditemukan atau belum disahkan oleh Inspektur Utama (Status masih DRAFT/PENDING).
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Beranda
                    </Button>
                </Link>
            </div>
        );
    }

    // 3. CONTEXTUAL ACCESS GUARD: Cek apakah user adalah Tim Audit yang terdaftar
    const isKetua = st.ketuaTimId === activeAuditorId;
    const isAnggota = st.anggotaIds.includes(activeAuditorId);
    const isAssigned = isKetua || isAnggota;

    // Redirect Ketua Tim away from /upload page
    useEffect(() => {
        if (isAssigned && isKetua && pathname.endsWith('/upload')) {
            router.replace(`/audit-execution/${stId}/review?role=auditor&type=ketua`);
        }
    }, [isAssigned, isKetua, pathname, stId, router]);

    const isSystemAuditor = activeRole === 'AUDITOR';

    // Jika yang login bukan AUDITOR (atau override role), block akses!
    if (!isSystemAuditor) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Layar Terkunci</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Modul Eksekusi KKA & Deteksi Anomali hanya dapat diakses oleh akun dengan peran **Tim Audit (Auditor)**. Anda masuk sebagai {activeRole}.
                </p>
                <Link href="/login">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Login sebagai Auditor
                    </Button>
                </Link>
            </div>
        );
    }

    // Jika auditor tidak terdaftar dalam tim ST tersebut, block akses! (Contextual Access)
    if (!isAssigned) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak (Bukan Tim ST)</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Sesuai dengan Aturan Keamanan Kontekstual, Anda tidak diperkenankan mengakses KKA Surat Tugas ini karena nama Anda tidak terdaftar di dalam tim pemeriksa ST {st.noSt}.
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dashboard Utama
                    </Button>
                </Link>
            </div>
        );
    }

    const currentAuditorName = auditorList.find(a => a.id === activeAuditorId)?.nama || 'Unknown';

    // Rute sub-menu
    const uploadHref = `/audit-execution/${stId}/upload?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;
    const analysisHref = `/audit-execution/${stId}/analysis?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;
    const reviewHref = `/audit-execution/${stId}/review?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* AUDIT TIM HEADER BAR */}
            <div className="border border-slate-200 bg-white p-4 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        Tim Audit Aktif &bull; {st.noSt}
                    </p>
                    <h2 className="text-sm font-bold text-slate-800 leading-normal">
                        Auditor: <strong className="text-blue-600">{currentAuditorName}</strong> ({isKetua ? 'Ketua Tim' : 'Anggota Tim'})
                    </h2>
                </div>

                {/* QUICK SWITCHER PRESETS FOR TESTING */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Simulasi Peran Tim:</span>
                    <Link href={`/audit-execution/${stId}/upload?role=auditor&type=anggota`}>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`rounded-none text-[9px] h-6 px-2 shadow-none border-slate-200 ${!isKetua ? 'bg-slate-800 text-white hover:bg-slate-800' : 'text-slate-650 hover:bg-slate-50'}`}
                        >
                            Sebagai Anggota
                        </Button>
                    </Link>
                    <Link href={`/audit-execution/${stId}/review?role=auditor&type=ketua`}>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`rounded-none text-[9px] h-6 px-2 shadow-none border-slate-200 ${isKetua ? 'bg-slate-800 text-white hover:bg-slate-800' : 'text-slate-650 hover:bg-slate-50'}`}
                        >
                            Sebagai Ketua Tim
                        </Button>
                    </Link>
                </div>
            </div>

            {/* TAB MENU WORKSPACE */}
            <div className="flex border-b border-slate-200 bg-slate-50">
                {!isKetua && (
                    <Link
                        href={uploadHref}
                        className={`px-4 py-3 text-xs font-bold border-r border-slate-200 flex items-center gap-1.5 transition-all ${
                            pathname.endsWith('/upload')
                                ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                                : 'text-slate-650 hover:bg-slate-100'
                        }`}
                    >
                        1. Upload SPJ
                    </Link>
                )}
                <Link
                    href={analysisHref}
                    className={`px-4 py-3 text-xs font-bold border-r border-slate-200 flex items-center gap-1.5 transition-all ${
                        pathname.endsWith('/analysis')
                            ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    2. AI Anomaly Dashboard
                </Link>
                
                {/* Hanya Ketua Tim yang memiliki tombol review */}
                {isKetua && (
                    <Link
                        href={reviewHref}
                        className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition-all ${
                            pathname.endsWith('/review')
                                ? 'bg-white border-t-2 border-t-blue-600 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        3. Review Ketua Tim
                    </Link>
                )}
            </div>

            {/* CHILD CONTENTS */}
            <div>{children}</div>
        </div>
    );
}
