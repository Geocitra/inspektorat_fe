// src/app/(opd)/portal/dokumen/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useKnowledgeStore } from '@/store/useKnowledgeStore';
import { DocumentType, KnowledgeDoc } from '@/types/knowledge.type';
import { toast } from 'sonner';
import {
    FileText, Upload, Brain, Trash2, CheckCircle, Loader2, X,
    FileSpreadsheet, Info, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DOC_CATEGORIES: { label: string; type: DocumentType; description: string }[] = [
    { label: 'Renstra', type: 'RENSTRA', description: 'Rencana Strategis OPD (5 Tahun)' },
    { label: 'RKA / DPA', type: 'RKA_PERENCANAAN', description: 'Rencana Kerja Anggaran / Dokumen Pelaksanaan' },
];

export default function PortalDokumenPage() {
    const { user } = useAuthStore();
    const { docList, isProcessing, currentDoc, isLoadingDocs, fetchDocuments, uploadDocument, deleteDocument } = useKnowledgeStore();

    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('RENSTRA');
    const [dragOver, setDragOver] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // OPD ID dari sesi login user
    const opdId = user?.opdId;

    useEffect(() => {
        if (mounted && opdId) {
            fetchDocuments(opdId);
        }
    }, [mounted, opdId, fetchDocuments]);

    // Filter dokumen milik OPD saja
    const opdDocuments = docList.filter(doc => doc.opdId === opdId);

    if (!mounted) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="h-10 bg-slate-100 animate-pulse rounded-none w-72" />
                <div className="h-48 bg-slate-100 animate-pulse rounded-none" />
            </div>
        );
    }

    if (!opdId) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800">Akun Belum Terhubung ke OPD</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Akun Anda belum terhubung ke Organisasi Perangkat Daerah. Hubungi Kasubag Perencanaan untuk mengaitkan akun Anda.
                </p>
            </div>
        );
    }

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
                    <CheckCircle className="w-3 h-3" /> Aktif
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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* HEADER */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Dokumen Perencanaan Dinas
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Unggah dokumen Renstra dan RKA dinas Anda untuk dianalisis oleh sistem AI audit internal.
                </p>
            </div>

            {/* INFORMASI */}
            <div className="bg-blue-50 border border-blue-200 p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-bold">Mengapa perlu mengunggah dokumen?</p>
                    <p className="text-blue-700 leading-relaxed">
                        Dokumen Renstra dan RKA akan diproses oleh AI untuk membandingkan program kerja dengan realisasi anggaran.
                        Ini membantu tim audit mengidentifikasi potensi ketidaksesuaian secara otomatis — bukan untuk menilai, melainkan untuk memastikan transparansi.
                    </p>
                </div>
            </div>

            {/* UPLOAD AREA */}
            <div className="border border-slate-200 bg-white rounded-none p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Unggah Dokumen</h3>
                        <p className="text-[11px] text-slate-500">Pilih kategori dokumen, lalu seret berkas ke area di bawah</p>
                    </div>
                </div>

                {/* Kategori */}
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

            {/* DAFTAR DOKUMEN */}
            <div className="border border-slate-200 bg-white rounded-none">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Dokumen yang Telah Diunggah
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
                            Unggah dokumen Renstra atau RKA dinas Anda menggunakan area di atas.
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
                                <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
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
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-500"
                                            onClick={() => {
                                                if (window.confirm(`Hapus dokumen "${doc.title}"?`)) {
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
    );
}
