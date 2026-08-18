// src/features/planning/components/OpdDetail.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    ArrowLeft, MapPin, Building2, Calendar, Shield, AlertCircle, FileText,
    CheckCircle, Clock, Upload, Brain, Trash2, FileSpreadsheet, Loader2, X,
    Edit3, Save, RefreshCw, Map as MapIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useKnowledgeStore } from '@/store/useKnowledgeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentType, KnowledgeDoc } from '@/types/knowledge.type';

// Dynamic import OpdLocationPickerModal agar bebas dari kendala SSR Leaflet
const OpdLocationPickerModal = dynamic(
    () => import('./opd/OpdLocationPickerModal'),
    { ssr: false }
);

interface OpdDetailProps {
    opdId: string;
}

interface OpdData {
    id: string;
    namaOpd: string;
    alamat: string;
    gpsKoordinat: string;
    createdAt: string;
    documents?: any[];
    agendaAudits?: any[];
    temuan?: any[];
}

const DOC_CATEGORIES: { label: string; type: DocumentType; description: string }[] = [
    { label: 'Renstra', type: 'RENSTRA', description: 'Rencana Strategis OPD (5 Tahun)' },
    { label: 'RKA / DPA', type: 'RKA_PERENCANAAN', description: 'Rencana Kerja Anggaran / Dokumen Pelaksanaan' },
    { label: 'Dokumen PBJ', type: 'DOKUMEN_PBJ', description: 'Kontrak, Kuitansi, SPJ Pengadaan Barang/Jasa' },
];

