// src/features/penugasan/components/PkaWorkspace.tsx
'use client';

import { useState, useEffect } from 'react';
import { useStListQuery } from '@/hooks/queries/useSt';
import { 
    Sparkles, FileText, Trash2, Building2, Calendar, Users, ArrowRight, Download 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { exportPkaPdf } from '@/lib/pdfGenerator';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

export interface PkaItem {
    id: string;
    stId: string;
    kodeProsedur: string;
    langkahKerja: string;
    metode: 'Cek Dokumen' | 'Rekonsiliasi / Cross-Check' | 'Cek Fisik Lapangan' | 'Wawancara';
    auditorPelaksana: string;
    alokasiHari: number;
    dasarPengujian: string;
}

export const getPkaTemplateForOpd = (stId: string, opdName: string = '', auditName: string = ''): PkaItem[] => {
    const name = opdName.toLowerCase();
    
    if (name.includes('kesehatan') || name.includes('dinkes')) {
        return [
            {
                id: `pka-${stId}-01`,
                stId,
                kodeProsedur: 'PKA-01',
                langkahKerja: 'Lakukan uji kepatuhan batas harga satuan kuitansi SPJ pengadaan Obat & Bahan Medis Habis Pakai (BMHP) 63 Puskesmas terhadap Perwali SSH No. 12/2026.',
                metode: 'Rekonsiliasi / Cross-Check',
                auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
                alokasiHari: 3,
                dasarPengujian: 'Perwali SSH No. 12/2026 (Kode BMHP-FARM-01)'
            },
            {
                id: `pka-${stId}-02`,
                stId,
                kodeProsedur: 'PKA-02',
                langkahKerja: 'Periksa kesesuaian rekening DPA 2026 atas Belanja Modal Alat Kedokteran Digital (USG & Rontgen) dan kelengkapan izin edar resmi Kemenkes.',
                metode: 'Cek Dokumen',
                auditorPelaksana: 'Siti Rahmawati, S.Tr.Ak (Anggota Tim)',
                alokasiHari: 2,
                dasarPengujian: 'DPA Dinas Kesehatan TA 2026 (Pagu Rp 45 Miliar)'
            },
            {
                id: `pka-${stId}-03`,
                stId,
                kodeProsedur: 'PKA-03',
                langkahKerja: 'Lakukan uji petik fisik persediaan obat di Gudang Farmasi Dinkes untuk memeriksa masa kedaluwarsa antibiotik dan pemenuhan SOP pemusnahan.',
                metode: 'Cek Fisik Lapangan',
                auditorPelaksana: 'Ahmad Fauzi, S.E. (Anggota Tim)',
                alokasiHari: 4,
                dasarPengujian: 'LHP Historis Kepatuhan Farmasi TA 2025'
            },
            {
                id: `pka-${stId}-04`,
                stId,
                kodeProsedur: 'PKA-04',
                langkahKerja: 'Konfirmasi dan wawancara berita acara kepada Kasubag Keuangan Dinkes terkait realisasi pembayaran jasa pelayanan dokter umum dan nakes kontrak.',
                metode: 'Wawancara',
                auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
                alokasiHari: 2,
                dasarPengujian: 'DPA Sub-kegiatan Jasa Medis Dinkes 2026'
            }
        ];
    }

    if (name.includes('inspektorat') || name.includes('reviu') || auditName.toLowerCase().includes('reviu')) {
        return [
            {
                id: `pka-${stId}-01`,
                stId,
                kodeProsedur: 'PKA-01',
                langkahKerja: 'Reviu keselarasan Piagam Pengawasan Intern (Internal Audit Charter) dan SOP Tata Kelola terhadap Pedoman Standar Audit APIP BPKP 2026.',
                metode: 'Cek Dokumen',
                auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
                alokasiHari: 3,
                dasarPengujian: 'Pedoman Standar Audit APIP BPKP RI 2026'
            },
            {
                id: `pka-${stId}-02`,
                stId,
                kodeProsedur: 'PKA-02',
                langkahKerja: 'Evaluasi ketercapaian target Program Kerja Pengawasan Tahunan (PKPT) berbasis risiko dan realisasi alokasi jam kerja pengawasan (Mandays).',
                metode: 'Rekonsiliasi / Cross-Check',
                auditorPelaksana: 'Siti Rahmawati, S.Tr.Ak (Anggota Tim)',
                alokasiHari: 3,
                dasarPengujian: 'Matriks PKPT Inspektorat Kota Surabaya 2026'
            },
            {
                id: `pka-${stId}-03`,
                stId,
                kodeProsedur: 'PKA-03',
                langkahKerja: 'Uji petik pertanggungjawaban realisasi anggaran perjalanan dinas dan belanja operasional pengawasan pada sekretariat Inspektorat Daerah.',
                metode: 'Cek Dokumen',
                auditorPelaksana: 'Ahmad Fauzi, S.E. (Anggota Tim)',
                alokasiHari: 2,
                dasarPengujian: 'DPA Sekretariat Inspektorat Daerah TA 2026'
            },
            {
                id: `pka-${stId}-04`,
                stId,
                kodeProsedur: 'PKA-04',
                langkahKerja: 'Wawancara dengan para Inspektur Pembantu Wilayah I s.d IV mengenai evaluasi kendala pengawasan dan pemantauan tindak lanjut LHP.',
                metode: 'Wawancara',
                auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
                alokasiHari: 2,
                dasarPengujian: 'Laporan Berkala TLHP Inspektorat 2025'
            }
        ];
    }

    // Default: Dinas Pendidikan
    return [
        {
            id: `pka-${stId}-01`,
            stId,
            kodeProsedur: 'PKA-01',
            langkahKerja: 'Lakukan uji kepatuhan batas harga satuan kuitansi SPJ pengadaan barang/jasa operasional terhadap Peraturan Walikota No. 12/2026 tentang Standar Satuan Harga (SSH).',
            metode: 'Rekonsiliasi / Cross-Check',
            auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
            alokasiHari: 3,
            dasarPengujian: 'Perwali SSH No. 12/2026 (Kode SBU-SEW-01)'
        },
        {
            id: `pka-${stId}-02`,
            stId,
            kodeProsedur: 'PKA-02',
            langkahKerja: 'Periksa kesesuaian mata anggaran dan ketersediaan alokasi pagu belanja pada Dokumen Pelaksanaan Anggaran (DPA) SKPD TA 2026 atas realisasi pembelian alat/mesin kantor.',
            metode: 'Cek Dokumen',
            auditorPelaksana: 'Siti Rahmawati, S.Tr.Ak (Anggota Tim)',
            alokasiHari: 2,
            dasarPengujian: 'DPA Dinas Pendidikan TA 2026 (Sub-kegiatan 1.01.02)'
        },
        {
            id: `pka-${stId}-03`,
            stId,
            kodeProsedur: 'PKA-03',
            langkahKerja: 'Lakukan uji petik pemeriksaan fisik ke lokasi sekolah penerima bantuan DAK Fisik/Rehabilitasi Ruang Kelas untuk mengukur progres fisik dan volume pekerjaan.',
            metode: 'Cek Fisik Lapangan',
            auditorPelaksana: 'Ahmad Fauzi, S.E. (Anggota Tim)',
            alokasiHari: 4,
            dasarPengujian: 'Renstra 2024-2026 & Juknis DAK Kemendikbud'
        },
        {
            id: `pka-${stId}-04`,
            stId,
            kodeProsedur: 'PKA-04',
            langkahKerja: 'Lakukan konfirmasi dan wawancara berita acara kepada Bendahara Pengeluaran serta PPK terkait sisa uang persediaan dan tindak lanjut temuan LHP tahun 2025.',
            metode: 'Wawancara',
            auditorPelaksana: 'Budi Santoso, S.E., Ak. (Ketua Tim)',
            alokasiHari: 2,
            dasarPengujian: 'LHP Historis Dinas Pendidikan TA 2025'
        }
    ];
};

export default function PkaWorkspace() {
    const { data: stData = [] } = useStListQuery();
    const [selectedStId, setSelectedStId] = useState<string>('');
    const [pkaList, setPkaList] = useState<PkaItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter ST yang valid dan utamakan ST Dinas Pendidikan
    const activeStList = stData.filter((st: any) => st.noSt || st.nomorSt);
    const disdikSt = activeStList.find((s: any) => s.namaOpd?.toLowerCase().includes('pendidikan') || s.noSt?.includes('001'));
    const defaultSt = disdikSt || activeStList[0];

    // Inisialisasi ST terpilih pertama kali
    useEffect(() => {
        if (!selectedStId && defaultSt) {
            setSelectedStId(defaultSt.id);
        }
    }, [defaultSt, selectedStId]);

    const selectedSt = activeStList.find((s: any) => s.id === selectedStId) || defaultSt;

    // Setiap dropdown ST berubah, update isi PKA otomatis sesuai OPD tersebut
    useEffect(() => {
        if (selectedStId && selectedSt) {
            setPkaList(prev => {
                const exists = prev.some(p => p.stId === selectedStId);
                if (!exists) {
                    const dynamicItems = getPkaTemplateForOpd(selectedStId, selectedSt.namaOpd, selectedSt.namaAudit);
                    return [...prev.filter(p => p.stId !== selectedStId), ...dynamicItems];
                }
                return prev;
            });
        }
    }, [selectedStId, selectedSt]);

    // Filter PKA untuk ST terpilih saat ini
    const currentPkas = pkaList.filter(p => p.stId === selectedStId);

    const handleGenerateAi = async () => {
        if (!selectedSt) return;
        setIsGenerating(true);
        toast.info('AI Merumuskan Prosedur Audit...', {
            description: `Menganalisis profil ${selectedSt.namaOpd} dan dasar regulasi terkait.`
        });

        await new Promise(resolve => setTimeout(resolve, 800));

        const generatedItems = getPkaTemplateForOpd(selectedSt.id, selectedSt.namaOpd, selectedSt.namaAudit).map((item, idx) => ({
            ...item,
            id: `pka-${selectedSt.id}-${idx + 1}-${Date.now()}`
        }));

        setPkaList(prev => {
            const others = prev.filter(p => p.stId !== selectedSt.id);
            return [...others, ...generatedItems];
        });

        setIsGenerating(false);
        toast.success(`PKA untuk ${selectedSt.namaOpd} Berhasil Dihasilkan AI`);
    };

    const handleDelete = (id: string) => {
        setPkaList(prev => prev.filter(p => p.id !== id));
        toast.info('Prosedur Audit Dihapus');
    };

    const totalHari = currentPkas.reduce((acc, p) => acc + p.alokasiHari, 0);

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* HEADER WORKSPACE DENGAN TOMBOL NAVIGASI LANGSUNG */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Program Kerja Audit (PKA)
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Rencana dan prosedur langkah kerja pengujian substantif sebelum pemeriksaan kuitansi SPJ di lapangan.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleGenerateAi}
                        disabled={isGenerating}
                        variant="outline"
                        className="rounded-none border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 px-3 shadow-none flex items-center gap-1.5 cursor-pointer"
                    >
                        <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>{isGenerating ? 'Menyusun...' : 'Generate Prosedur AI'}</span>
                    </Button>

                    <Button
                        onClick={() => {
                            if (selectedSt) {
                                exportPkaPdf(selectedSt, currentPkas);
                            }
                        }}
                        variant="outline"
                        className="rounded-none border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 px-3 shadow-none flex items-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ekspor PDF PKA</span>
                    </Button>
                </div>
            </div>

            {/* BAR PILIH SURAT TUGAS & RINGKASAN */}
            <div className="border border-slate-200 bg-white p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="w-full sm:max-w-lg space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Pilih Surat Tugas Objek Pemeriksaan:
                        </Label>
                        <Select 
                            value={selectedStId || (selectedSt?.id || '')} 
                            onValueChange={(val) => setSelectedStId(val || '')}
                        >
                            <SelectTrigger className="rounded-none border-slate-300 text-xs font-semibold focus:border-blue-500 h-9 bg-white w-full">
                                <span className="truncate text-left">
                                    {selectedSt ? `${selectedSt.noSt} • ${selectedSt.namaOpd}` : 'Pilih Surat Tugas...'}
                                </span>
                            </SelectTrigger>
                            <SelectContent className="rounded-none max-h-60">
                                {activeStList.map((st: any) => (
                                    <SelectItem key={st.id} value={st.id} className="text-xs font-medium py-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{st.noSt}</span>
                                            <span className="text-[11px] text-slate-500">{st.namaOpd} &bull; {st.namaAudit}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* RINGKASAN SASARAN AUDIT */}
                <div className="border border-slate-200 bg-slate-50/80 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Objek Pemeriksaan</p>
                        <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{selectedSt?.namaOpd || 'Dinas Pendidikan Kota Surabaya'}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Program Pengawasan</p>
                        <p className="font-bold text-slate-900 mt-0.5 truncate">
                            {selectedSt?.namaAudit || 'Evaluasi Rencana & Kepatuhan Keuangan'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Waktu</p>
                        <p className="font-mono text-slate-800 font-bold mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {totalHari} Hari Kerja ({currentPkas.length} Prosedur)
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Penanggung Jawab</p>
                        <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Budi Santoso, S.E., Ak. (KT)
                        </p>
                    </div>
                </div>
            </div>

            {/* TABEL PROSEDUR PKA */}
            <div className="border border-slate-200 bg-white rounded-none overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daftar Prosedur Pengujian Substantif ({currentPkas.length} Langkah Kerja) &bull; <span className="text-blue-700 font-bold">{selectedSt?.namaOpd}</span>
                    </h3>
                </div>

                <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '44%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '5%' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-left text-xs font-bold text-slate-700">
                            <th className="py-2.5 px-3 text-center">Kode</th>
                            <th className="py-2.5 px-3">Uraian Langkah Kerja Pengujian</th>
                            <th className="py-2.5 px-3">Metode &amp; Teknik Uji</th>
                            <th className="py-2.5 px-3">Auditor Pelaksana</th>
                            <th className="py-2.5 px-2 text-center">Hari</th>
                            <th className="py-2.5 px-2 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                        {currentPkas.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                    Belum ada prosedur kerja untuk Surat Tugas ini. Klik tombol &quot;Generate Prosedur AI&quot; di atas.
                                </td>
                            </tr>
                        ) : (
                            currentPkas.map((pka) => (
                                <tr key={pka.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 px-3 align-top text-center font-mono font-bold text-xs text-blue-700">
                                        {pka.kodeProsedur}
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                        <p className="text-xs text-slate-900 leading-relaxed font-semibold">
                                            {pka.langkahKerja}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                                            Rujukan Acuan: <strong>{pka.dasarPengujian}</strong>
                                        </p>
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border ${
                                            pka.metode === 'Rekonsiliasi / Cross-Check'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : pka.metode === 'Cek Fisik Lapangan'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : pka.metode === 'Wawancara'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {pka.metode}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 align-top text-slate-700 font-medium">
                                        {pka.auditorPelaksana}
                                    </td>
                                    <td className="py-3 px-2 align-top text-center font-mono font-bold text-slate-700">
                                        {pka.alokasiHari} hr
                                    </td>
                                    <td className="py-3 px-2 align-top text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(pka.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                                            title="Hapus prosedur ini"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
