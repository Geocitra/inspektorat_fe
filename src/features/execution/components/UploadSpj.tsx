// src/features/execution/components/UploadSpj.tsx
'use client';

import { useState, useRef } from 'react';
import { useKkaStore } from '@/store/useKkaStore';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadSpjProps {
    stId: string;
    onUploadSuccess: () => void;
}

export default function UploadSpj({ stId, onUploadSuccess }: UploadSpjProps) {
    const { uploadSpjExcel, isUploading } = useKkaStore();
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension !== 'xlsx') {
            toast.error('File Ditolak', { 
                description: 'Hanya berkas spreadsheet Excel (.xlsx) yang diperbolehkan.' 
            });
            return;
        }

        try {
            await uploadSpjExcel(stId, file.name);
            onUploadSuccess();
        } catch (error) {
            toast.error('Gagal Membaca File');
        }
    };

    return (
        <div className="border border-slate-200 bg-white p-6 rounded-none space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-800">Unggah Laporan SPJ Realisasi Belanja</h3>
                <p className="text-slate-500 text-xs mt-1">Unggah spreadsheet Excel berisi pengeluaran rincian belanja OPD untuk dideteksi oleh AI.</p>
            </div>

            {isUploading ? (
                <div className="h-44 border border-blue-200 bg-blue-50/20 flex flex-col items-center justify-center text-center p-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-xs font-bold text-blue-800">Mengekstrak Excel SPJ & Mengambil Rujukan RAG...</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                        Kecerdasan buatan sedang mencocokkan rincian harga satuan kuitansi dengan database Standar Satuan Harga (SSH) Kota Surabaya.
                    </p>
                </div>
            ) : (
                <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    className={`h-44 border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all rounded-none ${
                        dragActive 
                            ? 'border-blue-600 bg-blue-50/20' 
                            : 'border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                >
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".xlsx"
                        onChange={handleFileChange}
                    />
                    <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Drag & Drop Berkas Excel SPJ di Sini</p>
                    <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri folder (Hanya format .xlsx)</p>
                </div>
            )}

            <div className="flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-3 border border-slate-100">
                <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                    **Petunjuk Format:** Excel wajib memiliki kolom rincian barang, kuantitas, harga satuan, dan total pengeluaran belanja daerah agar dibaca secara tepat oleh Parser AI.
                </span>
            </div>
        </div>
    );
}
