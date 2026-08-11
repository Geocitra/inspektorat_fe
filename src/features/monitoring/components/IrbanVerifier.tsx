// src/features/monitoring/components/IrbanVerifier.tsx
'use client';

import { useTlhpStore, TlhpItem } from '@/store/useTlhpStore';
import { useStStore } from '@/store/useStStore';
import { useState } from 'react';
import { 
    MapPin, ShieldAlert, Check, X, Lock, Info, Map, CheckCircle2, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface IrbanVerifierProps {
    stId: string;
}

export default function IrbanVerifier({ stId }: IrbanVerifierProps) {
    const { tlhpList, verifyBukti, lockLedger, ledgerLocked } = useTlhpStore();
    const { stList } = useStStore();

    const [selectedItemForReject, setSelectedItemForReject] = useState<TlhpItem | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const st = stList.find(s => s.id === stId);
    const currentFindings = tlhpList.filter(item => item.stId === stId);
    const isLocked = ledgerLocked[stId] || false;

    // Hitung apakah semua temuan sudah SESUAI
    const isAllResolved = currentFindings.length > 0 && currentFindings.every(item => item.status === 'SESUAI');

    const handleRejectClick = (item: TlhpItem) => {
        setSelectedItemForReject(item);
        setRejectionReason('');
    };

    const handleRejectSubmit = () => {
        if (!selectedItemForReject) return;
        if (!rejectionReason.trim()) {
            toast.error('Alasan revisi wajib diisi');
            return;
        }

        verifyBukti(selectedItemForReject.id, false, rejectionReason);
        setSelectedItemForReject(null);
    };

    if (!st) return <div className="text-center py-12 text-slate-500">Surat Tugas Tidak Ditemukan.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* LEDGER LOCKED BANNER */}
            {isLocked && (
                <div className="border border-indigo-600 bg-indigo-50/20 p-5 rounded-none space-y-2">
                    <div className="flex items-center gap-2.5 text-indigo-900 font-bold">
                        <Lock className="w-5 h-5" />
                        <span>Locked by Ledger System</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-7 leading-relaxed font-semibold">
                        Sistem mencatat dokumen tindak lanjut Surat Tugas ini telah dikunci ke Ledger Daerah. Seluruh data terkunci dan bersifat immutable (tidak dapat diubah atau dimanipulasi).
                    </p>
                </div>
            )}

            {/* LIST OF FINDINGS FOR VERIFICATION */}
            <div className="space-y-6">
                {currentFindings.map((item, index) => {
                    const isPending = item.status === 'PENDING_VERIFIKASI';
                    const isSelesai = item.status === 'SESUAI';
                    const hasAnomaly = item.distanceMeters !== undefined && item.distanceMeters > 100;

                    return (
                        <div key={item.id} className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-650 uppercase">
                                        Temuan #{index + 1}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 leading-normal pt-1.5">{item.deskripsiTemuan}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasAnomaly && isPending && (
                                        <span className="text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-none flex items-center gap-1 animate-pulse">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            Anomali Lokasi
                                        </span>
                                    )}
                                    <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase ${
                                        isSelesai
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : isPending
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* MAIN VERIFICATION BLOCK */}
                            {isPending && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                                    
                                    {/* GEOSPATIAL MAP VIEW MOCKUP */}
                                    <div className="md:col-span-2 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase">
                                            <span className="flex items-center gap-1"><Map className="w-3.5 h-3.5 text-slate-400" /> Pratinjau Letak Geospasial</span>
                                            <span>Jarak Deviasi: {item.distanceMeters} meter</span>
                                        </div>

                                        {/* SVG Custom Interactive Map Mockup */}
                                        <div className="h-44 bg-slate-100 border border-slate-250 relative overflow-hidden flex items-center justify-center rounded-none select-none">
                                            {/* Map Grid Lines */}
                                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-25">
                                                {[...Array(24)].map((_, i) => (
                                                    <div key={i} className="border-r border-b border-slate-400"></div>
                                                ))}
                                            </div>

                                            {/* Map vectors / roads mockup */}
                                            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200">
                                                <path d="M0,80 Q200,120 400,60" fill="none" stroke="black" strokeWidth="12" />
                                                <path d="M120,0 L180,200" fill="none" stroke="black" strokeWidth="8" />
                                            </svg>

                                            {/* Connector Line between points */}
                                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                                                <line 
                                                    x1="160" y1="120" 
                                                    x2={hasAnomaly ? "290" : "185"} y2={hasAnomaly ? "50" : "105"} 
                                                    stroke={hasAnomaly ? "#ef4444" : "#10b981"} 
                                                    strokeWidth="2" 
                                                    strokeDasharray="4 4" 
                                                />
                                            </svg>

                                            {/* Titik Proyek (Target) */}
                                            <div className="absolute top-[120px] left-[160px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                                <MapPin className="w-6 h-6 text-blue-600 drop-shadow-sm" />
                                                <span className="text-[7px] font-sans font-bold bg-blue-900 text-white px-1 py-0.5 rounded-none whitespace-nowrap shadow-sm mt-0.5">Titik Proyek</span>
                                            </div>

                                            {/* Titik Bukti Foto */}
                                            <div 
                                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                                                style={{ 
                                                    top: hasAnomaly ? '50px' : '105px', 
                                                    left: hasAnomaly ? '290px' : '185px' 
                                                }}
                                            >
                                                <MapPin className={`w-6 h-6 ${hasAnomaly ? 'text-red-650' : 'text-emerald-600'} drop-shadow-sm animate-bounce`} />
                                                <span className={`text-[7px] font-sans font-bold text-white px-1 py-0.5 rounded-none whitespace-nowrap shadow-sm mt-0.5 ${hasAnomaly ? 'bg-red-800 animate-pulse' : 'bg-emerald-800'}`}>
                                                    {hasAnomaly ? 'Foto Sanggahan (Anomali)' : 'Foto Sanggahan (Valid)'}
                                                </span>
                                            </div>

                                            {/* Geospasial tag */}
                                            <div className="absolute bottom-2 left-2 text-[8px] bg-slate-800/85 text-white font-mono px-2 py-0.5 rounded-none shadow-sm flex items-center gap-1.5 leading-none">
                                                <span>Akurasi GPS Proyek: +/- 4.5m</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INFO & ACTIONS PANEL */}
                                    <div className="md:col-span-1 border border-slate-200 bg-slate-50/50 p-4 rounded-none flex flex-col justify-between space-y-4">
                                        <div className="space-y-2 text-xs">
                                            <h5 className="font-bold text-slate-800">Detail Validasi GPS EXIF:</h5>
                                            <div className="space-y-1 text-slate-600 leading-normal font-sans">
                                                <p>&bull; Jenis Bukti: **Fisik (Foto)**</p>
                                                <p>&bull; Berkas: `{item.buktiFoto}`</p>
                                                <p>&bull; Titik Foto: `{item.buktiCoords?.lat.toFixed(5)}, {item.buktiCoords?.lng.toFixed(5)}`</p>
                                                <p>&bull; Jarak Deviasi: <strong className={hasAnomaly ? 'text-red-650' : 'text-emerald-700'}>{item.distanceMeters} meter</strong></p>
                                            </div>
                                            
                                            {hasAnomaly && (
                                                <div className="border border-red-200 bg-red-50 p-2 text-[10px] text-red-800 leading-relaxed font-bold rounded-none flex gap-1.5">
                                                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <span>Deteksi anti-fraud mencurigai bukti dikerjakan di lokasi berbeda (Lebih dari 100 meter dari koordinat proyek).</span>
                                                </div>
                                            )}
                                        </div>

                                        {!isLocked && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleRejectClick(item)}
                                                    variant="outline"
                                                    className="w-1/2 h-8 rounded-none border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold shadow-none"
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Tolak
                                                </Button>
                                                <Button
                                                    onClick={() => verifyBukti(item.id, true)}
                                                    className="w-1/2 h-8 rounded-none bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-none"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Terima
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* REJECTION REASON DISPLAY FOR NON-PENDING */}
                            {!isPending && item.rejectionReason && (
                                <div className="text-xs text-red-750 bg-red-50/50 p-3 border border-red-200">
                                    Catatan Revisi: &quot;{item.rejectionReason}&quot;
                                </div>
                            )}

                            {/* DOC PREVIEW FOR DOKUMEN TYPE */}
                            {isPending && item.jenisBukti === 'DOKUMEN' && (
                                <div className="border border-slate-200 bg-slate-50 p-4 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-800">Pratinjau Bukti PDF:</p>
                                        <p className="text-[10px] text-slate-500 font-semibold">{item.buktiFile}</p>
                                    </div>
                                    {!isLocked && (
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                onClick={() => handleRejectClick(item)}
                                                variant="outline"
                                                className="h-8 rounded-none border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold shadow-none"
                                            >
                                                Tolak
                                            </Button>
                                            <Button
                                                onClick={() => verifyBukti(item.id, true)}
                                                className="h-8 rounded-none bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-none"
                                            >
                                                Terima Bukti
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* LEDGER LOCK CONTROL ENGINE */}
            {isAllResolved && !isLocked && (
                <div className="border border-indigo-600 bg-indigo-50/20 p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-indigo-700" />
                            Immutable Ledger System Ready
                        </h4>
                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                            Seluruh bukti temuan telah berstatus **SESUAI**. Kunci lembaran kerja ini untuk mencegah manipulasi data secara ilegal.
                        </p>
                    </div>

                    <Button
                        onClick={() => lockLedger(stId)}
                        className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs rounded-none font-bold shadow-none flex items-center gap-1.5 shrink-0"
                    >
                        <Lock className="w-4 h-4" />
                        Kunci Temuan (TUNTAS)
                    </Button>
                </div>
            )}

            {/* REJECTION MODAL */}
            <Dialog open={selectedItemForReject !== null} onOpenChange={() => setSelectedItemForReject(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-none border border-slate-200 shadow-none">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-sm font-bold text-slate-800">Tolak Bukti Tindak Lanjut</DialogTitle>
                        <DialogDescription className="text-xs text-slate-400 mt-1">
                            Berikan catatan koreksi kepada OPD terkait berkas/foto bukti perbaikan ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3">
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Contoh: Titik foto tidak berada di lokasi koordinat proyek AC Dinas Pendidikan. Silakan ambil foto ulang di lokasi sebenarnya..."
                            className="w-full h-24 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400"
                        />
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            className="rounded-none border-slate-200 text-xs shadow-none"
                            onClick={() => setSelectedItemForReject(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleRejectSubmit}
                            className="bg-red-650 hover:bg-red-700 rounded-none text-white text-xs shadow-none"
                        >
                            Kirim Alasan Penolakan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
