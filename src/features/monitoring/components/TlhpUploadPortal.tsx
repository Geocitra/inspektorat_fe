// src/features/monitoring/components/TlhpUploadPortal.tsx
'use client';

import { useTlhpStore, TlhpItem } from '@/store/useTlhpStore';
import { 
    FileText, Image, Upload, AlertCircle, CheckCircle2, ShieldAlert, MapPin, Loader2, Info
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TlhpUploadPortalProps {
    stId: string;
}

export default function TlhpUploadPortal({ stId }: TlhpUploadPortalProps) {
    const { tlhpList, uploadDokumenBukti, uploadFotoBukti, ledgerLocked } = useTlhpStore();
    const [isUploadingId, setIsUploadingId] = useState<string | null>(null);

    const isLocked = ledgerLocked[stId] || false;
    const currentFindings = tlhpList.filter(item => item.stId === stId);

    const handleUploadPdf = (itemId: string) => {
        uploadDokumenBukti(itemId, 'BUKTI_SETORAN_NEGARA_DINAS_PENDIDIKAN.pdf');
    };

    const handleUploadFoto = async (itemId: string, hasGps: boolean, isFar: boolean = false) => {
        setIsUploadingId(itemId);
        
        let customCoords;
        if (isFar) {
            // Beri koordinat melenceng sekitar 320 meter ke arah timur
            customCoords = {
                lat: -7.265219 + 0.0028,
                lng: 112.742301 + 0.0005
            };
        }

        const success = await uploadFotoBukti(
            itemId, 
            hasGps ? (isFar ? 'FOTO_AC_OUTSIDE_GPS.jpg' : 'FOTO_AC_PROYEK_EXIF.jpg') : 'FOTO_AC_SCREENSHOT.jpg',
            hasGps,
            customCoords
        );

        setIsUploadingId(itemId);
        setIsUploadingId(null);
    };

    if (currentFindings.length === 0) {
        return (
            <div className="p-12 border border-slate-200 bg-white text-center rounded-none text-slate-500">
                Tidak ada temuan LHP yang butuh tindak lanjut untuk Surat Tugas ini.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* LEDGER LOCK ALERT */}
            {isLocked && (
                <div className="border border-indigo-650 bg-indigo-50/20 p-4 rounded-none flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <LockPlaceholderIcon />
                        <div>
                            <h4 className="text-xs font-bold text-indigo-900">Locked by Ledger System</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                Kertas kerja tindak lanjut telah dikunci secara permanen. Modul berada dalam mode Read-Only.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* LIST OF FINDINGS */}
            <div className="space-y-4">
                {currentFindings.map((item, index) => {
                    const hasPending = item.status === 'PENDING_VERIFIKASI';
                    const hasSelesai = item.status === 'SESUAI';
                    const isFisik = item.jenisBukti === 'FISIK';

                    return (
                        <div key={item.id} className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-650 px-2 py-0.5 border border-slate-200 uppercase">
                                        Temuan #{index + 1}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 leading-normal pt-1.5">{item.deskripsiTemuan}</h4>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border rounded-none ${
                                    hasSelesai
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : hasPending
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* REJECTION FEEDBACK ALERT */}
                            {item.rejectionReason && (
                                <div className="border border-red-200 bg-red-55/10 p-3 rounded-none flex items-start gap-2">
                                    <ShieldAlert className="w-4 h-4 text-red-650 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-red-800">Catatan Penolakan Verifikator</p>
                                        <p className="text-red-750 text-xs mt-0.5 leading-relaxed font-semibold">
                                            &quot;{item.rejectionReason}&quot;
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PREVIEW SUBMITTED EVIDENCE */}
                            {(item.buktiFile || item.buktiFoto) && (
                                <div className="bg-slate-50 border border-slate-150 p-3 rounded-none text-xs space-y-2">
                                    <p className="font-bold text-slate-700">Bukti yang telah diunggah:</p>
                                    {item.buktiFile && (
                                        <p className="text-slate-600 flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5 text-red-500" />
                                            {item.buktiFile}
                                        </p>
                                    )}
                                    {item.buktiFoto && (
                                        <div className="space-y-1.5">
                                            <p className="text-slate-600 flex items-center gap-1">
                                                <Image className="w-3.5 h-3.5 text-blue-500" />
                                                {item.buktiFoto}
                                            </p>
                                            {item.buktiCoords && (
                                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    GPS EXIF: {item.buktiCoords.lat.toFixed(6)}, {item.buktiCoords.lng.toFixed(6)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ACTION BUTTONS UPLOADER */}
                            {!hasSelesai && !isLocked && (
                                <div className="pt-2">
                                    {isFisik ? (
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-750 flex items-center gap-1">
                                                <Upload className="w-3.5 h-3.5 text-blue-650" />
                                                Simulasi Unggah Foto Ber-GPS (EXIF)
                                            </label>
                                            
                                            {isUploadingId === item.id ? (
                                                <div className="flex items-center gap-1.5 text-xs text-blue-600 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Membaca Metadata GPS EXIF Foto...
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        onClick={() => handleUploadFoto(item.id, false)}
                                                        variant="outline"
                                                        className="rounded-none border-red-200 text-red-650 hover:bg-red-50 text-[10px] h-7 px-2.5 shadow-none font-bold"
                                                    >
                                                        1. Unggah Foto Tanpa GPS
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUploadFoto(item.id, true, true)}
                                                        variant="outline"
                                                        className="rounded-none border-amber-200 text-amber-700 hover:bg-amber-50 text-[10px] h-7 px-2.5 shadow-none font-bold"
                                                    >
                                                        2. Unggah Foto GPS Melenceng (&gt;100m)
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUploadFoto(item.id, true, false)}
                                                        className="rounded-none bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-7 px-3 shadow-none font-bold"
                                                    >
                                                        3. Unggah Foto GPS Valid
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-750 flex items-center gap-1">
                                                <Upload className="w-3.5 h-3.5 text-blue-650" />
                                                Unggah Dokumen Berkas PDF (Bukti Setoran)
                                            </label>
                                            <Button
                                                onClick={() => handleUploadPdf(item.id)}
                                                className="rounded-none bg-blue-600 hover:bg-blue-700 text-[10px] h-8 px-4 shadow-none font-bold flex items-center gap-1.5"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Upload PDF Surat Setoran Kasda
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LockPlaceholderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-indigo-750">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
