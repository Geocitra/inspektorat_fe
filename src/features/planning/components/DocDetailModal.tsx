// src/features/planning/components/DocDetailModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, X, CheckCircle, AlertCircle, Database, 
    Layers, Hash, Copy, Check, Search, RefreshCw, Eye,
    Table as TableIcon, Sparkles, FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DocChunk {
    id: string;
    chunkIndex: number;
    content: string;
}

interface DocDetailData {
    id: string;
    title: string;
    type: string;
    status: string;
    filePath: string;
    createdAt: string;
    metadata?: {
        fileSize: number;
        mimeType: string;
        totalChunks: number;
        totalTokens?: number;
        hash: string;
    };
    opd?: {
        id: string;
        namaOpd: string;
    } | null;
    chunks?: DocChunk[];
}

interface DocDetailModalProps {
    documentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocDetailModal({ documentId, isOpen, onClose }: DocDetailModalProps) {
    const [docData, setDocData] = useState<DocDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chunks' | 'metadata'>('chunks');
    const [chunkSearch, setChunkSearch] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && documentId) {
            fetchDetail();
        } else {
            setDocData(null);
            setChunkSearch('');
        }
    }, [isOpen, documentId]);

    const fetchDetail = async () => {
        if (!documentId) return;
        setIsLoading(true);
        try {
            const res = await api.get(`/documents/${documentId}`);
            setDocData(res.data.data || res.data);
        } catch (err: any) {
            toast.error('Gagal Memuat Detail Dokumen', {
                description: err.response?.data?.message || 'Pastikan server backend terhubung.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Cuplikan teks disalin ke clipboard');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const chunks = docData?.chunks || [];
    const filteredChunks = chunks.filter(c => 
        c.content.toLowerCase().includes(chunkSearch.toLowerCase())
    );

    // Deteksi apakah dokumen memuat struktur tabel / spreadsheet
    const hasTableStructure = chunks.some(c => c.content.includes('|') || c.content.includes('---'));
    const isSpreadsheet = docData?.filePath?.endsWith('.xlsx') || docData?.filePath?.endsWith('.xls');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Override sm:max-w-sm dari default dialog dengan sm:max-w-5xl md:max-w-6xl w-[94vw] */}
            <DialogContent className="sm:max-w-5xl md:max-w-6xl w-[94vw] max-h-[88vh] rounded-none p-0 overflow-hidden border-slate-300 shadow-2xl flex flex-col my-auto">
                {/* HEADER MODAL */}
                <DialogHeader className="bg-slate-900 text-white p-4 shrink-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4 pr-6">
                        <div className="space-y-1 min-w-0">
                            <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="truncate max-w-2xl text-left" title={docData?.title}>
                                    {docData?.title || 'Memuat Dokumen...'}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-xs text-left">
                                Inspektor Ekstraksi Teks AI, Tabel Terstruktur, &amp; Vektor Database
                            </DialogDescription>
                        </div>

                        {docData && (
                            <div className="flex items-center gap-2 shrink-0">
                                {isSpreadsheet ? (
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                                        Spreadsheet Excel
                                    </span>
                                ) : hasTableStructure ? (
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                                        <TableIcon className="w-3 h-3 text-purple-400" />
                                        Tabel Terstruktur
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-blue-400" />
                                        Teks Digital
                                    </span>
                                )}
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700">
                                    {docData.type}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* TAB NAVIGASI */}
                    <div className="flex gap-2 pt-3 border-t border-slate-800 -mb-2">
                        <button
                            onClick={() => setActiveTab('chunks')}
                            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                activeTab === 'chunks'
                                    ? 'border-blue-400 text-blue-400 font-bold bg-slate-800/40'
                                    : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Potongan Teks AI ({chunks.length} Chunks)
                        </button>
                        <button
                            onClick={() => setActiveTab('metadata')}
                            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                activeTab === 'metadata'
                                    ? 'border-blue-400 text-blue-400 font-bold bg-slate-800/40'
                                    : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <Hash className="w-3.5 h-3.5" />
                            Metadata Teknis &amp; Integritas Berkas
                        </button>
                    </div>
                </DialogHeader>

                {/* BODY CONTENT */}
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-3">
                    {isLoading ? (
                        <div className="p-16 text-center text-xs text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                            Mengambil data ekstraksi teks dan struktur tabel dari PostgreSQL...
                        </div>
                    ) : !docData ? (
                        <div className="p-12 text-center text-xs text-slate-400">
                            Data rincian dokumen tidak ditemukan.
                        </div>
                    ) : activeTab === 'chunks' ? (
                        /* TAB 1: POTONGAN CHUNKS */
                        <div className="space-y-3">
                            {/* STATUS ROBUST PARSER BAR */}
                            <div className="bg-white border border-slate-200 p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="font-semibold text-slate-800">
                                        Status Parsing AI: <strong className="text-emerald-700">Optimal (Siap untuk RAG Retrieval)</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                    <span>Total: {chunks.length} Potongan</span>
                                    <span>&bull;</span>
                                    <span>Format: {hasTableStructure ? 'Markdown Table Aware' : 'Semantic Paragraphs'}</span>
                                </div>
                            </div>

                            {/* SEARCH BAR DI DALAM CHUNKS */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2">
                                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                                <input
                                    type="text"
                                    value={chunkSearch}
                                    onChange={(e) => setChunkSearch(e.target.value)}
                                    placeholder="Cari nomor rekening, uraian kegiatan, pasal hukum, atau nominal angka..."
                                    className="w-full text-xs bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400"
                                />
                                {chunkSearch && (
                                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                        Ditemukan {filteredChunks.length} dari {chunks.length}
                                    </span>
                                )}
                            </div>

                            {/* LIST CHUNKS */}
                            {filteredChunks.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200">
                                    {chunkSearch ? 'Tidak ada potongan teks atau baris tabel yang cocok dengan pencarian.' : 'Belum ada potongan teks chunk.'}
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {filteredChunks.map((chunk, idx) => {
                                        const isChunkTable = chunk.content.includes('|');

                                        return (
                                            <div key={chunk.id || idx} className="border border-slate-200 bg-white p-3 space-y-2 transition-all hover:border-slate-300">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100">
                                                            Chunk #{chunk.chunkIndex + 1}
                                                        </span>
                                                        {isChunkTable && (
                                                            <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 border border-purple-100 flex items-center gap-1">
                                                                <TableIcon className="w-2.5 h-2.5" />
                                                                Format Tabel
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleCopy(chunk.content, idx)}
                                                        className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                                                        title="Salin isi potongan teks"
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                        {copiedIndex === idx ? 'Tersalin' : 'Salin Teks'}
                                                    </button>
                                                </div>

                                                <div className="text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto bg-slate-50/80 p-3 border border-slate-100">
                                                    {chunk.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* TAB 2: METADATA SPESIFIKASI BERSIH TANPA TABRAKAN TEKS */
                        <div className="border border-slate-200 bg-white p-5 space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul Dokumen Lengkap</p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{docData.title}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Acuan Regulasi (RAG)</p>
                                        <p className="font-semibold text-blue-700 mt-0.5">{docData.type}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Database Vektor</p>
                                        <p className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {docData.status} (Aktif di pgvector)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 md:pl-4 pt-3 md:pt-0">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal &amp; Waktu Ingesti</p>
                                        <p className="font-mono text-slate-700 mt-0.5">
                                            {new Date(docData.createdAt).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ukuran Berkas Fisik</p>
                                        <p className="font-mono text-slate-700 mt-0.5">{formatBytes(docData.metadata?.fileSize)}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Semantic Chunks</p>
                                        <p className="font-mono font-bold text-slate-900 mt-0.5">{docData.metadata?.totalChunks || chunks.length} Bagian</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hash Integritas Berkas (SHA-256)</p>
                                    <p className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2 border border-slate-200 break-all mt-1">
                                        {docData.metadata?.hash || 'SHA256-EMBEDDED'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Path Penyimpanan Server Internal</p>
                                    <p className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2 border border-slate-200 break-all mt-1">
                                        {docData.filePath}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER MODAL */}
                <div className="bg-white p-3 border-t border-slate-200 flex justify-end shrink-0">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs px-6 h-8 font-semibold shadow-none"
                    >
                        Tutup Inspektor
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
