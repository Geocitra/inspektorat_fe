// src/features/planning/components/pkpt/PkptEditRowModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AuditAgenda } from '@/store/usePkptStore';
import { 
    Edit3, Users, FileText, X, Save, Check, Plus, 
    Layers, Trash2, Sparkles, Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PELAKSANA_OPTIONS, JADWAL_OPTIONS, STANDAR_SARPRAS_LIST, getSaranaIcon } from './pkpt.constants';
import { formatUnitKerja } from '@/lib/formatters';

interface PkptEditRowModalProps {
    agenda: AuditAgenda | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, updated: Partial<AuditAgenda>) => Promise<void>;
}

export const PkptEditRowModal: React.FC<PkptEditRowModalProps> = ({
    agenda,
    open,
    onOpenChange,
    onSave,
}) => {
    const [editForm, setEditForm] = useState<Partial<AuditAgenda>>({});
    const [editHp, setEditHp] = useState({ dalnis: 10, kt: 10, at: 30, pj: 1, wkpj: 1 });
    const [selectedSarpras, setSelectedSarpras] = useState<string[]>([]);
    const [customSarprasInput, setCustomSarprasInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (agenda) {
            setEditForm({
                areaPengawasan: agenda.areaPengawasan || agenda.namaAudit,
                jenisPengawasan: agenda.jenisPengawasan,
                pelaksana: agenda.pelaksana || 'Irban 1',
                jadwal: agenda.jadwal || 'TW I',
                tujuanSasaran: agenda.tujuanSasaran,
                ruangLingkup: agenda.ruangLingkup,
                jumlahLaporan: agenda.jumlahLaporan || 1,
                prioritas: agenda.prioritas || 'Tinggi',
            });
            const hp = agenda.hariPemeriksaan || {};
            setEditHp({
                dalnis: Number(hp.dalnis) || 10,
                kt: Number(hp.kt) || 10,
                at: Number(hp.at) || 30,
                pj: Number(hp.pj) || 1,
                wkpj: Number(hp.wkpj) || 1,
            });
            
            const initialSarpras = agenda.saranaPrasarana && agenda.saranaPrasarana.length > 0 
                ? agenda.saranaPrasarana 
                : ['Laptop', 'Printer', 'Kertas / ATK'];
            setSelectedSarpras(initialSarpras);
            setCustomSarprasInput('');
        }
    }, [agenda]);

    if (!agenda) return null;

    const handleToggleSarpras = (item: string) => {
        if (selectedSarpras.includes(item)) {
            setSelectedSarpras(selectedSarpras.filter(s => s !== item));
        } else {
            setSelectedSarpras([...selectedSarpras, item]);
        }
    };

    const handleAddCustomSarpras = () => {
        const trimmed = customSarprasInput.trim();
        if (trimmed && !selectedSarpras.includes(trimmed)) {
            setSelectedSarpras([...selectedSarpras, trimmed]);
            setCustomSarprasInput('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const totalHp = editHp.dalnis + editHp.kt + editHp.at + editHp.pj + editHp.wkpj;

        await onSave(agenda.id, {
            ...editForm,
            hariPemeriksaan: {
                ...editHp,
                totalHp,
            },
            saranaPrasarana: selectedSarpras.length > 0 ? selectedSarpras : ['Laptop', 'Printer', 'Kertas / ATK'],
        });

        setIsSaving(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* CONTAINER MODAL FIT VIEWPORT & CLEAN DIVIDERS */}
            <DialogContent className="sm:max-w-[960px] max-h-[85vh] rounded-none p-0 overflow-hidden border-slate-300 shadow-2xl flex flex-col my-auto">
                <DialogHeader className="bg-slate-900 text-white p-4 shrink-0">
                    <DialogTitle className="text-sm font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-amber-400" />
                            Edit Agenda Pengawasan (Khusus Baris Ini)
                        </span>
                        <span className="text-xs font-mono font-medium text-amber-300">
                            {agenda.namaOpd}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-800 space-y-5">
                    {/* INFO OPD (HEADER ROW) */}
                    <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Perangkat Daerah Sasaran</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{agenda.namaOpd}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 border border-blue-200">
                            {formatUnitKerja(editForm.pelaksana)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* KOLOM KIRI: PARAMETER POKOK (5 Kolom Grid) */}
                        <div className="md:col-span-5 space-y-4 md:border-r md:border-slate-200 md:pr-6">
                            {/* Area Pengawasan */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Area Pengawasan / Program</Label>
                                <Input
                                    value={editForm.areaPengawasan || ''}
                                    onChange={(e) => setEditForm({ ...editForm, areaPengawasan: e.target.value })}
                                    className="rounded-none border-slate-300 text-xs focus:border-blue-500 h-9"
                                    placeholder="Contoh: Program Pencegahan Kebakaran"
                                />
                            </div>

                            {/* Jenis Pengawasan */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Jenis Pengawasan</Label>
                                <Input
                                    value={editForm.jenisPengawasan || ''}
                                    onChange={(e) => setEditForm({ ...editForm, jenisPengawasan: e.target.value })}
                                    className="rounded-none border-slate-300 text-xs focus:border-blue-500 h-9"
                                    placeholder="Contoh: Audit Tujuan Tertentu"
                                />
                            </div>

                            {/* Pelaksana & Jadwal */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Unit Pelaksana</Label>
                                    <select
                                        value={editForm.pelaksana || 'Irban 1'}
                                        onChange={(e) => setEditForm({ ...editForm, pelaksana: e.target.value })}
                                        className="w-full h-9 border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 outline-none font-semibold text-slate-800"
                                    >
                                        {PELAKSANA_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{formatUnitKerja(opt)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Jadwal (Triwulan)</Label>
                                    <select
                                        value={editForm.jadwal || 'TW I'}
                                        onChange={(e) => setEditForm({ ...editForm, jadwal: e.target.value })}
                                        className="w-full h-9 border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 outline-none font-semibold text-blue-700"
                                    >
                                        {JADWAL_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Alokasi Hari Pemeriksaan (Clean Rows, NO NESTED BOXES) */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                    Alokasi Hari Pemeriksaan (HP)
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <Label className="text-[10px] text-slate-500">Dalnis</Label>
                                        <Input
                                            type="number"
                                            value={editHp.dalnis}
                                            onChange={(e) => setEditHp({ ...editHp, dalnis: Number(e.target.value) || 0 })}
                                            className="rounded-none border-slate-300 text-xs h-8 mt-1 font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-500">Ketua Tim</Label>
                                        <Input
                                            type="number"
                                            value={editHp.kt}
                                            onChange={(e) => setEditHp({ ...editHp, kt: Number(e.target.value) || 0 })}
                                            className="rounded-none border-slate-300 text-xs h-8 mt-1 font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-500">Anggota Tim</Label>
                                        <Input
                                            type="number"
                                            value={editHp.at}
                                            onChange={(e) => setEditHp({ ...editHp, at: Number(e.target.value) || 0 })}
                                            className="rounded-none border-slate-300 text-xs h-8 mt-1 font-mono font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-900 border-t border-slate-100">
                                    <span>Total HP Tim:</span>
                                    <span className="font-mono">{editHp.dalnis + editHp.kt + editHp.at + editHp.pj + editHp.wkpj} HP</span>
                                </div>
                            </div>

                            {/* Risiko & Jumlah Laporan */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Tingkat Risiko</Label>
                                    <select
                                        value={editForm.prioritas || 'Tinggi'}
                                        onChange={(e) => setEditForm({ ...editForm, prioritas: e.target.value as any })}
                                        className="w-full h-8 border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 outline-none font-semibold"
                                    >
                                        <option value="Tinggi">Tinggi</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="Rendah">Rendah</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-700">Target Laporan (LAP)</Label>
                                    <Input
                                        type="number"
                                        value={editForm.jumlahLaporan || 1}
                                        onChange={(e) => setEditForm({ ...editForm, jumlahLaporan: Number(e.target.value) || 1 })}
                                        className="rounded-none border-slate-300 text-xs h-8 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KOLOM KANAN: DESKRIPSI NARATIF & PILIHAN SARPRAS (7 Kolom Grid) */}
                        <div className="md:col-span-7 space-y-4">
                            {/* Tujuan dan Sasaran Pemeriksaan */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    Tujuan dan Sasaran Pemeriksaan (Poin-Poin Pokok)
                                </Label>
                                <textarea
                                    value={editForm.tujuanSasaran || ''}
                                    onChange={(e) => setEditForm({ ...editForm, tujuanSasaran: e.target.value })}
                                    rows={5}
                                    placeholder="1. Pelaksanaan kegiatan sesuai aturan&#10;2. Prosedur PBJ terpenuhi&#10;3. Kuantitas dan kualitas mutu barang/jasa teruji&#10;4. Pembayaran sesuai progres fisik pekerjaan"
                                    className="w-full border border-slate-300 rounded-none p-3 text-xs focus:border-blue-500 outline-none resize-y leading-relaxed text-slate-800 font-sans"
                                />
                            </div>

                            {/* Ruang Lingkup */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Ruang Lingkup Pemeriksaan</Label>
                                <Input
                                    value={editForm.ruangLingkup || ''}
                                    onChange={(e) => setEditForm({ ...editForm, ruangLingkup: e.target.value })}
                                    placeholder="Contoh: Belanja Barang Jasa dan Belanja Modal T.A. 2024"
                                    className="rounded-none border-slate-300 text-xs h-8 focus:border-blue-500"
                                />
                            </div>

                            {/* Kebutuhan Sarana & Prasarana (CLEAN PILLS TOGGLE, NO OVERBOXING) */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                    <span>Pilihan Sarana, Prasarana &amp; Logistik</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                        {selectedSarpras.length} item dipilih
                                    </span>
                                </Label>

                                <div className="flex flex-wrap gap-1.5">
                                    {STANDAR_SARPRAS_LIST.map((sarpras) => {
                                        const isSelected = selectedSarpras.includes(sarpras.name);
                                        const IconComp = sarpras.icon;
                                        return (
                                            <button
                                                key={sarpras.name}
                                                type="button"
                                                onClick={() => handleToggleSarpras(sarpras.name)}
                                                className={`px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <IconComp className="w-3.5 h-3.5 text-slate-500" />}
                                                {sarpras.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom Sarpras Input Row */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Input
                                        value={customSarprasInput}
                                        onChange={(e) => setCustomSarprasInput(e.target.value)}
                                        placeholder="Tambah sarpras kustom lainnya..."
                                        className="rounded-none border-slate-300 text-xs h-8 flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCustomSarpras();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddCustomSarpras}
                                        className="rounded-none border-slate-300 text-xs h-8 px-3 shadow-none shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <DialogFooter className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-none border-slate-300 text-xs shadow-none px-4 h-8"
                    >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold px-5 h-8 shadow-none"
                    >
                        <Save className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
