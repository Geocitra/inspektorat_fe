// src/features/reporting/components/OpdPortal.tsx
'use client';

import { useReportStore } from '@/store/useReportStore';
import { useStStore } from '@/store/useStStore';
import { useState, useRef } from 'react';
import { 
    Download, UploadCloud, FileText, CheckCircle2, AlertTriangle, Building, ArrowRight, Eye, Clock 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface OpdPortalProps {
    stId: string;
}

export default function OpdPortal({ stId }: OpdPortalProps) {
    const { nhpList, tanggapanList, uploadOpdTanggapan } = useReportStore();
    const { stList } = useStStore();
    const [dragActive, setDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const st = stList.find(s => s.id === stId);
    const nhp = nhpList.find(n => n.stId === stId);
    const tanggapan = tanggapanList.find(t => t.stId === stId);

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
        if (fileExtension !== 'pdf') {
            toast.error('Berkas Ditolak', { description: 'Unggahan pembelaan/sanggahan wajib berupa berkas PDF (.pdf).' });
            return;
        }

        setIsUploading(true);
        // Simulasi unggah berkas ke server
        await new Promise(resolve => setTimeout(resolve, 1500));
        await uploadOpdTanggapan(stId, file.name);
        setIsUploading(false);
    };

    const handleDownloadNhp = () => {
        toast.success('Mengunduh NHP PDF...', { description: 'Mengunduh salinan berkas Naskah Hasil Pemeriksaan.' });
    };

    if (!st) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800">Surat Tugas Tidak Ditemukan</h2>
                <p className="text-slate-500 text-xs mt-2 mb-6 leading-relaxed">
                    Surat Tugas yang Anda cari tidak terdaftar atau tidak dapat diakses dari portal dinas Anda.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            
            {/* PORTAL OPD HEADER BAR */}
            <div className="border border-slate-200 bg-slate-800 text-white p-5 rounded-none space-y-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        Portal Auditee OPD Kota Surabaya
                    </p>
                    <h2 className="text-sm font-bold leading-normal">
                        OPD: <strong className="text-blue-300">{st.namaOpd}</strong>
                    </h2>
                    <p className="text-[10px] text-slate-355">Agenda: {st.namaAudit} ({st.noSt})</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-none uppercase">
                    Status: {nhp ? nhp.status.replace('_', ' ') : 'PEMERIKSAAN LAPANGAN'}
                </span>
            </div>

            {!nhp ? (
                <div className="border border-slate-200 bg-white p-8 rounded-none text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 animate-pulse text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pemeriksaan Lapangan Sedang Berlangsung</h3>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                            Tim Auditor Inspektorat sedang melakukan pemeriksaan lapangan atau menyusun dokumen hasil audit. Belum ada Naskah Hasil Pemeriksaan (NHP) yang dirilis untuk dinas Anda.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link href="/portal/tlhp">
                            <Button variant="outline" className="text-xs rounded-none border-slate-200">
                                Lihat Tindak Lanjut LHP Sebelumnya
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* DOWNLOAD TEMUAN NHP */}
                    <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Dokumen Hasil Pemeriksaan (NHP)</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Unduh draf temuan audit untuk dipelajari.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 border border-slate-150 rounded-none">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800 font-mono">Draft_NHP_{st.noSt.replace(/\//g, '_')}.pdf</p>
                                <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">Berisi 5 unsur rekomendasi pengawasan awal.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleDownloadNhp}
                                    variant="outline"
                                    className="border-slate-300 hover:bg-slate-50 text-xs font-bold rounded-none shadow-none flex items-center gap-1.5 shrink-0"
                                >
                                    <Download className="w-4 h-4" />
                                    Download NHP
                                </Button>

                                <Dialog>
                                    <DialogTrigger 
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-none shadow-none flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-center justify-center border border-transparent"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Lihat NHP
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl h-[700px] rounded-none">
                                        <DialogHeader>
                                            <DialogTitle className="text-xs font-bold uppercase tracking-wider">
                                                Naskah Hasil Pemeriksaan: {st.noSt}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <iframe src="https://pdfobject.com/pdf/sample.pdf" className="w-full h-full border border-slate-200 mt-2" />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* OPD SANGGAHAN UPLOADER */}
                    <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Unggah Tanggapan & Pembelaan Diri</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Kirimkan berkas surat sanggahan resmi resmi/adendum dalam bentuk PDF.</p>
                        </div>

                        {tanggapan ? (
                            <div className="border border-green-200 bg-green-50/20 p-4 rounded-none space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span className="text-xs font-bold text-green-800">Surat Tanggapan Anda Telah Terkirim</span>
                                </div>
                                <p className="text-[10px] text-slate-600 pl-7 leading-relaxed">
                                    Berkas **{tanggapan.fileName}** berhasil diunggah pada {tanggapan.uploadDate}. Tim Inspektur sedang menganalisis kesesuaian argumen Anda dengan aturan PBJ.
                                </p>
                            </div>
                        ) : isUploading ? (
                            <div className="h-32 border border-blue-200 bg-blue-50/20 flex flex-col items-center justify-center text-center p-4">
                                <svg className="w-7 h-7 text-blue-600 animate-spin mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <p className="text-xs font-bold text-blue-800">Mengunggah Tanggapan Sanggahan...</p>
                            </div>
                        ) : (
                            <div 
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={onButtonClick}
                                className={`h-32 border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all rounded-none ${
                                    dragActive 
                                        ? 'border-blue-650 bg-blue-50/20' 
                                        : 'border-slate-300 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                                <p className="text-xs font-bold text-slate-700">Drag & Drop Berkas Sanggahan (PDF)</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">atau klik di sini untuk memilih berkas dari folder</p>
                            </div>
                        )}
                    </div>

                    {/* LINK TO PORTAL TLHP */}
                    {(nhp.status === 'COMPLETED' || st.status === 'SELESAI') && (
                        <div className="border border-indigo-200 bg-indigo-50/20 p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                                    LHP Telah Resmi Terbit
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                    Laporan Hasil Pemeriksaan (LHP) telah diterbitkan secara formal. Silakan masuk ke Portal Tindak Lanjut untuk mengunggah berkas/foto bukti perbaikan.
                                </p>
                            </div>
                            <Link href={`/portal/tlhp/${st.id}`} className="shrink-0">
                                <Button className="bg-indigo-750 hover:bg-indigo-800 text-xs font-bold rounded-none shadow-none flex items-center gap-1.5">
                                    Portal Tindak Lanjut (TLHP)
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
