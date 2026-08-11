// src/app/(dashboard)/pelaporan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStStore } from '@/store/useStStore';
import { useReportStore } from '@/store/useReportStore';
import { FileCheck, ArrowRight, ShieldCheck, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PelaporanHubPage() {
    const { user } = useAuthStore();
    const { stList } = useStStore();
    const { nhpList } = useReportStore();

    const [activeRole, setActiveRole] = useState<string>('');
    const [activeAuditorId, setActiveAuditorId] = useState('auditor-1'); // Default Budi (Leader)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role')?.toUpperCase();
            const urlType = params.get('type')?.toLowerCase();

            if (urlRole === 'INSPEKTUR' || urlRole === 'APIP_PIMPINAN') {
                setActiveRole('APIP_PIMPINAN');
            } else if (urlRole === 'KASUBAG' || urlRole === 'APIP_INTERNAL') {
                setActiveRole('APIP_INTERNAL');
            } else if (urlRole === 'AUDITOR') {
                setActiveRole('AUDITOR');
            } else if (user?.role) {
                setActiveRole(user.role);
            }

            if (urlType === 'anggota') {
                setActiveAuditorId('auditor-2'); // Siti
            } else {
                setActiveAuditorId('auditor-1'); // Budi
            }
        }
    }, [user]);

    // Hanya tampilkan Surat Tugas yang PUBLISHED atau SELESAI
    const reportStList = stList.filter(st => st.status === 'PUBLISHED' || st.status === 'SELESAI');

    const isKasubag = activeRole === 'APIP_INTERNAL';
    const isInspektur = activeRole === 'APIP_PIMPINAN';
    const isAuditor = activeRole === 'AUDITOR';

    if (isKasubag) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 font-sans">Akses Ditolak</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Maaf, Anda tidak memiliki wewenang untuk mengakses modul Pelaporan Hasil Audit.
                </p>
                <Link href="/">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        Kembali ke Dashboard Utama
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileCheck className="w-6 h-6 text-blue-600" />
                        Pusat Pelaporan Audit (NHP & LHP)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Siklus penyerahan naskah temuan, sanggahan auditee, dan pengesahan LHP.
                    </p>
                </div>

                {/* SIMULATOR BAR */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Simulasi Hub:</span>
                    <Link href="/pelaporan?role=auditor&type=ketua">
                        <Button variant="outline" size="sm" className={`h-6 text-[9px] rounded-none shadow-none ${isAuditor && activeAuditorId === 'auditor-1' ? 'bg-slate-800 text-white' : ''}`}>
                            Auditor (Leader)
                        </Button>
                    </Link>
                    <Link href="/pelaporan?role=auditor&type=anggota">
                        <Button variant="outline" size="sm" className={`h-6 text-[9px] rounded-none shadow-none ${isAuditor && activeAuditorId === 'auditor-2' ? 'bg-slate-800 text-white' : ''}`}>
                            Auditor (Anggota)
                        </Button>
                    </Link>
                    <Link href="/pelaporan?role=inspektur">
                        <Button variant="outline" size="sm" className={`h-6 text-[9px] rounded-none shadow-none ${isInspektur ? 'bg-slate-800 text-white' : ''}`}>
                            Inspektur
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ST LIST FOR REPORTING */}
            <div className="border border-slate-200 bg-white rounded-none">
                {reportStList.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <FileCheck className="w-10 h-10 text-slate-350 mb-2" />
                        <h4 className="text-xs font-bold text-slate-700">Belum Ada Surat Tugas Aktif</h4>
                        <p className="text-slate-400 text-xs mt-1">
                            Hanya Surat Tugas berstatus PUBLISHED/SELESAI yang dapat diproses laporannya.
                        </p>
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="font-bold text-slate-700 text-xs w-[130px]">No ST</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[180px]">OPD Auditee</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Agenda Pengawasan</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Status ST</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[130px]">Fase Laporan</TableHead>
                                <TableHead className="text-right font-bold text-slate-700 text-xs w-[200px]">Aksi Workspace</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportStList.map((st) => {
                                const nhp = nhpList.find(n => n.stId === st.id);
                                const isLeader = st.ketuaTimId === activeAuditorId;
                                const showPortalHref = `/portal/tanggapan/${st.id}`;

                                return (
                                    <TableRow key={st.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="font-mono text-xs font-bold text-slate-800">{st.noSt}</TableCell>
                                        <TableCell className="text-xs font-semibold text-slate-750">{st.namaOpd}</TableCell>
                                        <TableCell className="text-xs text-slate-650 leading-relaxed font-sans">{st.namaAudit}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border rounded-none ${
                                                st.status === 'SELESAI'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {st.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] text-slate-550 font-bold uppercase">
                                                {nhp?.status.replace('_', ' ') || 'BELUM DRAFT'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5 items-center">
                                                
                                                {/* Button view to OPD portal */}
                                                {nhp && (
                                                    <Link href={showPortalHref} target="_blank">
                                                        <Button 
                                                            variant="outline" 
                                                            className="rounded-none border-slate-200 text-[10px] h-7 px-2 shadow-none hover:bg-slate-50 flex items-center gap-1"
                                                            title="Buka Portal Auditee (External)"
                                                        >
                                                            Portal OPD
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Kasubag / Read-only viewer */}
                                                {isKasubag && (
                                                    <Link href={`/pelaporan/lhp/${st.id}?role=kasubag`}>
                                                        <Button className="bg-slate-800 hover:bg-slate-900 rounded-none text-[10px] h-7 px-2.5 shadow-none font-bold">
                                                            Lihat LHP
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Inspektur (TTE Final) */}
                                                {isInspektur && (
                                                    <Link href={`/pelaporan/lhp/${st.id}?role=inspektur`}>
                                                        <Button className="bg-green-600 hover:bg-green-700 text-white rounded-none text-[10px] h-7 px-2.5 shadow-none font-bold">
                                                            Kelola LHP
                                                        </Button>
                                                    </Link>
                                                )}

                                                {/* Auditor (NHP workspace) */}
                                                {isAuditor && (
                                                    <Link href={`/pelaporan/nhp/${st.id}?role=auditor&type=${isLeader ? 'ketua' : 'anggota'}`}>
                                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-[10px] h-7 px-2.5 shadow-none font-bold flex items-center gap-0.5">
                                                            {isLeader ? 'Kelola NHP' : 'Lihat NHP'}
                                                            <ArrowRight className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}

                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
