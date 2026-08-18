// src/features/planning/components/pkpt/PkptDetailModal.tsx
'use client';

import React from 'react';
import { AuditAgenda } from '@/store/usePkptStore';
import { Layers, FileText, Users, X, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getSaranaIcon } from './pkpt.constants';
import { formatUnitKerja } from '@/lib/formatters';

interface PkptDetailModalProps {
    agenda: AuditAgenda | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PkptDetailModal: React.FC<PkptDetailModalProps> = ({
    agenda,
    open,
    onOpenChange,
}) => {
    if (!agenda) return null;

    const unitFormatted = formatUnitKerja(agenda.pelaksana);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* MODAL LEBAR BERBASIS DIVIDER BERSIH (NO NESTED BOXES) */}
            <DialogContent className="sm:max-w-[960px] max-h-[85vh] rounded-none p-0 overflow-hidden border-slate-300 shadow-2xl flex flex-col my-auto">
                {/* Header Modal */}
                <DialogHeader className="bg-slate-900 text-white p-4 shrink-0">
                    <DialogTitle className="text-sm font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            Rincian Standar Agenda Pengawasan PKPT
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-300">
                            {agenda.namaOpd}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Body Content (Scrollable with Clean Dividers) */}
                <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-800 space-y-5">
                    {/* 1. HEADER RINGKASAN PROGRAM (NO BOX IN BOX) */}
                    <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-blue-700">{unitFormatted}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="font-mono font-semibold text-slate-700">{agenda.jadwal || 'TW I'}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="text-slate-600 font-medium">Jenis: {agenda.jenisPengawasan}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                                {agenda.areaPengawasan}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Objek Perangkat Daerah: <strong className="text-slate-800">{agenda.namaOpd}</strong>
                            </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 sm:text-right">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Total Alokasi</p>
                                <p className="text-sm font-mono font-bold text-blue-900">
                                    {agenda.hariPemeriksaan?.totalHp || 50} HP
                                </p>
                            </div>
                            <div className="h-7 w-px bg-slate-200" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Tingkat Risiko</p>
                                <p className={`text-sm font-bold ${
                                    agenda.prioritas === 'Tinggi' ? 'text-red-600' : 'text-slate-700'
                                }`}>
                                    {agenda.prioritas || 'Tinggi'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. GRID 2 KOLOM INFORMASI UTAMA (BERSIH DENGAN PEMBATAS SLATE) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* SISI KIRI: RUANG LINGKUP & DISTRIBUSI TIM (5 Kolom) */}
                        <div className="md:col-span-5 space-y-4 md:border-r md:border-slate-200 md:pr-6">
                            {/* Ruang Lingkup */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruang Lingkup Pemeriksaan</p>
                                <p className="text-slate-800 text-xs mt-1 leading-relaxed">
                                    {agenda.ruangLingkup || 'Seluruh Realisasi Belanja & Pelaksanaan Kegiatan'}
                                </p>
                            </div>

                            {/* Alokasi Tim HP (Metrik Garis Bersih) */}
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                    Distribusi Alokasi Tim (Hari Pemeriksaan)
                                </p>
                                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                                    <span className="text-slate-600">Pengawas Teknis (Dalnis)</span>
                                    <span className="font-mono font-bold text-slate-900">{agenda.hariPemeriksaan?.dalnis || 10} HP</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                                    <span className="text-slate-600">Ketua Tim (KT)</span>
                                    <span className="font-mono font-bold text-slate-900">{agenda.hariPemeriksaan?.kt || 15} HP</span>
                                </div>
                                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                                    <span className="text-slate-600">Anggota Tim (AT)</span>
                                    <span className="font-mono font-bold text-slate-900">{agenda.hariPemeriksaan?.at || 30} HP</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 text-xs font-bold text-blue-900">
                                    <span>Total Hari Pemeriksaan (JUM HP)</span>
                                    <span className="font-mono">{agenda.hariPemeriksaan?.totalHp || 55} HP</span>
                                </div>
                            </div>

                            {/* Target Output Laporan */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Target Output LHP:</span>
                                <span className="font-bold text-slate-900">{agenda.jumlahLaporan || 1} Dokumen Laporan</span>
                            </div>
                        </div>

                        {/* SISI KANAN: TUJUAN, SARPRAS & JUSTIFIKASI (7 Kolom) */}
                        <div className="md:col-span-7 space-y-4">
                            {/* Tujuan & Sasaran Pemeriksaan */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    Tujuan dan Sasaran Pemeriksaan (Poin-Poin Pokok)
                                </p>
                                <div className="border-l-2 border-blue-600 pl-3 py-1 font-sans text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                                    {agenda.tujuanSasaran || 'Pemeriksaan kepatuhan, keandalan pelaporan keuangan, dan akuntabilitas pelaksanaan program kerja.'}
                                </div>
                            </div>

                            {/* Kebutuhan Sarana & Prasarana Logistik */}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Kebutuhan Sarana dan Prasarana Logistik
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {agenda.saranaPrasarana && agenda.saranaPrasarana.length > 0 ? (
                                        agenda.saranaPrasarana.map((item, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 font-medium">
                                                {getSaranaIcon(item)}
                                                {item}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">Laptop, Printer, ATK</span>
                                    )}
                                </div>
                            </div>

                            {/* Keterangan / Justifikasi Risiko */}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Keterangan / Justifikasi Risiko
                                </p>
                                <p className="text-xs text-slate-600 italic leading-relaxed">
                                    {agenda.keterangan || 'Prioritas Pengawasan Berbasis Risiko Tahun Anggaran 2026.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Rapi & Menyatu */}
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
                    <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="bg-slate-800 hover:bg-slate-900 text-white rounded-none text-xs font-semibold px-6 h-9 shadow-xs"
                    >
                        Tutup Rincian
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
