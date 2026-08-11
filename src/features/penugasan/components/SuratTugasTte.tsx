// src/features/penugasan/components/SuratTugasTte.tsx
'use client';

import { useState } from 'react';
import { usePegawaiQuery } from '@/hooks/queries/useSt';
import { useSignStMutation } from '@/hooks/mutations/useStMutation';
import { toast } from 'sonner';
import { 
    ShieldCheck, XCircle, RefreshCw, FileText, CheckCircle2, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuratTugas } from '@/types/st.type';

interface SuratTugasTteProps {
    st: SuratTugas;
    isInspektur: boolean;
    onClose: () => void;
}

export default function SuratTugasTte({ st, isInspektur, onClose }: SuratTugasTteProps) {
    const { data: auditorList = [] } = usePegawaiQuery();
    const signStMutation = useSignStMutation();
    const [isSigning, setIsSigning] = useState(false);
    const [signingProgress, setSigningProgress] = useState(0);

    const getAuditorName = (id: string) => {
        return auditorList.find(a => a.id === id)?.nama || 'Unknown Auditor';
    };

    const getAuditorNip = (id: string) => {
        return auditorList.find(a => a.id === id)?.nip || 'Unknown NIP';
    };

    const handleSignST = async () => {
        setIsSigning(true);
        setSigningProgress(0);

        // Hashing & Cert generation progress simulation
        const interval = setInterval(() => {
            setSigningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 20;
            });
        }, 300);

        try {
            await signStMutation.mutateAsync({
                id: st.id,
                payload: { digitalCertificate: 'passphrase-tte-inspektur-123' } // min 6 chars
            });
            toast.success('ST Berhasil Disahkan', { description: 'Tanda tangan elektronik berhasil dibubuhkan.' });
        } catch (err: any) {
            toast.error('Gagal menandatangani ST', { description: err.response?.data?.message || 'Terjadi kesalahan.' });
        } finally {
            clearInterval(interval);
            setIsSigning(false);
            onClose();
        }
    };

    const handleReject = () => {
        if (window.confirm('Tolak rancangan Surat Tugas ini? Status akan kembali ke DRAFT.')) {
            toast.warning('ST Dikembalikan', { description: 'Surat Tugas dikembalikan ke Kasubag.' });
            onClose();
        }
    };

    return (
        <div className="flex flex-col h-[85vh] max-h-[750px]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Preview Surat Tugas Digital
                </h3>
                <button 
                    onClick={onClose}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                    Tutup Preview
                </button>
            </div>

            {/* Simulated PDF Document Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
                {/* Mock Paper */}
                <div className="w-full max-w-[550px] bg-white border border-slate-300 p-8 font-serif shadow-sm text-xs text-slate-850 space-y-6 relative rounded-none">
                    
                    {/* Official Letterhead */}
                    <div className="text-center border-b-2 border-double border-slate-800 pb-3 space-y-1">
                        <h2 className="text-sm font-bold tracking-widest uppercase">Pemerintah Kota Surabaya</h2>
                        <h1 className="text-base font-bold tracking-widest uppercase text-slate-900">Kantor Inspektorat Daerah</h1>
                        <p className="text-[10px] font-sans text-slate-500 italic">Jl. Jimerto No. 25-27, Surabaya &bull; Telp. (031) 5312144</p>
                    </div>

                    {/* Letter Title */}
                    <div className="text-center space-y-0.5">
                        <h3 className="text-xs font-bold tracking-widest uppercase underline">Surat Tugas</h3>
                        <p className="text-[10px] font-sans font-semibold text-slate-600">Nomor: {st.noSt}</p>
                    </div>

                    {/* Assigning statement */}
                    <div className="space-y-3 font-sans text-[11px] leading-relaxed text-slate-700">
                        <p>
                            Berdasarkan Rencana Program Kerja Pengawasan Tahunan (PKPT) Kantor Inspektorat Daerah Surabaya, dengan ini Inspektur Utama menugaskan pejabat fungsional auditor di bawah ini:
                        </p>

                        {/* Assigned Team List */}
                        <div className="border border-slate-200 rounded-none p-3 space-y-3 bg-slate-50/50">
                            {/* Ketua */}
                            <div className="space-y-0.5">
                                <p className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">Ketua Tim Pemeriksa:</p>
                                <p className="font-bold text-slate-800">{getAuditorName(st.ketuaTimId)}</p>
                                <p className="text-[10px] text-slate-500 font-mono">NIP. {getAuditorNip(st.ketuaTimId)}</p>
                            </div>
                            {/* Anggota */}
                            <div className="space-y-1">
                                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Anggota Tim Pemeriksa:</p>
                                {st.anggotaIds.map((id, idx) => (
                                    <div key={id} className="pl-2 border-l-2 border-slate-200">
                                        <p className="font-semibold text-slate-750">{idx + 1}. {getAuditorName(id)}</p>
                                        <p className="text-[9px] text-slate-500 font-mono">NIP. {getAuditorNip(id)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Details */}
                        <div className="space-y-1.5 pt-2">
                            <p>Untuk melaksanakan pemeriksaan audit dengan rincian kegiatan:</p>
                            <div className="grid grid-cols-4 gap-1 text-[11px]">
                                <span className="font-semibold text-slate-500">Program:</span>
                                <span className="col-span-3 font-bold text-slate-800">{st.namaAudit}</span>

                                <span className="font-semibold text-slate-500">Objek Audit:</span>
                                <span className="col-span-3 font-bold text-slate-800">{st.namaOpd}</span>

                                <span className="font-semibold text-slate-500">Waktu:</span>
                                <span className="col-span-3 font-mono text-slate-700 font-semibold">{st.tglMulai} s/d {st.tglSelesai}</span>

                                <span className="font-semibold text-slate-500">Lokasi:</span>
                                <span className="col-span-3 font-bold text-slate-800">{st.lokasi}</span>
                            </div>
                        </div>
                    </div>

                    {/* Official Signatures / Digital Certificate */}
                    <div className="flex justify-end pt-8 font-sans">
                        <div className="w-[180px] text-center space-y-4">
                            <p className="text-[10px] text-slate-500 font-semibold">Surabaya, {new Date(st.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            
                            {st.status === 'PUBLISHED' && st.tteHash ? (
                                <div className="border border-emerald-600 bg-emerald-50/20 p-2 text-center space-y-1 select-none">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
                                    <p className="text-[8px] font-bold text-emerald-800 uppercase tracking-widest">TTE Sah & Terkunci</p>
                                    <p className="text-[6px] font-mono text-emerald-700 truncate">{st.tteHash}</p>
                                    <p className="text-[7px] text-slate-500 font-bold mt-1">Inspektur Utama</p>
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center border border-dashed border-slate-350 text-slate-400 text-[10px] italic">
                                    Menunggu TTE Pimpinan
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                {/* SIGNING SIMULATION STATUS */}
                {isSigning && (
                    <div className="border border-blue-200 bg-blue-50/50 p-3 rounded-none mb-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                            <span className="flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                Hashing SHA-256 & Generating Digital Certificate...
                            </span>
                            <span>{signingProgress}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 border border-slate-200 rounded-none overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 transition-all duration-300 rounded-none"
                                style={{ width: `${signingProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* DECISION BUTTONS */}
                <div className="flex justify-end gap-2">
                    <Button 
                        variant="outline" 
                        className="rounded-none border-slate-200 text-xs shadow-none"
                        onClick={onClose}
                        disabled={isSigning}
                    >
                        Kembali
                    </Button>
                    
                    {st.status === 'PENDING_APPROVAL' && isInspektur && !isSigning && (
                        <>
                            <Button 
                                onClick={handleReject}
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 rounded-none text-xs font-bold shadow-none"
                            >
                                Tolak ST
                            </Button>
                            <Button 
                                onClick={handleSignST}
                                className="bg-green-600 hover:bg-green-700 rounded-none text-xs font-bold shadow-none"
                            >
                                Sahkan & Tanda Tangani ST
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
