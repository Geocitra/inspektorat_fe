// src/app/(opd)/portal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Building2, ClipboardList, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OpdPortalDashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [sts, setSts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuratTugas = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/surat-tugas');
            setSts(res.data || []);
        } catch (error) {
            console.error('Gagal mengambil data Surat Tugas:', error);
            toast.error('Koneksi Gagal', { description: 'Gagal mengambil data penugasan dari server.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        fetchSuratTugas();
    }, [user]);

    if (!user) return null;

    // Filter Surat Tugas khusus untuk OPD yang sedang login
    const myOpdSts = sts.filter((st) => st.agendaAudit?.opdId === user.opdId);

    // Cari nama OPD dari data agenda audit (jika ada)
    const opdName = myOpdSts.length > 0 
        ? myOpdSts[0].agendaAudit?.opd?.namaOpd 
        : 'Organisasi Perangkat Daerah (OPD)';

    // Pisahkan penugasan berdasarkan fase pengawasan
    // 1. Audit Aktif (NHP / Tanggapan): LHP belum ditandatangani
    const activeAudits = myOpdSts.filter((st) => !st.lhp);

    // 2. Tindak Lanjut (TLHP): LHP sudah ditandatangani
    const completedAudits = myOpdSts.filter((st) => st.lhp);

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ringkasan Agenda Pengawasan</h1>
                <p className="text-slate-500 text-xs mt-1">Pantau status pemeriksaan aktif dan selesaikan tindak lanjut temuan LHP.</p>
            </div>

            {/* METRICS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-none border-slate-200 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Audit Aktif / NHP</CardTitle>
                        <ClipboardList className="h-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{activeAudits.length}</div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            Agenda pengawasan yang memerlukan tanggapan formal dinas.
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-slate-200 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tindak Lanjut (LHP)</CardTitle>
                        <RefreshCw className="h-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{completedAudits.length}</div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            LHP terbit yang memerlukan unggah berkas bukti penyelesaian.
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-none border-slate-200 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Status Kepatuhan</CardTitle>
                        <CheckCircle2 className="h-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            {completedAudits.length > 0 ? 'Aktif' : 'N/A'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            Tingkat penyelesaian rekomendasi perbaikan dari Inspektorat.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* TABEL 1: AUDIT AKTIF & RESPON NHP */}
            <Card className="rounded-none border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-100 bg-slate-50">
                    <CardTitle className="text-sm font-bold text-slate-800">Agenda Pengawasan & Tanggapan NHP</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Berikut adalah daftar penugasan aktif Inspektorat untuk dinas Anda. Silakan isi tanggapan sebelum batas waktu penyusunan LHP berakhir.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-xs text-slate-400">Memuat data penugasan...</div>
                    ) : activeAudits.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <span>Saat ini tidak ada pemeriksaan aktif atau draf NHP yang memerlukan respon dinas Anda.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-550 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="p-3 pl-6">Nomor Surat Tugas</th>
                                        <th className="p-3">Jenis Pengawasan</th>
                                        <th className="p-3">Tanggal Mulai</th>
                                        <th className="p-3 text-right pr-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeAudits.map((st) => (
                                        <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 pl-6 font-semibold text-slate-700">{st.nomorSt}</td>
                                            <td className="p-3">{st.agendaAudit?.jenisPengawasan || 'Audit'}</td>
                                            <td className="p-3">
                                                {new Date(st.tanggalMulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                            </td>
                                            <td className="p-3 text-right pr-6">
                                                <Link href={`/portal/tanggapan/${st.id}`}>
                                                    <Button className="rounded-none bg-blue-600 hover:bg-blue-700 text-[10px] h-7 px-2.5 shadow-none gap-1">
                                                        <span>Tulis Tanggapan</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TABEL 2: TINDAK LANJUT REKOMENDASI (TLHP) */}
            <Card className="rounded-none border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-100 bg-slate-50">
                    <CardTitle className="text-sm font-bold text-slate-800">Tindak Lanjut Laporan Hasil Pemeriksaan (TLHP)</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Daftar LHP formal yang telah terbit. Anda wajib mengunggah bukti perbaikan secara berkala untuk menyelesaikan temuan rekomendasi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-xs text-slate-400">Memuat data penugasan...</div>
                    ) : completedAudits.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-8 h-8 text-slate-300" />
                            <span>Dinas Anda bersih dari temuan LHP historis yang tertunda. Kepatuhan 100%.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-550 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="p-3 pl-6">Nomor LHP</th>
                                        <th className="p-3">Surat Tugas</th>
                                        <th className="p-3">Tanggal Terbit LHP</th>
                                        <th className="p-3 text-right pr-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedAudits.map((st) => (
                                        <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 pl-6 font-semibold text-slate-700">{st.lhp?.nomorLhp || 'N/A'}</td>
                                            <td className="p-3 text-slate-500">{st.nomorSt}</td>
                                            <td className="p-3">
                                                {st.lhp?.signedAt 
                                                    ? new Date(st.lhp.signedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td className="p-3 text-right pr-6">
                                                <Link href={`/portal/tlhp/${st.id}`}>
                                                    <Button className="rounded-none bg-amber-600 hover:bg-amber-700 text-[10px] h-7 px-2.5 shadow-none gap-1 text-white">
                                                        <span>Unggah Bukti (TLHP)</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
