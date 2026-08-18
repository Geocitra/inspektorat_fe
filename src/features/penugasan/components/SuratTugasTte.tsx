// src/features/penugasan/components/SuratTugasTte.tsx
'use client';

import { useState } from 'react';
import { 
    FileText, ShieldCheck, RefreshCw, 
    Printer, Building2, QrCode, X, Check, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SuratTugas } from '@/types/st.type';
import { useSignStMutation } from '@/hooks/mutations/useStMutation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuditorStore } from '@/store/useAuditorStore';
import { exportSuratTugasPdf } from '@/lib/pdfGenerator';

interface SuratTugasTteProps {
    st: SuratTugas;
    isInspektur: boolean;
    onClose: () => void;
}

export default function SuratTugasTte({ st, isInspektur, onClose }: SuratTugasTteProps) {
    const { user } = useAuthStore();
    const { auditorList } = useAuditorStore();
    const signMutation = useSignStMutation();

    const [isSigning, setIsSigning] = useState(false);
    const [signingProgress, setSigningProgress] = useState(0);

    const getAuditorName = (id?: string) => {
        if (!id) return '-';
        const auditor = auditorList.find((a) => a.id === id);
        return auditor ? auditor.nama : 'Pejabat Fungsional Auditor';
    };

    const getAuditorNip = (id?: string) => {
        if (!id) return '-';
        const auditor = auditorList.find((a) => a.id === id);
        return auditor ? auditor.nip : '19850101 201001 1 001';
    };

    const handleSignST = async () => {
        setIsSigning(true);
        setSigningProgress(15);

        const interval = setInterval(() => {
            setSigningProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 25;
            });
        }, 300);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1400));
            await signMutation.mutateAsync({
                id: st.id,
                payload: {
                    digitalCertificate: 'SHA256-CERT-VALIDATED-BSRE-BSSN',
                },
            });
            setSigningProgress(100);
            toast.success('Surat Tugas Berhasil Disahkan & Diberi TTE', {
                description: `Sertifikat elektronik diterbitkan untuk ${st.noSt}`,
            });
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (err: any) {
            toast.error('Gagal Melakukan TTE Digital', {
                description: err.response?.data?.message || 'Pastikan sertifikat digital aktif.',
            });
        } finally {
            clearInterval(interval);
            setIsSigning(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const isPublished = st.status === 'PUBLISHED' || !!st.tteHash;
    const anggotaList: string[] = Array.isArray(st.anggotaIds) ? st.anggotaIds : [];

    return (
        <div className="flex flex-col h-[88vh] max-h-[850px] bg-slate-100 overflow-hidden">
            {/* 1. HEADER MODAL (CLEAN & NO TEXT COLLISION) */}
            <div className="bg-slate-900 text-white p-3.5 px-5 flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                        <h3 className="text-sm font-bold leading-none">
                            Preview Dokumen Surat Tugas Resmi
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {st.noSt}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pr-8">
                    {isPublished ? (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            TTE Terverifikasi
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800">
                            Menunggu TTE Inspektur
                        </span>
                    )}
                </div>
            </div>

            {/* 2. LEMBAR KERTAS SURAT TUGAS A4 ELEGAN */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/70">
                <div className="w-full max-w-[680px] bg-white border border-slate-300 p-8 sm:p-10 font-serif shadow-xl text-xs text-slate-900 space-y-6 relative my-auto">
                    
                    {/* KOP SURAT RESMI DAERAH */}
                    <div className="text-center pb-3 relative">
                        <div className="flex items-center justify-center gap-3 mb-1">
                            <Building2 className="w-8 h-8 text-slate-900 shrink-0" />
                            <div>
                                <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase font-serif">Pemerintah Kota Surabaya</h2>
                                <h1 className="text-sm sm:text-base font-bold tracking-widest uppercase font-serif text-slate-900">Inspektorat Daerah</h1>
                            </div>
                        </div>
                        <p className="text-[10px] font-sans text-slate-600 italic">
                            Jl. Jimerto No. 25-27, Surabaya &bull; Telp. (031) 5312144 &bull; Laman: inspektorat.surabaya.go.id
                        </p>
                        {/* GARIS GANDA KOP SURAT */}
                        <div className="border-b-2 border-slate-900 mt-2"></div>
                        <div className="border-b border-slate-900 mt-0.5"></div>
                    </div>

                    {/* JUDUL SURAT TUGAS */}
                    <div className="text-center space-y-0.5">
                        <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase underline font-serif">SURAT TUGAS</h3>
                        <p className="text-[11px] font-sans font-semibold text-slate-700">Nomor: {st.noSt}</p>
                    </div>

                    {/* DASAR PENUGASAN */}
                    <div className="space-y-3 font-sans text-[11px] leading-relaxed text-slate-800 text-justify">
                        <p>
                            Berdasarkan Peraturan Daerah tentang Rencana Program Kerja Pengawasan Tahunan (PKPT) Berbasis Risiko Inspektorat Daerah Kota Surabaya Tahun Anggaran 2026, Inspektur Daerah Kota Surabaya dengan ini menugaskan:
                        </p>

                        {/* TABEL PERSONIL AUDITOR RESMI */}
                        <div className="border border-slate-300 my-2">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-300 text-left">
                                        <th className="p-2 font-bold w-8 text-center border-r border-slate-300">No</th>
                                        <th className="p-2 font-bold border-r border-slate-300">Nama / NIP</th>
                                        <th className="p-2 font-bold border-r border-slate-300">Jabatan Fungsional</th>
                                        <th className="p-2 font-bold w-36 text-center">Kedudukan dalam Tim</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-sans">
                                    {st.stAuditors && st.stAuditors.length > 0 ? (
                                        st.stAuditors.map((auditor, idx) => {
                                            const roleLabel = auditor.peranDalamTim === 'Pengawas_Teknis'
                                                ? 'Pengawas Teknis'
                                                : auditor.peranDalamTim === 'Ketua_Tim'
                                                ? 'Ketua Tim Pemeriksa'
                                                : 'Anggota Tim Pemeriksa';

                                            const isPt = auditor.peranDalamTim === 'Pengawas_Teknis';
                                            const isKt = auditor.peranDalamTim === 'Ketua_Tim';

                                            return (
                                                <tr key={auditor.auditorId || idx}>
                                                    <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                                                    <td className="p-2 border-r border-slate-200">
                                                        <p className="font-bold text-slate-900">{auditor.nama}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">NIP. {auditor.nip}</p>
                                                    </td>
                                                    <td className="p-2 border-r border-slate-200 text-slate-700">{auditor.jabatan || 'Auditor Muda'}</td>
                                                    <td className={`p-2 text-center font-bold ${
                                                        isPt 
                                                            ? 'text-purple-700 bg-purple-50/40' 
                                                            : isKt 
                                                            ? 'text-blue-700 bg-blue-50/40' 
                                                            : 'text-slate-700'
                                                    }`}>
                                                        {roleLabel}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <>
                                            {/* Fallback Jika Belum Ada Relasi Tersimpan */}
                                            <tr>
                                                <td className="p-2 text-center border-r border-slate-200 font-mono">1</td>
                                                <td className="p-2 border-r border-slate-200">
                                                    <p className="font-bold text-slate-900">{getAuditorName(st.ketuaTimId)}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">NIP. {getAuditorNip(st.ketuaTimId)}</p>
                                                </td>
                                                <td className="p-2 border-r border-slate-200 text-slate-700">Auditor Madya</td>
                                                <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/50">Ketua Tim Pemeriksa</td>
                                            </tr>
                                            {anggotaList.map((id: string, idx: number) => (
                                                <tr key={id || idx}>
                                                    <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 2}</td>
                                                    <td className="p-2 border-r border-slate-200">
                                                        <p className="font-bold text-slate-900">{getAuditorName(id)}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">NIP. {getAuditorNip(id)}</p>
                                                    </td>
                                                    <td className="p-2 border-r border-slate-200 text-slate-700">Auditor Muda</td>
                                                    <td className="p-2 text-center text-slate-700">Anggota Tim Pemeriksa</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* RINCIAN PENUGASAN */}
                        <div className="space-y-1 pt-1 font-sans">
                            <p>Untuk melaksanakan tugas pengawasan dengan rincian sebagai berikut:</p>
                            <div className="grid grid-cols-12 gap-1 text-[11px] pt-1">
                                <span className="col-span-3 font-semibold text-slate-600">1. Program Pengawasan</span>
                                <span className="col-span-9 font-bold text-slate-900">: {st.namaAudit || 'Audit Kepatuhan & Akuntabilitas'}</span>

                                <span className="col-span-3 font-semibold text-slate-600">2. Sasaran / Auditi</span>
                                <span className="col-span-9 font-bold text-slate-900">: {st.namaOpd || 'Perangkat Daerah Terkait'}</span>

                                <span className="col-span-3 font-semibold text-slate-600">3. Waktu Pelaksanaan</span>
                                <span className="col-span-9 font-mono text-slate-900 font-semibold">: {st.tglMulai} s.d. {st.tglSelesai}</span>

                                <span className="col-span-3 font-semibold text-slate-600">4. Lokasi Pemeriksaan</span>
                                <span className="col-span-9 font-semibold text-slate-900">: {st.lokasi || 'Kantor OPD & Lokasi Lapangan'}</span>
                            </div>
                        </div>

                        <p className="pt-2 text-justify">
                            Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab dan menyampaikan Laporan Hasil Pengawasan (LHP) kepada Inspektur Daerah setelah penugasan selesai.
                        </p>
                    </div>

                    {/* BLOK TANDA TANGAN ELEKTRONIK RESMI */}
                    <div className="flex justify-between items-end pt-6 font-sans">
                        {/* QR Code Verifikasi Kedinasan */}
                        <div className="border border-slate-200 p-2 bg-slate-50 flex items-center gap-2">
                            <QrCode className="w-10 h-10 text-slate-800 shrink-0" />
                            <div className="text-[9px] text-slate-600 leading-tight">
                                <p className="font-bold text-slate-800">BSrE &bull; BSSN RI</p>
                                <p>Dokumen ini telah ditandatangani</p>
                                <p>secara elektronik resmi APIP.</p>
                            </div>
                        </div>

                        {/* Kolom Tanda Tangan */}
                        <div className="w-56 text-center space-y-2 font-sans">
                            <p className="text-[10px] text-slate-600">
                                Ditetapkan di Surabaya<br />
                                Pada tanggal {new Date(st.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs font-bold uppercase text-slate-900">
                                Inspektur Daerah Kota Surabaya
                            </p>
                            
                            {isPublished ? (
                                <div className="border border-emerald-600 bg-emerald-50/40 p-2 rounded-none text-center space-y-0.5 select-none">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                                    <p className="text-[9px] font-bold text-emerald-900 uppercase tracking-wider">Ditandatangani Secara Elektronik</p>
                                    <p className="text-[7px] font-mono text-emerald-700 truncate">{st.tteHash || 'SHA256-VALIDATED-E-GOV'}</p>
                                </div>
                            ) : (
                                <div className="h-14 flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-[10px] italic bg-slate-50">
                                    Menunggu Tanda Tangan Digital
                                </div>
                            )}

                            <p className="text-[11px] font-bold text-slate-900 pt-1 underline">
                                Dr. H. Ikhsan, S.Psi., M.M.
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono -mt-1">
                                Pembina Utama Madya (IV/d)<br />
                                NIP. 19690809 199503 1 002
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. FOOTER AKSI MODAL (RAPI, SIMETRIS & MEMBENTANG PENUH) */}
            <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Button 
                        type="button"
                        onClick={() => exportSuratTugasPdf(st)}
                        className="rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-none h-9 px-4 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ekspor PDF Surat Tugas</span>
                    </Button>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button 
                        type="button"
                        variant="outline" 
                        className="rounded-none border-slate-300 text-xs shadow-none h-9 px-5 font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={onClose}
                        disabled={isSigning}
                    >
                        Tutup Preview
                    </Button>
                    
                    {!isPublished && isInspektur && !isSigning && (
                        <Button 
                            type="button"
                            onClick={handleSignST}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold px-6 h-9 shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Sahkan &amp; Tanda Tangani ST (TTE)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