export default function OpdDetail({ opdId }: OpdDetailProps) {
    const [opd, setOpd] = useState<OpdData | null>(null);
    const [isLoadingOpd, setIsLoadingOpd] = useState(true);

    // Mode Edit Profil In-Place
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editNamaOpd, setEditNamaOpd] = useState('');
    const [editAlamat, setEditAlamat] = useState('');
    const [editGps, setEditGps] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<'profil' | 'dokumen' | 'riwayat'>('profil');
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('RENSTRA');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { docList, isProcessing, currentDoc, isLoadingDocs, fetchDocuments, uploadDocument, deleteDocument } = useKnowledgeStore();

    // Fetch data OPD langsung dari backend database
    const fetchOpdDetail = async () => {
        setIsLoadingOpd(true);
        try {
            const res = await api.get(`/opd/${opdId}`);
            const data = res.data.data || res.data;
            setOpd(data);
            setEditNamaOpd(data.namaOpd || '');
            setEditAlamat(data.alamat || '');
            setEditGps(data.gpsKoordinat || '');
        } catch (err: any) {
            toast.error('Gagal Memuat Detail OPD', {
                description: err.response?.data?.message || 'Data OPD tidak ditemukan.'
            });
        } finally {
            setIsLoadingOpd(false);
        }
    };

    useEffect(() => {
        if (opdId) {
            fetchOpdDetail();
            fetchDocuments(opdId);
        }
    }, [opdId]);

    // Simpan perubahan profil OPD (PUT /api/v1/opd/:id)
    const handleSaveProfile = async () => {
        if (!editNamaOpd.trim() || !editAlamat.trim() || !editGps.trim()) {
            toast.error('Semua kolom profil wajib diisi');
            return;
        }

        setIsSavingProfile(true);
        try {
            await api.put(`/opd/${opdId}`, {
                namaOpd: editNamaOpd,
                alamat: editAlamat,
                gpsKoordinat: editGps,
            });
            toast.success('Profil OPD Berhasil Diperbarui');
            setIsEditingProfile(false);
            fetchOpdDetail();
        } catch (err: any) {
            toast.error('Gagal Menyimpan Profil', {
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Upload berkas dokumen RKA/Renstra/PBJ
    const handleFileUpload = async (file: File) => {
        if (!file) return;
        try {
            await uploadDocument(file, selectedDocType, file.name.replace(/\.[^/.]+$/, ''), opdId);
            toast.success('Dokumen Berhasil Diunggah', {
                description: 'Berkas berhasil dikirim ke AI Ingestion Engine untuk ekstraksi otomatis.'
            });
            fetchDocuments(opdId);
        } catch (err) {
            toast.error('Gagal Mengunggah Dokumen');
        }
    };

    const opdDocuments = docList.filter(doc => doc.opdId === opdId);

    if (isLoadingOpd) {
        return (
            <div className="p-16 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Memuat data profil perangkat daerah...
            </div>
        );
    }

    if (!opd) {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 border border-slate-200 bg-white rounded-none">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h2 className="text-sm font-bold text-slate-800">OPD Tidak Ditemukan</h2>
                <p className="text-slate-500 text-xs mt-1 mb-5">
                    Data perangkat daerah tidak terdaftar di database atau telah dihapus.
                </p>
                <Link href="/planning/master-opd">
                    <Button className="rounded-none bg-slate-800 hover:bg-slate-900 text-xs w-full shadow-none">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali ke Master OPD
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            {/* TOP NAVIGATION BAR */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <Link href="/planning/master-opd" className="inline-flex items-center text-xs text-slate-500 hover:text-blue-600 font-semibold gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali ke Master OPD
                </Link>

                <div className="flex items-center gap-2">
                    {!isEditingProfile ? (
                        <Button
                            onClick={() => setIsEditingProfile(true)}
                            variant="outline"
                            className="h-8 rounded-none border-slate-200 text-xs text-slate-700 hover:bg-slate-50 shadow-none flex items-center gap-1.5"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            Edit Profil Instansi
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Button
                                onClick={() => setIsEditingProfile(false)}
                                variant="outline"
                                className="h-8 rounded-none border-slate-200 text-xs shadow-none"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Batal
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="h-8 rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-none"
                            >
                                <Save className={`w-3.5 h-3.5 mr-1 ${isSavingProfile ? 'animate-spin' : ''}`} />
                                Simpan Perubahan
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* HEADER PROFIL OPD */}
            <div className="bg-white border border-slate-200 p-4 rounded-none space-y-3">
                {!isEditingProfile ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-snug flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                {opd.namaOpd}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">{opd.alamat}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 border border-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{opd.gpsKoordinat}</span>
                        </div>
                    </div>
                ) : (
                    /* FORM EDIT IN-PLACE */
                    <div className="space-y-3 p-3 bg-blue-50/30 border border-blue-200">
                        <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            Mode Edit Profil Instansi (Tersimpan ke Database)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-5 space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Nama Resmi OPD</Label>
                                <Input
                                    value={editNamaOpd}
                                    onChange={(e) => setEditNamaOpd(e.target.value)}
                                    className="rounded-none border-slate-300 text-xs h-8 bg-white focus:border-blue-500 font-bold"
                                />
                            </div>
                            <div className="sm:col-span-7 space-y-1">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-semibold text-slate-700">Koordinat GPS (Lat, Long)</Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsMapPickerOpen(true)}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                                    >
                                        <MapIcon className="w-3 h-3" />
                                        Pilih di Peta
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={editGps}
                                        onChange={(e) => setEditGps(e.target.value)}
                                        className="rounded-none border-slate-300 text-xs h-8 bg-white font-mono focus:border-blue-500 flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMapPickerOpen(true)}
                                        className="rounded-none border-blue-600 text-blue-700 hover:bg-blue-50 text-xs h-8 px-2.5 font-semibold shrink-0"
                                    >
                                        <MapPin className="w-3 h-3 mr-1" />
                                        Peta
                                    </Button>
                                </div>
                            </div>
                            <div className="sm:col-span-12 space-y-1">
                                <Label className="text-xs font-semibold text-slate-700">Alamat Domisili Kantor</Label>
                                <Input
                                    value={editAlamat}
                                    onChange={(e) => setEditAlamat(e.target.value)}
                                    className="rounded-none border-slate-300 text-xs h-8 bg-white focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB NAVIGASI MODULAR */}
                <div className="flex border-b border-slate-200 gap-1 pt-2">
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                            activeTab === 'profil'
                                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Profil &amp; Rincian
                    </button>
                    <button
                        onClick={() => setActiveTab('dokumen')}
                        className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                            activeTab === 'dokumen'
                                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Dokumen Perencanaan ({opdDocuments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('riwayat')}
                        className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                            activeTab === 'riwayat'
                                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Riwayat Audit ({opd.agendaAudits?.length || 0})
                    </button>
                </div>
            </div>

            {/* KONTEN TAB 1: PROFIL & PARAMETER */}
            {activeTab === 'profil' && (
                <div className="border border-slate-200 bg-white p-4 rounded-none space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">ID Internal Sistem</p>
                            <p className="font-mono text-slate-700">{opd.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Berkas AI</p>
                            <p className="font-bold text-blue-700">{opdDocuments.length} Dokumen Aktif</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Registrasi</p>
                            <p className="font-mono text-slate-700">{new Date(opd.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KONTEN TAB 2: DOKUMEN PERENCANAAN */}
            {activeTab === 'dokumen' && (
                <div className="border border-slate-200 bg-white p-4 rounded-none space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Berkas RKA, Renstra &amp; PBJ Instansi
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Berkas yang diunggah akan otomatis diproses oleh AI Ingestion Engine untuk ekstraksi risiko.
                            </p>
                        </div>

                        {/* Pilihan Kategori Upload */}
                        <div className="flex items-center gap-1">
                            {DOC_CATEGORIES.map(cat => (
                                <button
                                    key={cat.type}
                                    onClick={() => setSelectedDocType(cat.type)}
                                    className={`px-2.5 py-1 text-[11px] font-semibold border ${
                                        selectedDocType === cat.type
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Area Upload Drag & Drop */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                            dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.xlsx,.xls,.docx"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                            }}
                        />
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">
                            Klik atau Tarik Berkas {DOC_CATEGORIES.find(c => c.type === selectedDocType)?.label} ke Sini
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Format PDF, Excel, Word (Maks. 25MB)</p>
                    </div>

                    {/* Tabel Daftar Berkas */}
                    <div className="border border-slate-200">
                        {opdDocuments.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Belum ada berkas dokumen yang diunggah untuk perangkat daerah ini.
                            </div>
                        ) : (
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-bold text-slate-700">Nama Dokumen</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700 w-32">Kategori</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700 w-28 text-center">Status AI</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700 w-20 text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opdDocuments.map(doc => (
                                        <TableRow key={doc.id} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <span className="text-xs font-semibold text-slate-800">{doc.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-xs text-slate-600">
                                                {doc.type}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-center">
                                                <span className={`text-[10px] font-bold ${
                                                    doc.status === 'AKTIF' || doc.status === 'Success' ? 'text-emerald-700' : 'text-amber-700'
                                                }`}>
                                                    {doc.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
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
            )}

            {/* KONTEN TAB 3: RIWAYAT AUDIT */}
            {activeTab === 'riwayat' && (
                <div className="border border-slate-200 bg-white p-4 rounded-none space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                        Histori Agenda Pengawasan &amp; Temuan Audit
                    </h3>
                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-100">
                        {opd.agendaAudits && opd.agendaAudits.length > 0 ? (
                            <span>Terdapat {opd.agendaAudits.length} agenda pengawasan aktif terkait OPD ini.</span>
                        ) : (
                            <span>Belum ada riwayat pengawasan masa lalu untuk perangkat daerah ini.</span>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL GEOTAGGING PETA GOOGLE / LEAFLET (CENTER PIN TRACKER) */}
            {isMapPickerOpen && (
                <OpdLocationPickerModal
                    isOpen={isMapPickerOpen}
                    onClose={() => setIsMapPickerOpen(false)}
                    initialCoordinates={editGps || opd.gpsKoordinat}
                    initialAddress={editAlamat || opd.alamat}
                    onSelectLocation={(coords, address) => {
                        setEditGps(coords);
                        if (address && (!editAlamat || editAlamat.length < 10)) {
                            setEditAlamat(address);
                        }
                    }}
                />
            )}
        </div>
    );
}
