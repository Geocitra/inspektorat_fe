// src/app/(dashboard)/audit-execution/[stId]/layout.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStDetailQuery, useStListQuery } from '@/hooks/queries/useSt';
import { useAuditorStore } from '@/store/useAuditorStore';
import { AlertCircle, FileText, UserCheck, ShieldAlert, Sparkles, LogIn, Loader2 } from 'lucide-react';
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
    const { auditorList } = useAuditorStore();

    // 1. Fetch data ST langsung dari backend via React Query
    const { data: st, isLoading: isLoadingSt } = useStDetailQuery(stId);

    // 2. Deteksi Peran Uji Coba Cepat (Ketua vs Anggota) via Query Parameter
    const [activeAuditorId, setActiveAuditorId] = useState('');
    const [activeRole, setActiveRole] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const urlType = searchParams.get('type')?.toLowerCase();
            const urlRole = searchParams.get('role')?.toUpperCase();

            // Set role aktif
            if (urlRole) {
                setActiveRole(urlRole);
            } else if (user?.role) {
                setActiveRole(user.role);
            }

            // Set pegawai ID secara dinamis
            if (urlType === 'ketua' && st?.ketuaTimId) {
                setActiveAuditorId(st.ketuaTimId);
            } else if (urlType === 'anggota' && st?.anggotaIds && st.anggotaIds.length > 0) {
                setActiveAuditorId(st.anggotaIds[0]);
            } else if (user?.pegawaiId) {
                setActiveAuditorId(user.pegawaiId);
            } else if (st?.ketuaTimId) {
                setActiveAuditorId(st.ketuaTimId);
            }
        }
    }, [user, st]);

    if (isLoadingSt) {
        return (
            <div className="max-w-md mx-auto my-20 text-center p-8 border border-slate-200 bg-white">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Memuat Workspace Audit...</h3>
                <p className="text-xs text-slate-400 mt-1">Mengambil data penugasan Surat Tugas dari server.</p>
            </div>
        );
    }

    const isStValid = st && (st.status === 'PUBLISHED' || st.status === 'SELESAI' || !!st.tteHash);

    if (!st || !isStValid) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Surat Tugas Belum Disahkan</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Surat Tugas ini belum disahkan secara elektronik (TTE) oleh Inspektur Utama. Silakan sahkan terlebih dahulu di menu Pengesahan ST.
                </p>
                <Link href="/penugasan/draf-st">
                    <Button className="rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs w-full shadow-none font-bold">
                        Buka Menu Pengesahan ST
                    </Button>
                </Link>
            </div>
        );
    }

    // 3. CONTEXTUAL ACCESS GUARD: Cek apakah user adalah Tim Audit yang terdaftar
    const isKetua = st.ketuaTimId === activeAuditorId;
    const isAnggota = Array.isArray(st.anggotaIds) && st.anggotaIds.includes(activeAuditorId);
    // Beri kelonggaran akses jika role adalah AUDITOR, PIMPINAN, atau KASUBAG
    const isAssigned = isKetua || isAnggota || activeRole === 'APIP_PIMPINAN' || activeRole === 'APIP_INTERNAL' || activeRole === 'AUDITOR';

    // Rute sub-menu
    const uploadHref = `/audit-execution/${stId}/upload?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;
    const analysisHref = `/audit-execution/${stId}/analysis?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;
    const reviewHref = `/audit-execution/${stId}/review?role=auditor&type=${isKetua ? 'ketua' : 'anggota'}`;

    const currentAuditorName = auditorList.find(a => a.id === activeAuditorId)?.nama || (isKetua ? 'Ketua Tim Pemeriksa' : 'Anggota Tim Pemeriksa');

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* AUDIT TIM HEADER BAR */}
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-400 px-2 py-0.5 border border-blue-500/30 font-mono">
                            ST ACTIVE &bull; {st.noSt}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            {st.tglMulai} s.d. {st.tglSelesai}
                        </span>
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        {st.namaAudit}
                    </h1>
                    <p className="text-xs text-slate-400">
                        Sasaran Objek Audit: <strong className="text-slate-200">{st.namaOpd}</strong> &bull; Lokasi: {st.lokasi}
                    </p>
                </div>

                {/* ROLE SWITCHER TOGGLE (KETUA VS ANGGOTA) */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        Mode Auditor Aktif:
                    </span>
                    <div className="flex items-center border border-slate-700 bg-slate-800 p-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveAuditorId(st.ketuaTimId);
                                router.push(`/audit-execution/${stId}/review?role=auditor&type=ketua`);
                            }}
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${
                                isKetua 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Ketua Tim (Review &amp; NHP)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const firstAnggota = st.anggotaIds?.[0] || 'auditor-2';
                                setActiveAuditorId(firstAnggota);
                                router.push(`/audit-execution/${stId}/upload?role=auditor&type=anggota`);
                            }}
                            className={`px-3 py-1 text-xs font-semibold transition-colors ${
                                !isKetua 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Anggota (Unggah KKA)
                        </button>
                    </div>
                </div>
            </div>

            {/* SUB-NAVIGASI TABS WORKSPACE KKA */}
            <div className="flex border-b border-slate-200 bg-white px-2">
                <Link
                    href={uploadHref}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                        pathname.endsWith('/upload')
                            ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    1. Unggah KKA &amp; Bukti Sampling
                </Link>
                <Link
                    href={analysisHref}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                        pathname.endsWith('/analysis')
                            ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    2. Analisis AI &amp; Deteksi Anomali
                </Link>
                <Link
                    href={reviewHref}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                        pathname.endsWith('/review')
                            ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                    3. Reviu KKA &amp; Penerbitan NHP
                </Link>
            </div>

            {/* CONTENT WORKSPACE */}
            {children}
        </div>
    );
}
