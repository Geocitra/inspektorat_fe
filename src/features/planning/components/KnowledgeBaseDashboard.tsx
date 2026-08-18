// src/features/planning/components/KnowledgeBaseDashboard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useKnowledgeStore } from '@/store/useKnowledgeStore';
import { DocumentType, KnowledgeDoc } from '@/types/knowledge.type';
import {
    UploadCloud, FileText, Trash2, CheckCircle, Brain, RefreshCw,
    AlertCircle, Database, HardDrive, Cpu, Zap, BookOpen, Check
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function KnowledgeBaseDashboard() {
    const {
        docList, isProcessing, currentDoc, isLoadingDocs,
        fetchDocuments, uploadDocument, deleteDocument, clearCurrentDoc
    } = useKnowledgeStore();

    const [uiCategory, setUiCategory] = useState<'SOP Audit' | 'Peraturan Daerah' | 'SSH'>('SOP Audit');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processUploadedFile(e.target.files[0]);
        }
    };

    const processUploadedFile = async (file: File) => {
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            toast.error('File Ditolak', {
                description: 'Format dokumen tidak didukung. Harap unggah berkas PDF, Word, Excel, atau TXT.'
            });
            return;
        }

        let dbType: DocumentType = 'LAINNYA';
        if (uiCategory === 'SOP Audit') dbType = 'REGULASI_INTERNAL';
        if (uiCategory === 'Peraturan Daerah') dbType = 'REGULASI_DAERAH';
        if (uiCategory === 'SSH') dbType = 'TEMPLATES';

        await uploadDocument(file, dbType, file.name);
    };

    const getStepStatus = (step: 'upload' | 'parse' | 'vector', doc: KnowledgeDoc | null) => {
        if (!doc) return 'pending';
        const status = doc.status;
        switch (step) {
            case 'upload':
                return 'completed';
            case 'parse':
                if (status === 'Parsing' || status === 'Uploading') return 'active';
                if (status === 'Vectorizing' || status === 'Success' || status === 'AKTIF') return 'completed';
                return 'pending';
            case 'vector':
                if (status === 'Vectorizing') return 'active';
                if (status === 'Success' || status === 'AKTIF') return 'completed';
                return 'pending';
            default:
                return 'pending';
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getLabelForType = (type: DocumentType) => {
        if (type === 'REGULASI_INTERNAL') return 'SOP Audit';
        if (type === 'REGULASI_DAERAH') return 'Peraturan Daerah';
        if (type === 'TEMPLATES') return 'Standar Harga / Template';
        if (type === 'RENSTRA') return 'Renstra OPD';
        if (type === 'DOKUMEN_PBJ') return 'Dokumen PBJ';
        if (type === 'RKA_PERENCANAAN') return 'RKA / DPA';
        return type.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                        Knowledge Base Ingestion (Live DB)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Unggah dokumen regulasi daerah, SOP, dan pedoman untuk dilatih ke dalam RAG AI Audit Engine.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 border border-slate-200 bg-white rounded-none divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none">
                        <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vector DB Provider</p>
                        <p className="text-sm font-bold text-slate-800">PostgreSQL (pgvector)</p>
                    </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dokumen Ingesti</p>
                        <p className="text-sm font-bold text-slate-800">{docList.length} Berkas</p>
                    </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none">
                        <Cpu className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Embedding Model</p>
                        <p className="text-sm font-bold text-slate-800">text-embedding-3-small</p>
                    </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none">
                        <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Pipeline</p>
                        <p className="text-sm font-bold text-slate-800">BullMQ (Async)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Kategori Pengetahuan</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {[
                            { name: 'SOP Audit', desc: 'Pedoman standar operasional pemeriksaan auditor.' },
                            { name: 'Peraturan Daerah', desc: 'Aturan hukum & perda daerah setempat.' },
                            { name: 'SSH', desc: 'Standar Satuan Harga untuk referensi PBJ.' }
                        ].map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setUiCategory(cat.name as any)}
                                disabled={isProcessing}
                                className={`p-3.5 text-left border rounded-none transition-all flex justify-between items-start gap-2 ${uiCategory === cat.name
                                    ? 'bg-blue-50/50 border-blue-600 ring-0'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                    } disabled:opacity-50`}
                            >
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">{cat.name}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{cat.desc}</p>
                                </div>
                                {uiCategory === cat.name && (
                                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <UploadCloud className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Unggah File Dokumen</h3>
                    </div>

                    <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`h-40 border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all rounded-none ${dragActive
                            ? 'border-blue-600 bg-blue-50/20'
                            : 'border-slate-300 bg-white hover:bg-slate-50'
                            } ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        onClick={() => {
                            if (!isProcessing) onButtonClick();
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                            {isProcessing ? 'Sistem sedang memproses dokumen...' : 'Drag & Drop Berkas di Sini'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {!isProcessing && 'atau klik untuk menelusuri folder (PDF, Word, Excel, TXT)'}
                        </p>
                    </div>
                </div>
            </div>

            {currentDoc && (
                <div className="border border-blue-200 bg-blue-50/30 p-5 rounded-none space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 truncate max-w-50 sm:max-w-md">
                                {currentDoc.title}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono bg-white text-blue-600 border border-blue-200 px-2 py-0.5 font-bold">
                            {getLabelForType(currentDoc.type)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="flex items-start gap-2.5">
                            <div className="bg-emerald-500 text-white rounded-none p-1 shrink-0">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">1. Server Received</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">File diterima via API & Disk I/O.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <div className={`rounded-none p-1 shrink-0 border ${getStepStatus('parse', currentDoc) === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : getStepStatus('parse', currentDoc) === 'active'
                                    ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                {getStepStatus('parse', currentDoc) === 'completed' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <RefreshCw className={`w-4 h-4 ${getStepStatus('parse', currentDoc) === 'active' ? 'animate-spin' : ''}`} />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">2. Async BullMQ Worker</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Parsing, Text Sanitization & Semantic Chunking.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <div className={`rounded-none p-1 shrink-0 border ${getStepStatus('vector', currentDoc) === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : getStepStatus('vector', currentDoc) === 'active'
                                    ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                {getStepStatus('vector', currentDoc) === 'completed' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <RefreshCw className={`w-4 h-4 ${getStepStatus('vector', currentDoc) === 'active' ? 'animate-spin' : ''}`} />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">3. AI Embedding & pgvector</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    OpenAI API Call & Database Transaction.
                                </p>
                            </div>
                        </div>
                    </div>

                    { }
                    {isProcessing && (
                        <div className="pt-2">
                            <div className="h-1.5 w-full bg-blue-100 border border-blue-200 overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${currentDoc.progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-blue-800 mt-1 text-right">{currentDoc.progress}%</p>
                        </div>
                    )}

                    {currentDoc.status === 'Success' && (
                        <div className="pt-2 flex justify-end">
                            <Button
                                onClick={clearCurrentDoc}
                                size="sm"
                                className="bg-slate-800 hover:bg-slate-900 rounded-none text-xs shadow-none"
                            >
                                Bersihkan Log Pipeline
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Regulasi Terindeks ({docList.length})</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchDocuments()}
                        disabled={isLoadingDocs}
                        className="h-6 text-[10px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-none"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                        Segarkan Database
                    </Button>
                </div>

                <div className="border border-slate-200 bg-white rounded-none relative">
                    {isLoadingDocs && docList.length === 0 ? (
                        <div className="p-12 text-center text-blue-600 flex flex-col items-center">
                            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs font-bold">Mengambil data dari PostgreSQL...</span>
                        </div>
                    ) : docList.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-xs italic">
                            Database Vektor kosong. Silakan unggah dokumen regulasi pertama Anda.
                        </div>
                    ) : (
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12.5 font-bold text-slate-700 text-xs">No</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Judul Dokumen</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-45">Tipe (RAG Context)</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-center w-30">Ukuran File</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-center w-30">Total Chunks</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-35">Status DB</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 text-xs w-25">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docList.map((doc, index) => (
                                    <TableRow key={doc.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="font-mono text-slate-400 text-xs">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="font-semibold text-slate-800 text-xs truncate max-w-62.5" title={doc.title}>
                                                    {doc.title}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                                                {getLabelForType(doc.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-[11px] text-slate-500">
                                            {formatBytes(doc.metadata?.fileSize)}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-[11px] font-bold text-slate-700">
                                            {doc.metadata?.totalChunks || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border uppercase ${doc.status === 'AKTIF'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {doc.status === 'AKTIF' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                                                {doc.status === 'AKTIF' ? 'READY (RAG)' : doc.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600"
                                                onClick={() => {
                                                    if (window.confirm(`PERINGATAN: Menghapus "${doc.title}" akan menghancurkan data vektor AI secara permanen. Lanjutkan?`)) {
                                                        deleteDocument(doc.id);
                                                    }
                                                }}
                                                title="Hapus Permanen dari DB"
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
        </div>
    );
}