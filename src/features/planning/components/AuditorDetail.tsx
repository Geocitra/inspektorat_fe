// src/features/planning/components/AuditorDetail.tsx
'use client';

import { ArrowLeft, Calendar, Shield, Award, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useAuditorStore } from '@/store/useAuditorStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditorDetailProps {
    auditorId: string;
}

export default function AuditorDetail({ auditorId }: AuditorDetailProps) {
    const { getAuditorById } = useAuditorStore();
    const auditor = getAuditorById(auditorId);

    if (!auditor) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800">Auditor Tidak Ditemukan</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6">
                    Maaf, data auditor yang Anda cari tidak terdaftar atau telah dihapus dari sistem.
                </p>
                <Link href="/planning/master-auditor">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Manajemen Auditor
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* BACK BUTTON & TITLE */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
                <Link href="/planning/master-auditor" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 w-fit">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Manajemen Auditor
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                                PEJABAT FUNGSIONAL
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 border ${
                                auditor.status === 'Tersedia'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : auditor.status === 'Ditugaskan'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {auditor.status}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">{auditor.nama}</h1>
                        <p className="text-slate-500 text-sm mt-1">NIP. {auditor.nip} &bull; Terdaftar di Sistem APIP Suite</p>
                    </div>
                </div>
            </div>

            {/* GRID PROFILE & COMPETENCIES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Info */}
                <div className="md:col-span-2 border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Kepegawaian</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                            <p className="text-sm font-bold text-slate-800">{auditor.nama}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">NIP</p>
                            <p className="text-sm font-mono text-slate-700">{auditor.nip}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Penugasan</p>
                            <p className="text-sm text-slate-700 font-semibold">{auditor.status}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Terdaftar Pada</p>
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(auditor.createdAt).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Kompetensi */}
                <div className="md:col-span-1 border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-blue-600" />
                        Keahlian & Sertifikasi
                    </h3>
                    <div className="flex flex-col gap-2">
                        {auditor.kompetensi.map((comp, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700 font-semibold rounded-none">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>{comp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIWAYAT SURAT TUGAS */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h2 className="text-base font-bold text-slate-800">Riwayat Penugasan Surat Tugas (ST)</h2>
                </div>

                <div className="border border-slate-200 bg-white rounded-none">
                    {!auditor.riwayatSt || auditor.riwayatSt.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs italic">
                            Belum ada riwayat penugasan Surat Tugas yang tercatat untuk auditor ini.
                        </div>
                    ) : (
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-slate-700 text-xs">Nomor Surat Tugas</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Tanggal Penugasan</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Objek Audit (OPD)</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[180px]">Peran Dalam Tim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditor.riwayatSt.map((st, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="font-mono text-slate-700 text-xs font-semibold">{st.noSt}</TableCell>
                                        <TableCell className="text-xs text-slate-600">
                                            {new Date(st.tgl).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-800 font-bold">{st.namaOpd}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 border ${
                                                st.peran === 'Ketua Tim'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : st.peran === 'Pengendali Teknis'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}>
                                                {st.peran}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}
