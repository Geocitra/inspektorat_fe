// src/features/planning/components/OpdDetail.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Shield, AlertCircle, FileText,
    CheckCircle, Clock, Upload, Brain, Trash2, FileSpreadsheet, Loader2, X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useOpdStore } from '@/store/useOpdStore';
import { useKnowledgeStore } from '@/store/useKnowledgeStore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentType, KnowledgeDoc } from '@/types/knowledge.type';

interface OpdDetailProps {
    opdId: string;
}

const DOC_CATEGORIES: { label: string; type: DocumentType; description: string }[] = [
    { label: 'Renstra', type: 'RENSTRA', description: 'Rencana Strategis OPD (5 Tahun)' },
    { label: 'RKA / DPA', type: 'RKA_PERENCANAAN', description: 'Rencana Kerja Anggaran / Dokumen Pelaksanaan' },
    { label: 'Dokumen PBJ', type: 'DOKUMEN_PBJ', description: 'Kontrak, Kuitansi, SPJ Pengadaan Barang/Jasa' },
];

export default function OpdDetail({ opdId }: OpdDetailProps) {
    const { getOpdById } = useOpdStore();
    const { docList, isProcessing, currentDoc, isLoadingDocs, fetchDocuments, uploadDocument, deleteDocument } = useKnowledgeStore();
    const opd = getOpdById(opdId);

    const [activeTab, setActiveTab] = useState<'profil' | 'dokumen' | 'riwayat'>('profil');
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('RENSTRA');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch dokumen milik OPD ini dari database
    useEffect(() => {
        if (opd) {
            fetchDocuments(opd.id);
        }
    }, [opd, fetchDocuments]);

    // Filter dokumen untuk OPD ini saja
    const opdDocuments = docList.filter(doc => doc.opdId === opdId);

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

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getLabelForType = (type: DocumentType) => {
        const cat = DOC_CATEGORIES.find(c => c.type === type);
        return cat?.label || type.replace(/_/g, ' ');
    };

    const getStatusBadge = (doc: KnowledgeDoc) => {
        const status = doc.status;
        if (status === 'AKTIF' || status === 'Success') {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Aktif (RAG Ready)
                </span>
            );
        }
        if (status === 'Uploading' || status === 'Parsing' || status === 'Vectorizing') {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin" /> {status}
                </span>
            );
        }
        if (status === 'Error') {
            return (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">
                    <X className="w-3 h-3" /> Gagal
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200">
                {status}
            </span>
        );
    };

    const handleFileUpload = async (file: File) => {
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExtensions.includes(ext)) {
            toast.error('Format Tidak Didukung', {
                description: 'Harap unggah berkas PDF, Word, Excel, atau TXT.'
            });
            return;
        }
        await uploadDocument(file, selectedDocType, file.name, opdId);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const TABS = [
        { key: 'profil' as const, label: 'Profil Instansi', icon: <MapPin className="w-3.5 h-3.5" /> },
        { key: 'dokumen' as const, label: 'Dokumen OPD', icon: <FileText className="w-3.5 h-3.5" />, badge: opdDocuments.length },
        { key: 'riwayat' as const, label: 'Riwayat Audit', icon: <Shield className="w-3.5 h-3.5" />, badge: opd.auditHistory?.length || 0 },
    ];

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
                        <p className="text-slate-500 text-sm mt-1">Kelola profil, dokumen perencanaan, dan riwayat audit OPD.</p>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-0 border-b border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === tab.key
                                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="ml-1 text-[10px] font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-none">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'profil' && (
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

                    {/* Section 3: Ringkasan Dokumen */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dokumen Terdaftar di RAG</p>
                            <p className="text-sm font-bold text-slate-800">{opdDocuments.length} dokumen</p>
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
            )}

            {activeTab === 'dokumen' && (
                <div className="space-y-5">
                    {/* Upload Area */}
                    <div className="border border-slate-200 bg-white rounded-none p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-600" />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Unggah Dokumen Perencanaan</h3>
                                    <p className="text-[11px] text-slate-500">Dokumen yang diunggah akan otomatis diproses AI (chunking → embedding → RAG)</p>
                                </div>
                            </div>
                        </div>

                        {/* Kategori Dokumen */}
                        <div className="flex gap-2 flex-wrap">
                            {DOC_CATEGORIES.map(cat => (
                                <button
                                    key={cat.type}
                                    onClick={() => setSelectedDocType(cat.type)}
                                    className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
                                        selectedDocType === cat.type
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Drop Zone */}
                        <div
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                                isProcessing
                                    ? 'border-blue-300 bg-blue-50/30 cursor-wait'
                                    : dragOver
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                            }`}
                        >
                            {isProcessing ? (
                                <div className="space-y-2">
                                    <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
                                    <p className="text-xs font-bold text-blue-700">
                                        Memproses: {currentDoc?.title}
                                    </p>
                                    <p className="text-[11px] text-blue-500">
                                        {currentDoc?.status} — {currentDoc?.progress || 0}%
                                    </p>
                                    <div className="w-64 mx-auto bg-slate-200 h-1.5">
                                        <div
                                            className="bg-blue-600 h-1.5 transition-all duration-500"
                                            style={{ width: `${currentDoc?.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                    <p className="text-xs font-bold text-slate-700">
                                        Seret & Lepas berkas {getLabelForType(selectedDocType)} di sini
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        PDF, Word, Excel, atau TXT • Maks 50 MB
                                    </p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                    </div>

                    {/* Tabel Dokumen */}
                    <div className="border border-slate-200 bg-white rounded-none">
                        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Dokumen Terdaftar — {opd.namaOpd}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400">
                                {opdDocuments.length} berkas
                            </span>
                        </div>

                        {isLoadingDocs ? (
                            <div className="p-8 text-center">
                                <Loader2 className="w-6 h-6 text-slate-400 mx-auto animate-spin" />
                                <p className="text-xs text-slate-500 mt-2">Memuat daftar dokumen...</p>
                            </div>
                        ) : opdDocuments.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-600">Belum Ada Dokumen</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Unggah dokumen Renstra, RKA, atau PBJ menggunakan area di atas.
                                </p>
                            </div>
                        ) : (
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[40px] font-bold text-slate-700 text-xs">No</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Nama Berkas</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Kategori</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Ukuran</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Status AI</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs">Chunks</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-xs text-right w-[80px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opdDocuments.map((doc, idx) => (
                                        <TableRow key={doc.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                            <TableCell className="font-mono text-slate-400 text-xs">{idx + 1}</TableCell>
                                            <TableCell>
                                                <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={doc.title}>
                                                    {doc.title}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                                                    {getLabelForType(doc.type)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 font-mono">
                                                {formatBytes(doc.metadata?.fileSize)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(doc)}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono font-bold text-slate-700">
                                                {doc.metadata?.totalChunks || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-500"
                                                    onClick={() => {
                                                        if (window.confirm(`Hapus dokumen "${doc.title}"? Vektor AI juga akan dihapus.`)) {
                                                            deleteDocument(doc.id);
                                                        }
                                                    }}
                                                    title="Hapus Dokumen"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'riwayat' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2">
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
            )}
        </div>
    );
}
