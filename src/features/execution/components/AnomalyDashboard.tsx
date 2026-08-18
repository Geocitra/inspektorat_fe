// src/features/execution/components/AnomalyDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useKkaStore, KkaItem } from '@/store/useKkaStore';
import { FileText, Download, ArrowRight, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { exportKkaPdf } from '@/lib/pdfGenerator';
import Link from 'next/link';

interface AnomalyDashboardProps {
    stId: string;
}

export default function AnomalyDashboard({ stId }: AnomalyDashboardProps) {
    const { kkaList, saveJustification, loadSampleSpjForDisdik, isUploading } = useKkaStore();
    const [selectedItem, setSelectedItem] = useState<KkaItem | null>(null);
    const [justifikasiInput, setJustifikasiInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Auto load sample SPJ jika belum ada item untuk ST ini
    useEffect(() => {
        if (stId) {
            const hasItems = kkaList.some(item => item.stId === stId);
            if (!hasItems) {
                loadSampleSpjForDisdik(stId);
            }
        }
    }, [stId, kkaList.length]);

    const currentKkaItems = kkaList.filter(item => item.stId === stId);

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val);
    };

    const handleOpenAnalysis = (item: KkaItem) => {
        setSelectedItem(item);
        setJustifikasiInput(item.justifikasi || '');
        setIsModalOpen(true);
    };

    const handleSaveJustification = () => {
        if (!selectedItem) return;
        if (!justifikasiInput.trim()) {
            toast.error('Justifikasi Wajib Diisi', { description: 'Harap berikan keterangan justifikasi logis pemeriksaan Anda.' });
            return;
        }

        saveJustification(selectedItem.id, justifikasiInput);
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    // Metrik Agregat
    const totalNilaiSpj = currentKkaItems.reduce((acc, k) => acc + k.hargaSpj, 0);
    const itemsAnomali = currentKkaItems.filter(k => k.hargaSpj > k.hargaSsh || k.selisih > 0);
    const totalDeviasi = itemsAnomali.reduce((acc, k) => acc + k.selisih, 0);
    const itemsValid = currentKkaItems.filter(k => k.selisih === 0);

    return (
        <div className="space-y-5">
            {/* HEADER & ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-700" />
                        Kertas Kerja Audit (KKA) &amp; Hasil Deteksi Anomali
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Rekonsiliasi data kuitansi SPJ belanja terhadap Standar Satuan Harga (SSH) dan alokasi DPA TA 2026.
                    </p>
                </div>

                {currentKkaItems.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                const mockSt: any = {
                                    id: stId,
                                    noSt: 'ST.700.1.2/001/ITDA-IRB.I/2026',
                                    namaOpd: 'Dinas Pendidikan Kota Surabaya',
                                    namaAudit: 'Evaluasi Rencana & Kepatuhan Keuangan',
                                    tglMulai: '16 Maret 2026',
                                    tglSelesai: '27 Maret 2026'
                                };
                                exportKkaPdf(mockSt, currentKkaItems);
                            }}
                            variant="outline"
                            className="rounded-none border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 px-3 shadow-none flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>Ekspor PDF KKA</span>
                        </Button>

                        <Link href={`/audit-execution/${stId}/review`}>
                            <Button className="rounded-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 px-3.5 shadow-none flex items-center gap-1.5 cursor-pointer">
                                <span>Reviu Temuan &amp; NHP</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* RINGKASAN METRIK KKA (MONOKROM SLATE) */}
            {currentKkaItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-slate-200 bg-white p-3.5 rounded-none">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sampel SPJ Diuji</p>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-base font-bold text-slate-900 font-mono">{formatRupiah(totalNilaiSpj)}</span>
                            <span className="text-xs text-slate-500 font-mono">{currentKkaItems.length} Transaksi</span>
                        </div>
                    </div>

                    <div className="border border-slate-200 bg-white p-3.5 rounded-none">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Indikasi Selisih Deviasi</p>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-base font-bold text-slate-900 font-mono">+{formatRupiah(totalDeviasi)}</span>
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 font-mono">
                                {itemsAnomali.length} Temuan
                            </span>
                        </div>
                    </div>

                    <div className="border border-slate-200 bg-white p-3.5 rounded-none">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transaksi Sesuai Standar</p>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-base font-bold text-slate-900 font-mono">
                                {formatRupiah(itemsValid.reduce((acc, k) => acc + k.hargaSpj, 0))}
                            </span>
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 font-mono">
                                {itemsValid.length} Valid
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* TABEL KERTAS KERJA AUDIT (KKA) */}
            {currentKkaItems.length === 0 ? (
                <div className="border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center rounded-none space-y-4">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-1" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Kertas Kerja Audit (KKA) Belum Terisi</h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-md leading-relaxed">
                            Belum ada bukti transaksi SPJ yang diekstrak untuk Surat Tugas ini.
                        </p>
                    </div>
                    <Button
                        onClick={() => loadSampleSpjForDisdik(stId)}
                        disabled={isUploading}
                        className="rounded-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-none px-4"
                    >
                        {isUploading ? 'Memuat SPJ...' : 'Muat Sampel SPJ Dinas Pendidikan'}
                    </Button>
                </div>
            ) : (
                <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '42%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-left text-xs font-bold text-slate-700">
                                <th className="py-2.5 px-3 text-center">No</th>
                                <th className="py-2.5 px-3">Uraian Transaksi / Objek Belanja</th>
                                <th className="py-2.5 px-3 text-right">Nilai SPJ</th>
                                <th className="py-2.5 px-3 text-right">Batas SSH / DPA</th>
                                <th className="py-2.5 px-3 text-right">Deviasi</th>
                                <th className="py-2.5 px-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {currentKkaItems.map((item, index) => {
                                const isMarkup = item.hargaSpj > item.hargaSsh || item.selisih > 0;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-3 align-top text-center font-mono text-slate-400">
                                            {index + 1}
                                        </td>
                                        
                                        <td className="py-3 px-3 align-top">
                                            <p className="text-xs font-semibold text-slate-900 leading-snug break-words">
                                                {item.namaBarang}
                                            </p>
                                            {item.justifikasi && (
                                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                    <span className="font-semibold text-slate-600">Justifikasi:</span> {item.justifikasi}
                                                </p>
                                            )}
                                        </td>

                                        <td className="py-3 px-3 align-top text-right font-mono font-medium text-slate-800">
                                            {formatRupiah(item.hargaSpj)}
                                        </td>

                                        <td className="py-3 px-3 align-top text-right font-mono text-slate-600">
                                            {item.hargaSsh > 0 ? (
                                                formatRupiah(item.hargaSsh)
                                            ) : (
                                                <span className="text-[11px] text-slate-500 font-sans">
                                                    Tanpa Pagu
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3 align-top text-right">
                                            {isMarkup ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono font-bold text-slate-900">
                                                        +{formatRupiah(item.selisih)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                                                        Deviasi SSH
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-slate-400 text-[11px]">
                                                    Rp 0
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3 align-top text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenAnalysis(item)}
                                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer inline-flex items-center justify-center"
                                                title="Lihat Detail Pemeriksaan"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DETAIL & JUSTIFICATION DIALOG */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-none border border-slate-200 shadow-xl p-5">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-700" />
                            Detail Pemeriksaan Kertas Kerja Audit
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                            Hasil pemindaian kuitansi SPJ terhadap Standar Satuan Harga (SSH) dan alokasi DPA.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Objek Belanja */}
                            <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Uraian Objek Pengadaan</p>
                                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{selectedItem.namaBarang}</p>
                            </div>

                            {/* Comparison Block */}
                            <div className="grid grid-cols-3 gap-2.5 text-xs py-1">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Nilai Kuitansi SPJ</p>
                                    <p className="font-bold text-slate-900 font-mono mt-0.5">{formatRupiah(selectedItem.hargaSpj)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Batas Acuan SSH / DPA</p>
                                    <p className="font-bold text-slate-800 font-mono mt-0.5">
                                        {selectedItem.hargaSsh > 0 ? formatRupiah(selectedItem.hargaSsh) : 'Rp 0 (Tanpa Pagu)'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Selisih Deviasi</p>
                                    <p className="font-bold text-slate-900 font-mono mt-0.5">
                                        {selectedItem.selisih > 0 ? `+${formatRupiah(selectedItem.selisih)}` : 'Rp 0'}
                                    </p>
                                </div>
                            </div>

                            {/* Uraian Temuan */}
                            <div className="space-y-1 border-t border-slate-100 pt-3">
                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                    Catatan Temuan Pemeriksaan:
                                </h4>
                                <p className="text-slate-800 text-xs leading-relaxed mt-1 font-medium">
                                    {selectedItem.aiNarasi}
                                </p>
                            </div>

                            {/* Justification Textarea Form */}
                            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                <label htmlFor="justifikasi" className="text-xs font-bold text-slate-800">
                                    Catatan Justifikasi / Klarifikasi Auditor Lapangan:
                                </label>
                                <textarea
                                    id="justifikasi"
                                    value={justifikasiInput}
                                    onChange={(e) => setJustifikasiInput(e.target.value)}
                                    placeholder="Tuliskan keterangan justifikasi hasil klarifikasi kepada PPK / Bendahara..."
                                    className="w-full h-20 border border-slate-300 rounded-none p-2.5 text-xs focus:border-slate-800 focus:outline-none resize-none placeholder-slate-400"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t border-slate-100 pt-3 flex justify-between sm:justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-none border-slate-300 text-xs h-8 px-4"
                        >
                            Tutup
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSaveJustification}
                            className="rounded-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 px-4"
                        >
                            Simpan Justifikasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
