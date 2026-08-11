// src/features/penugasan/components/PkaWorkspace.tsx
'use client';

import { useState } from 'react';
import { useStStore } from '@/store/useStStore';
import { useAuditorStore } from '@/store/useAuditorStore';
import { 
    Sparkles, RefreshCw, FileText, Plus, Trash2, Edit2, Info, Check, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PkaWorkspace() {
    const { stList, pkaList, addPkaProsedur, updatePkaProsedur, deletePkaProsedur, generatePkaAi, isGeneratingPka } = useStStore();
    const { auditorList } = useAuditorStore();
    const [selectedStId, setSelectedStId] = useState('');
    
    // Form Tambah Prosedur Lokal
    const [newProsedurText, setNewProsedurText] = useState('');
    const [newMetode, setNewMetode] = useState<'Cek dokumen' | 'Wawancara' | 'Cek Fisik' | 'Lainnya'>('Cek dokumen');

    // Dapatkan daftar ST yang telah disahkan (PUBLISHED)
    const publishedStList = stList.filter(st => st.status === 'PUBLISHED');

    // Dapatkan detail ST yang dipilih
    const selectedSt = publishedStList.find(st => st.id === selectedStId);

    // Filter PKA prosedur yang terkait dengan ST terpilih
    const currentPkas = pkaList.filter(pka => pka.stId === selectedStId);

    const getAuditorName = (id: string) => {
        return auditorList.find(a => a.id === id)?.nama || 'Unknown Auditor';
    };

    const handleAddProsedurSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProsedurText.trim()) {
            toast.error('Gagal', { description: 'Langkah kerja tidak boleh kosong.' });
            return;
        }

        addPkaProsedur(selectedStId, newProsedurText, newMetode);
        toast.success('Prosedur Ditambahkan', { description: 'Langkah kerja berhasil ditambahkan ke rencana.' });
        setNewProsedurText('');
    };

    const handleGeneratePkaAi = async () => {
        if (!selectedSt) return;
        await generatePkaAi(selectedSt.id, selectedSt.namaAudit);
    };

    return (
        <div className="space-y-6">
            {/* HEADER WORKSPACE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Penyusunan Program Kerja Audit (PKA)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Rumuskan langkah kerja, teknik pengujian, dan metode pemeriksaan berdasarkan data acuan regulasi.
                    </p>
                </div>
            </div>

            {/* SELECTION ST BAR */}
            <div className="border border-slate-200 bg-white p-4 rounded-none space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1 w-full sm:max-w-md">
                        <Label className="text-xs font-semibold text-slate-700">Pilih Surat Tugas Aktif</Label>
                        <Select onValueChange={(val) => setSelectedStId(val || '')} value={selectedStId}>
                            <SelectTrigger className="rounded-none border-slate-200 text-xs focus:border-blue-500">
                                <SelectValue placeholder="Pilih Surat Tugas yang Sah" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                {publishedStList.map(st => (
                                    <SelectItem key={st.id} value={st.id} className="text-xs">
                                        {st.noSt} &bull; {st.namaAudit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSt && (
                        <Button
                            onClick={handleGeneratePkaAi}
                            disabled={isGeneratingPka}
                            className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none font-bold shadow-none self-end"
                        >
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            {isGeneratingPka ? 'AI Menyusun Prosedur...' : 'Generate Langkah Kerja via AI'}
                        </Button>
                    )}
                </div>

                {/* MOCKUP SUMMARY ST */}
                {selectedSt && (
                    <div className="border border-slate-100 p-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Objek Pemeriksaan</p>
                            <p className="font-bold text-slate-800 mt-0.5">{selectedSt.namaOpd}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Program Audit</p>
                            <p className="font-bold text-slate-800 mt-0.5 truncate" title={selectedSt.namaAudit}>{selectedSt.namaAudit}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Rentang Tanggal</p>
                            <p className="font-mono text-slate-750 font-semibold mt-0.5">{selectedSt.tglMulai} s/d {selectedSt.tglSelesai}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tim Pemeriksa</p>
                            <p className="font-bold text-slate-800 mt-0.5">K: {getAuditorName(selectedSt.ketuaTimId)}</p>
                            <p className="text-[10px] text-slate-500 truncate">A: {selectedSt.anggotaIds.map(id => getAuditorName(id)).join(', ')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* PKA EDIT WORKSPACE */}
            {!selectedSt ? (
                <div className="border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center">
                    <Info className="w-10 h-10 text-slate-300 mb-2" />
                    <h4 className="text-xs font-bold text-slate-700">PKA Workspace Belum Terbuka</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm leading-relaxed">
                        Silakan pilih Surat Tugas aktif di atas untuk memulai penyusunan langkah-langkah audit (PKA).
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* EDITABLE PROCEDURES TABLE */}
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prosedur Kerja ({currentPkas.length} Prosedur)</h3>
                        </div>

                        <div className="border border-slate-200 bg-white rounded-none">
                            {currentPkas.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs italic">
                                    Belum ada prosedur kerja yang dirumuskan. Gunakan pemicu AI di atas atau tambah prosedur secara manual.
                                </div>
                            ) : (
                                <Table className="border-collapse">
                                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                                            <TableHead className="font-bold text-slate-700 text-xs">Langkah Prosedur (Dapat Diedit)</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs w-[150px]">Metode</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 text-xs w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentPkas.map((pka) => (
                                            <TableRow key={pka.id} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                                <TableCell className="p-2">
                                                    <Input
                                                        value={pka.prosedur}
                                                        onChange={(e) => updatePkaProsedur(pka.id, { prosedur: e.target.value })}
                                                        className="rounded-none border-0 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Select 
                                                        onValueChange={(val) => updatePkaProsedur(pka.id, { metode: val as any })} 
                                                        value={pka.metode}
                                                    >
                                                        <SelectTrigger className="rounded-none border-0 text-xs hover:bg-slate-50 focus:bg-white h-8 focus:ring-1 focus:ring-blue-500">
                                                            <SelectValue placeholder="Metode" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-none">
                                                            <SelectItem value="Cek dokumen" className="text-xs">Cek dokumen</SelectItem>
                                                            <SelectItem value="Wawancara" className="text-xs">Wawancara</SelectItem>
                                                            <SelectItem value="Cek fisik" className="text-xs">Cek fisik</SelectItem>
                                                            <SelectItem value="Lainnya" className="text-xs">Lainnya</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right p-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deletePkaProsedur(pka.id)}
                                                        className="h-8 w-8 rounded-none hover:bg-red-50 hover:text-red-700 text-slate-400"
                                                        title="Hapus Prosedur"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* MANUAL ADD PROCEDURE PANEL */}
                    <div className="md:col-span-1 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <Plus className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Prosedur Manual</h3>
                        </div>

                        <form onSubmit={handleAddProsedurSubmit} className="border border-slate-200 bg-white p-4 rounded-none space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="prosedur" className="text-xs font-semibold text-slate-700">Langkah Kerja</Label>
                                <textarea
                                    id="prosedur"
                                    value={newProsedurText}
                                    onChange={(e) => setNewProsedurText(e.target.value)}
                                    placeholder="Tuliskan tindakan pengujian secara detail..."
                                    className="w-full h-24 border border-slate-200 rounded-none p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-slate-400"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Metode Pengujian</Label>
                                <Select onValueChange={(val) => setNewMetode(val as any)} value={newMetode}>
                                    <SelectTrigger className="rounded-none border-slate-200 text-xs focus:border-blue-500">
                                        <SelectValue placeholder="Metode" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        <SelectItem value="Cek dokumen" className="text-xs">Cek dokumen</SelectItem>
                                        <SelectItem value="Wawancara" className="text-xs">Wawancara</SelectItem>
                                        <SelectItem value="Cek Fisik" className="text-xs">Cek Fisik</SelectItem>
                                        <SelectItem value="Lainnya" className="text-xs">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-900 rounded-none text-xs font-bold shadow-none"
                            >
                                Tambah ke Program Kerja
                            </Button>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
}
