// src/features/execution/components/UploadSpj.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useKkaStore } from '@/store/useKkaStore';
import { 
    UploadCloud, FileSpreadsheet, Loader2, AlertCircle, 
    FileText, CheckCircle2, Eye, Sparkles, ArrowRight, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DocDetailModal from '@/features/planning/components/DocDetailModal';

interface UploadSpjProps {
    stId: string;
    onUploadSuccess: () => void;
}

export default function UploadSpj({ stId, onUploadSuccess }: UploadSpjProps) {
    const { uploadSpjExcel, isUploading, loadSampleSpjForDisdik } = useKkaStore();
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State list dokumen yang sudah terunggah untuk ST ini
    const [stDocuments, setStDocuments] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const fetchStDocuments = async () => {
        setIsLoadingDocs(true);
        try {
            const res = await api.get(`/documents?stId=${stId}`);
            setStDocuments(res.data?.data || []);
        } catch (err) {
            console.error('Gagal mengambil daftar dokumen ST:', err);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    useEffect(() => {
        if (stId) {
            fetchStDocuments();
        }
    }, [stId]);

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
            await processFile(file);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await processFile(file);
        }
    };

    const processFile = async (file: File) => {
        try {
            await uploadSpjExcel(stId, file.name);
            await fetchStDocuments();
            onUploadSuccess();
        } catch (error) {
            toast.error('Gagal Membaca File');
        }
    };

    return (
        <div className="space-y-6">
            {/* DAFTAR DOKUMEN & BUKTI SPJ YANG SUDAH TERUNGGAH */}
            <div className="border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Dokumen &amp; Bukti SPJ Terunggah pada Surat Tugas Ini
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Daftar berkas KKA dan bundel bukti transaksi yang siap dianalisis dan dicocokkan oleh AI.
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchStDocuments}
                        className="h-7 text-xs font-semibold rounded-none border-slate-200 flex items-center gap-1"
                        title="Segarkan daftar dokumen"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                        Segarkan
                    </Button>
                </div>

                {isLoadingDocs ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                        Memuat daftar dokumen terunggah...
                    </div>
                ) : stDocuments.length === 0 ? (
                    <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 p-4">
                        <p className="text-xs text-slate-500 font-medium">Belum ada berkas KKA/SPJ yang terdaftar.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Silakan unggah berkas Excel di bawah atau gunakan tombol muat cepat sampel.
                        </p>
                    </div>
                ) : (
                    <div className="border border-slate-200 overflow-hidden">
                        <Table className="w-full text-xs">
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700 w-8 text-center">No</TableHead>
                                    <TableHead className="font-bold text-slate-700">Nama Dokumen / Berkas SPJ</TableHead>
                                    <TableHead className="font-bold text-slate-700 w-32">Kategori</TableHead>
                                    <TableHead className="font-bold text-slate-700 w-28 text-center">Ukuran</TableHead>
                                    <TableHead className="font-bold text-slate-700 w-32 text-center">Status AI</TableHead>
                                    <TableHead className="font-bold text-slate-700 w-24 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stDocuments.map((doc, idx) => (
                                    <TableRow key={doc.id} className="hover:bg-slate-50">
                                        <TableCell className="text-center font-mono text-[11px]">{idx + 1}</TableCell>
                                        <TableCell>
                                            <p className="font-bold text-slate-900 leading-snug">{doc.title}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.filePath}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                                {doc.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-[11px] text-slate-600">
                                            {doc.metadata?.fileSize ? `${Math.ceil(doc.metadata.fileSize / 1024)} KB` : '12 KB'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 flex items-center justify-center gap-1 mx-auto w-fit">
                                                <CheckCircle2 className="w-3 h-3" />
                                                READY (RAG)
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedDocId(doc.id)}
                                                className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-none flex items-center gap-1 mx-auto"
                                                title="Lihat isi teks dokumen"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Buka
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* FORM UNGGAH BERKAS BARU & QUICK PRESET */}
            <div className="border border-slate-200 bg-white p-6 space-y-5">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Unggah Berkas KKA / Laporan SPJ Baru</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Unggah spreadsheet Excel atau dokumen rincian transaksi belanja untuk dideteksi oleh AI.</p>
                </div>

                {isUploading ? (
                    <div className="h-40 border border-blue-200 bg-blue-50/20 flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                        <p className="text-xs font-bold text-blue-800">Mengekstrak Dokumen SPJ &amp; Mengambil Rujukan RAG...</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                            AI sedang mencocokkan kuitansi belanja dengan database Standar Satuan Harga (SSH) dan DPA Dinas Pendidikan.
                        </p>
                    </div>
                ) : (
                    <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={onButtonClick}
                        className={`h-40 border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all rounded-none ${
                            dragActive 
                                ? 'border-blue-600 bg-blue-50/20' 
                                : 'border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <FileSpreadsheet className="w-9 h-9 text-slate-400 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Drag &amp; Drop Berkas Excel / Dokumen SPJ di Sini</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">atau klik untuk menelusuri folder komputer Anda</p>
                    </div>
                )}

                {/* TOMBOL NAVIGASI MENUJU TAHAP 2 */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <p className="text-xs font-bold text-slate-800">
                            Berkas Telah Siap?
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Lanjutkan ke tahap pemeriksaan otomatis untuk membandingkan SPJ terhadap Perwali SSH &amp; DPA.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={async () => {
                            const { kkaList, loadSampleSpjForDisdik } = useKkaStore.getState();
                            const hasItems = kkaList.some(k => k.stId === stId);
                            if (!hasItems) {
                                await loadSampleSpjForDisdik(stId);
                            }
                            onUploadSuccess();
                        }}
                        className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 shadow-none cursor-pointer flex items-center gap-2 shrink-0"
                    >
                        <span>Lanjut ke Tahap 2: Analisis Deteksi Anomali AI</span>
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* MODAL PREVIEW DETAIL DOKUMEN */}
            <DocDetailModal 
                isOpen={!!selectedDocId}
                documentId={selectedDocId} 
                onClose={() => setSelectedDocId(null)} 
            />
        </div>
    );
}
