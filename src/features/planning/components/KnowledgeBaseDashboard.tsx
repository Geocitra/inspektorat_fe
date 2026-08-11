// src/features/planning/components/KnowledgeBaseDashboard.tsx
'use client';

import { useState, useRef } from 'react';
import { useKnowledgeStore, KnowledgeDoc } from '@/store/useKnowledgeStore';
import { 
    UploadCloud, FileText, Trash2, CheckCircle, Brain, RefreshCw, 
    AlertCircle, Database, HelpCircle, HardDrive, Cpu, Zap, BookOpen, Check 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function KnowledgeBaseDashboard() {
    const { docList, isProcessing, currentDoc, uploadDocument, deleteDocument, clearCurrentDoc } = useKnowledgeStore();
    const [category, setCategory] = useState<'SOP Audit' | 'Peraturan Daerah' | 'SSH'>('SOP Audit');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag and Drop Handlers
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
            const file = e.dataTransfer.files[0];
            await processUploadedFile(file);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await processUploadedFile(file);
        }
    };

    const processUploadedFile = async (file: File) => {
        // Validasi tipe file
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            toast.error('File Ditolak', { 
                description: 'Format dokumen tidak didukung. Harap unggah berkas PDF, Word, Excel, atau TXT.' 
            });
            return;
        }

        // Jalankan Ingesti AI via Zustand Store
        await uploadDocument(file, category);
    };

    // Helper untuk mengecek status stepper ingesti AI
    const getStepStatus = (step: 'upload' | 'parse' | 'vector', doc: KnowledgeDoc | null) => {
        if (!doc) return 'pending';
        
        const status = doc.status;
        switch (step) {
            case 'upload':
                return 'completed'; // File selalu terupload di awal
            case 'parse':
                if (status === 'Parsing' || status === 'Uploading') return 'active';
                if (status === 'Vectorizing' || status === 'Success') return 'completed';
                return 'pending';
            case 'vector':
                if (status === 'Vectorizing') return 'active';
                if (status === 'Success') return 'completed';
                return 'pending';
            default:
                return 'pending';
        }
    };

    return (
        <div className="space-y-6">
            {/* HEADER HALAMAN */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                        Knowledge Base Ingestion
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Unggah dokumen regulasi daerah, SOP, dan pedoman untuk dilatih ke dalam RAG AI Audit Engine.</p>
                </div>
            </div>

            {/* DYNAMIC VEC DB STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 border border-slate-200 bg-white rounded-none divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 p-2 border border-slate-200 text-slate-600 rounded-none">
                        <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vector DB Provider</p>
                        <p className="text-sm font-bold text-slate-800">Qdrant Server</p>
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
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RAG Latency (Query)</p>
                        <p className="text-sm font-bold text-slate-800">&lt; 140ms</p>
                    </div>
                </div>
            </div>

            {/* SELECTION GRID & UPLOAD AREA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CATEGORY SELECTOR CARDS */}
                <div className="md:col-span-1 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Kategori Pengetahuan</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {[
                            { name: 'SOP Audit', desc: 'Pedoman standar operasional pemeriksaan auditor di lapangan.' },
                            { name: 'Peraturan Daerah', desc: 'Aturan hukum, perda, & perda anggaran daerah setempat.' },
                            { name: 'SSH', desc: 'Standar Satuan Harga barang/jasa daerah untuk verifikasi SPJ.' }
                        ].map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setCategory(cat.name as any)}
                                className={`p-3.5 text-left border rounded-none transition-all flex justify-between items-start gap-2 ${
                                    category === cat.name
                                        ? 'bg-blue-50/50 border-blue-600 ring-0'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">{cat.name}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{cat.desc}</p>
                                </div>
                                {category === cat.name && (
                                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DROPZONE UPLOADER */}
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
                        className={`h-[160px] border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all rounded-none ${
                            dragActive 
                                ? 'border-blue-600 bg-blue-50/20' 
                                : 'border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                        onClick={onButtonClick}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleFileChange}
                        />
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Drag & Drop Berkas di Sini</p>
                        <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri folder (PDF, Word, Excel, TXT)</p>
                    </div>
                </div>
            </div>

            {/* AI PIPELINE VISUAL STEPPER */}
            {currentDoc && (
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md" title={currentDoc.fileName}>
                                {currentDoc.fileName}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 font-bold">
                            {currentDoc.category}
                        </span>
                    </div>

                    {/* Stepper Pipeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {/* Step 1: Upload */}
                        <div className="flex items-start gap-2.5">
                            <div className="bg-emerald-500 text-white rounded-none p-1 flex-shrink-0">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">1. Document Uploaded</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">File ditampung di server storage.</p>
                            </div>
                        </div>

                        {/* Step 2: Parsing */}
                        <div className="flex items-start gap-2.5">
                            <div className={`rounded-none p-1 flex-shrink-0 border ${
                                getStepStatus('parse', currentDoc) === 'completed'
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
                                <p className="text-xs font-bold text-slate-800">2. Text Chunking & Parsing</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {getStepStatus('parse', currentDoc) === 'completed' ? 'Teks berhasil dipilah per paragraf.' : 'Membaca struktur karakter dokumen.'}
                                </p>
                            </div>
                        </div>

                        {/* Step 3: Vectorizing */}
                        <div className="flex items-start gap-2.5">
                            <div className={`rounded-none p-1 flex-shrink-0 border ${
                                getStepStatus('vector', currentDoc) === 'completed'
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
                                <p className="text-xs font-bold text-slate-800">3. Embedding & Vector DB Ingest</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {getStepStatus('vector', currentDoc) === 'completed' ? 'Selesai. Masuk ke Knowledge Base RAG.' : 'Mengubah teks menjadi matriks vektor.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step success dismiss */}
                    {currentDoc.status === 'Success' && (
                        <div className="pt-2 flex justify-end">
                            <Button 
                                onClick={clearCurrentDoc}
                                size="sm" 
                                className="bg-slate-800 hover:bg-slate-900 rounded-none text-xs shadow-none"
                            >
                                Bersihkan Pipeline
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* KNOWLEDGE LIST */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Daftar Regulasi Di-ingest ({docList.length} Dokumen)</h3>
                
                <div className="border border-slate-200 bg-white rounded-none">
                    {docList.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs italic">
                            Belum ada dokumen regulasi yang di-ingest. Silakan unggah dokumen di atas.
                        </div>
                    ) : (
                        <Table className="border-collapse">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] font-bold text-slate-700 text-xs">No</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs">Nama Berkas</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[180px]">Kategori</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs text-center w-[120px]">Ukuran File</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-xs w-[140px]">Status RAG</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 text-xs w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docList.map((doc, index) => (
                                    <TableRow key={doc.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                        <TableCell className="font-mono text-slate-400 text-xs">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="font-semibold text-slate-800 text-sm truncate max-w-sm sm:max-w-lg" title={doc.fileName}>
                                                    {doc.fileName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                                                {doc.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs text-slate-500">
                                            {doc.fileSize}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 border ${
                                                doc.status === 'Success'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : doc.status === 'Error'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                                            }`}>
                                                {doc.status === 'Success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                                {doc.status === 'Error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                                {doc.status === 'Success' ? 'Ready' : doc.status === 'Error' ? 'Error' : doc.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600"
                                                onClick={() => {
                                                    if (window.confirm(`Hapus dokumen "${doc.fileName}" dari basis pengetahuan RAG?`)) {
                                                        deleteDocument(doc.id);
                                                        toast.success('Dihapus', { description: 'Dokumen berhasil dikeluarkan dari Vector database.' });
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
        </div>
    );
}
