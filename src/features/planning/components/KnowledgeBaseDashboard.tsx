// src/features/planning/components/KnowledgeBaseDashboard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useKnowledgeStore } from '@/store/useKnowledgeStore';
import { DocumentType, KnowledgeDoc } from '@/types/knowledge.type';
import {
    UploadCloud, FileText, Trash2, CheckCircle, Brain, RefreshCw,
    AlertCircle, Database, HardDrive, Cpu, Zap, BookOpen, Check, Eye
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControl } from '@/components/ui/pagination-control';
import DocDetailModal from './DocDetailModal';

export default function KnowledgeBaseDashboard() {
    const {
        docList, isProcessing, currentDoc, isLoadingDocs,
        fetchDocuments, uploadDocument, deleteDocument, clearCurrentDoc
    } = useKnowledgeStore();

    const [uiCategory, setUiCategory] = useState<'SOP Audit' | 'Peraturan Daerah' | 'SSH'>('SOP Audit');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal Detail Doc & Chunk Inspector
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

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
        const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls'];
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(fileExt)) {
            toast.error('Format File Ditolak', {
                description: 'Hanya berkas .pdf, .docx, dan .xlsx yang didukung oleh parser AI.'
            });
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            toast.error('Ukuran File Terlalu Besar', {
                description: 'Batas maksimum ukuran berkas adalah 25MB.'
            });
            return;
        }

        let docType: DocumentType = 'REGULASI_INTERNAL';
        if (uiCategory === 'Peraturan Daerah') docType = 'REGULASI_DAERAH';
        if (uiCategory === 'SSH') docType = 'TEMPLATES';

        const rawTitle = file.name.replace(/\.[^/.]+$/, "");

        try {
            await uploadDocument(file, docType, rawTitle);
        } catch (error) {
            // Error ditangani di store
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getLabelForType = (type: DocumentType) => {
        switch (type) {
            case 'REGULASI_INTERNAL': return 'SOP & Petunjuk Teknis';
            case 'REGULASI_DAERAH': return 'Perda & Perbup';
            case 'TEMPLATES': return 'Standar Satuan Harga (SSH)';
            default: return type;
        }
    };

    const getStepStatus = (stepName: 'parse' | 'vector', doc: KnowledgeDoc | null) => {
        if (!doc) return 'pending';
        const status = doc.status;

        if (status === 'Success') return 'completed';
        if (status === 'Error') return 'error';

        if (stepName === 'parse') {
            if (status === 'Parsing') return 'active';
            if (status === 'Vectorizing') return 'completed';
        }

        if (stepName === 'vector') {
            if (status === 'Vectorizing') return 'active';
        }

        return 'pending';
    };

    const totalPages = Math.ceil(docList.length / pageSize) || 1;
    const paginatedDocs = docList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleOpenDetail = (docId: string) => {
        setSelectedDocId(docId);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        AI Ingestion &amp; Knowledge Base
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Unggah regulasi, SOP audit, dan data acuan untuk diindeks ke dalam vector database (RAG).
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDocuments()}
                    disabled={isLoadingDocs}
                    className="rounded-none border-slate-200 text-xs h-8 shadow-none flex items-center gap-1.5"
                >
                    <RefreshCw className={`w-3 h-3 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                    Segarkan
                </Button>
            </div>

            {/* AREA UPLOAD DOKUMEN DENGAN PILIHAN KATEGORI */}
            <div className="border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Pilih Kategori Dokumen Regulasi
                    </span>
                    <div className="flex items-center gap-1">
                        {(['SOP Audit', 'Peraturan Daerah', 'SSH'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setUiCategory(cat)}
                                className={`px-3 py-1 text-xs font-semibold border transition-colors ${
                                    uiCategory === cat
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DROPZONE */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                        dragActive ? 'border-blue-500 bg-blue-50/40' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                        Klik atau Tarik Dokumen <span className="text-blue-600">[{uiCategory}]</span> ke Sini
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Mendukung PDF, DOCX, XLSX (Maksimal 25MB)
                    </p>
                </div>
            </div>

            {/* LIVE PROCESSING STEPPER JIKA SEDANG INGEST */}
            {currentDoc && (
                <div className="border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                            <Brain className="w-4 h-4 text-blue-600" />
                            Status Pipeline AI Ingestion: {currentDoc.title}
                        </span>
                        <span className="font-mono text-[11px] text-blue-700 font-semibold">{currentDoc.status}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-slate-700">1. Server File Received</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStepStatus('parse', currentDoc) === 'completed' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 shrink-0 ${getStepStatus('parse', currentDoc) === 'active' ? 'animate-spin' : ''}`} />
                            )}
                            <span className="text-slate-700">2. Semantic Text Chunking</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStepStatus('vector', currentDoc) === 'completed' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 shrink-0 ${getStepStatus('vector', currentDoc) === 'active' ? 'animate-spin' : ''}`} />
                            )}
                            <span className="text-slate-700">3. Vector pgvector Indexing</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TABEL DAFTAR REGULASI TERINDEKS DENGAN PAGINASI */}
            <div className="border border-slate-200 bg-white rounded-none p-3 space-y-2">
                <div className="overflow-x-auto">
                    {isLoadingDocs && docList.length === 0 ? (
                        <div className="p-10 text-center text-xs text-blue-600">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                            Memuat data regulasi dari database PostgreSQL...
                        </div>
                    ) : docList.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">
                            Belum ada dokumen regulasi yang diindeks ke dalam basis pengetahuan AI.
                        </div>
                    ) : (
                        <Table className="border-collapse min-w-[800px]">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 text-xs font-bold text-slate-700 text-center">No</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[240px]">Nama Dokumen Regulasi</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-44">Kategori RAG</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-center w-28">Ukuran</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-center w-28">Chunks</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-32 text-center">Status DB</TableHead>
                                    <TableHead className="text-center text-xs font-bold text-slate-700 w-24">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDocs.map((doc, index) => {
                                    const rowNumber = (currentPage - 1) * pageSize + index + 1;

                                    return (
                                        <TableRow key={doc.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                            <TableCell className="font-mono text-slate-400 text-xs text-center">{rowNumber}</TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span className="font-semibold text-slate-900 text-xs truncate max-w-xs" title={doc.title}>
                                                        {doc.title}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 text-xs text-slate-600 font-medium">
                                                {getLabelForType(doc.type)}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[11px] text-slate-500 py-2.5 px-3">
                                                {formatBytes(doc.metadata?.fileSize)}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs font-bold text-slate-800 py-2.5 px-3">
                                                {doc.metadata?.totalChunks || '-'}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 text-center">
                                                <span className={`text-[11px] font-bold ${
                                                    doc.status === 'AKTIF' || doc.status === 'Success' ? 'text-emerald-700' : 'text-amber-700'
                                                }`}>
                                                    {doc.status === 'AKTIF' ? 'READY (RAG)' : doc.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-2 px-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDetail(doc.id)}
                                                        className="h-7 px-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold rounded-none flex items-center gap-1"
                                                        title="Lihat Isi Dokumen & Potongan Teks AI"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm(`Hapus dokumen "${doc.title}" dari database AI?`)) {
                                                                deleteDocument(doc.id);
                                                            }
                                                        }}
                                                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none"
                                                        title="Hapus Dokumen"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* PAGINASI */}
                <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={docList.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    itemName="dokumen regulasi"
                />
            </div>

            {/* MODAL INSPEKTOR DETAIL DOKUMEN & CHUNKS */}
            <DocDetailModal
                documentId={selectedDocId}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedDocId(null);
                }}
            />
        </div>
    );
}