// src/features/planning/components/OpdDetail.tsx
'use client';

import { use } from 'react';
import { ArrowLeft, MapPin, DollarSign, Calendar, Shield, AlertCircle, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

import { useOpdStore } from '@/store/useOpdStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OpdDetailProps {
    opdId: string;
}

export default function OpdDetail({ opdId }: OpdDetailProps) {
    const { getOpdById } = useOpdStore();
    const opd = getOpdById(opdId);

    if (!opd) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800">OPD Tidak Ditemukan</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6">
                    Maaf, data instansi yang Anda cari tidak terdaftar atau telah dihapus dari sistem.
                </p>
                <Link href="/planning/master-opd">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master OPD
                    </Button>
                </Link>
            </div>
        );
    }

    // Format Rupiah
    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="space-y-6">
            {/* BACK BUTTON & TITLE */}
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
                <Link href="/planning/master-opd" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 w-fit">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Master OPD
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                            {opd.kode}
                        </span>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">{opd.namaOpd}</h1>
                        <p className="text-slate-500 text-sm mt-1">Informasi lengkap profil instansi dan riwayat pengawasan internal.</p>
                    </div>
                </div>
            </div>

            {/* DETAIL PROFIL */}
            <div className="border border-slate-200 bg-white rounded-none divide-y divide-slate-200">
                {/* Section 1: Ringkasan Info */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Instansi</p>
                        <p className="text-sm font-bold text-slate-800">{opd.namaOpd}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kode Instansi</p>
                        <p className="text-sm font-mono font-bold text-slate-700">{opd.kode}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pagu Anggaran Tahun Ini</p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            {formatRupiah(opd.paguAnggaran)}
                        </p>
                    </div>
                </div>

                {/* Section 2: Alamat & Lokasi */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alamat Kantor</p>
                        <p className="text-sm text-slate-700">{opd.alamat}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Koordinat Geografis (Anti-Fraud GPS)</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 mt-1">
                            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 border border-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                {opd.gpsKoordinat}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Dokumen Kelengkapan */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dokumen RKA / Renstra</p>
                        {opd.rkaFileName ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-emerald-50/50 border border-emerald-200 px-3 py-2 w-fit mt-1">
                                <FileText className="w-4 h-4 text-green-600" />
                                {opd.rkaFileName}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic mt-1">Belum ada dokumen perencanaan (RKA/Renstra) yang diunggah.</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Registrasi Sistem</p>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(opd.createdAt).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* TABEL HISTORI AUDIT */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <h2 className="text-base font-bold text-slate-800">Histori Pemeriksaan & Audit</h2>
                </div>

                <div className="border border-slate-200 bg-white rounded-none">
                    {!opd.auditHistory || opd.auditHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs italic">
                            Belum ada riwayat audit yang tercatat untuk dinas ini.
                        </div>
                    ) : (
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[80px] font-bold text-slate-700 text-xs">Tahun</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Nomor Surat Tugas</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Tim Pemeriksa</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-center">Jumlah Temuan</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[180px]">Status Audit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {opd.auditHistory.map((audit) => (
                                    <TableRow key={audit.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="font-mono text-slate-700 text-xs font-semibold">{audit.tahun}</TableCell>
                                        <TableCell className="font-mono text-slate-800 text-xs">{audit.nomorSuratTugas}</TableCell>
                                        <TableCell className="text-xs text-slate-700 font-medium">{audit.timAudit}</TableCell>
                                        <TableCell className="text-xs font-mono font-bold text-slate-800 text-center">
                                            {audit.temuanCount} Temuan
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border text-xs font-semibold rounded-none ${
                                                audit.status === 'Selesai'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : audit.status === 'Dalam Pengawasan'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}>
                                                {audit.status === 'Selesai' ? (
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                )}
                                                {audit.status}
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
