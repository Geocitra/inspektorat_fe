// src/features/penugasan/components/SuratTugasForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAgendaQuery } from '@/hooks/queries/useSt';
import { useCreateStMutation, useRecommendTeamMutation } from '@/hooks/mutations/useStMutation';
import { toast } from 'sonner';
import { 
    Sparkles, Calendar, MapPin, FileText, 
    User, Users, Info, Building2, Layers, Check, ChevronDown, 
    Star, X, Search
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatUnitKerja } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuditDateRangeModal from './AuditDateRangeModal';

const stFormSchema = z.object({
    pkptAgendaId: z.string().min(1, 'Harap pilih objek audit PKPT'),
    noSt: z.string().min(3, 'Nomor Surat Tugas minimal 3 karakter'),
    tglMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
    tglSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    lokasi: z.string().min(3, 'Lokasi pemeriksaan wajib diisi'),
    pengawasTeknisId: z.string().optional(),
    ketuaTimId: z.string().optional(),
    anggotaIds: z.array(z.string()).default([]),
});

type StFormValues = z.infer<typeof stFormSchema>;

interface SuratTugasFormProps {
    onSuccess: () => void;
}

interface AuditorWorkload {
    id: string;
    nip: string;
    nama: string;
    golongan?: string;
    jabatan?: string;
    unitKerja?: string;
    activeStCount: number;
    workloadLevel: 'LONGGAR' | 'SEDANG' | 'PENUH';
}

const TAB_FILTERS = [
    { key: 'ALL', label: 'Semua Personil' },
    { key: 'SELECTED', label: 'Tim Terpilih' },
    { key: 'IRBAN_1', label: 'Irban 1' },
    { key: 'IRBAN_2', label: 'Irban 2' },
    { key: 'IRBAN_3', label: 'Irban 3' },
    { key: 'IRBAN_INVESTIGASI', label: 'Investigasi' },
];

export default function SuratTugasForm({ onSuccess }: SuratTugasFormProps) {
    const { data: agendas = [] } = useAgendaQuery();
    const createStMutation = useCreateStMutation();
    const recommendTeamMutation = useRecommendTeamMutation();

    const [auditorList, setAuditorList] = useState<AuditorWorkload[]>([]);
    const [isLoadingAuditors, setIsLoadingAuditors] = useState(false);
    const [isRecruiting, setIsRecruiting] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Tab filter & Search untuk memilih auditor
    const [auditorTab, setAuditorTab] = useState<string>('ALL');
    const [auditorSearch, setAuditorSearch] = useState('');

    const activeAgendas = agendas.filter(agenda => !agenda.suratTugas);

    const form = useForm<StFormValues>({
        resolver: zodResolver(stFormSchema) as any,
        defaultValues: {
            pkptAgendaId: '',
            noSt: '',
            tglMulai: '',
            tglSelesai: '',
            lokasi: '',
            pengawasTeknisId: '',
            ketuaTimId: '',
            anggotaIds: [],
        }
    });

    const selectedPkptId = useWatch({ control: form.control, name: 'pkptAgendaId' });
    const tglMulai = useWatch({ control: form.control, name: 'tglMulai' });
    const tglSelesai = useWatch({ control: form.control, name: 'tglSelesai' });
    const pengawasTeknisId = useWatch({ control: form.control, name: 'pengawasTeknisId' });
    const ketuaTimId = useWatch({ control: form.control, name: 'ketuaTimId' });
    const anggotaIds = useWatch({ control: form.control, name: 'anggotaIds' }) || [];

    const selectedAgenda = activeAgendas.find(a => a.id === selectedPkptId);

    // Fetch Personil Lapangan dengan Workload Profile
    const fetchAuditorWorkloads = async () => {
        setIsLoadingAuditors(true);
        try {
            const res = await api.get('/surat-tugas/auditors/workload');
            setAuditorList(res.data || []);
        } catch (err) {
            console.error('Failed fetching auditor workloads:', err);
        } finally {
            setIsLoadingAuditors(false);
        }
    };

    useEffect(() => {
        fetchAuditorWorkloads();
    }, []);

    // Auto-Populate Nomor ST & Lokasi
    useEffect(() => {
        if (!selectedPkptId) return;

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        const opdName = agenda.opd?.namaOpd || 'OPD Target';
        form.setValue('lokasi', `Kantor ${opdName} & Objek Terkait`);

        const autoGenerateMeta = async () => {
            try {
                const res = await api.get('/surat-tugas/meta/generate', {
                    params: { agendaId: selectedPkptId }
                });
                if (res.data) {
                    form.setValue('noSt', res.data.suggestedNomorSt || '');
                    form.setValue('tglMulai', res.data.suggestedStartDate || '');
                    form.setValue('tglSelesai', res.data.suggestedEndDate || '');
                }
            } catch (err) {
                const currentYear = new Date().getFullYear();
                form.setValue('noSt', `ST.700.1.2/001/ITDA-IRB.I/${currentYear}`);
            }
        };

        autoGenerateMeta();
    }, [selectedPkptId]);

    // AI Smart Team Recommendation
    const handleAiRecommendation = async () => {
        if (!selectedPkptId) {
            toast.error('Pilih Agenda PKPT Dahulu');
            return;
        }

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        const sub = agenda.substansiDokumen || {};
        const focus = sub.areaPengawasan || sub.namaAudit || agenda.jenisPengawasan || 'Audit Pengawasan';
        const pelaksana = sub.pelaksana || 'Irban 1';

        setIsRecruiting(true);
        toast.info('AI Smart Load-Balancing Aktif...');

        try {
            const res = await recommendTeamMutation.mutateAsync({
                tanggalMulai: tglMulai || new Date().toISOString().split('T')[0],
                tanggalSelesai: tglSelesai || new Date().toISOString().split('T')[0],
                fokusAudit: `${focus} (${pelaksana})`,
                agendaAuditId: selectedPkptId,
                pelaksana: pelaksana,
            } as any);

            const result = res as any;
            if (result.pengawasTeknis) form.setValue('pengawasTeknisId', result.pengawasTeknis.id);
            if (result.ketuaTim) form.setValue('ketuaTimId', result.ketuaTim.id);
            if (result.anggotaTim && result.anggotaTim.length > 0) {
                form.setValue('anggotaIds', result.anggotaTim.map((a: any) => a.id));
            }

            toast.success('Rekomendasi Tim Diterapkan');
            setAuditorTab('SELECTED');
        } catch (err: any) {
            toast.error('Gagal Merekomendasikan Tim');
        } finally {
            setIsRecruiting(false);
        }
    };

    // Submit ST
    const onSubmit = async (values: StFormValues) => {
        const totalStaff = (values.pengawasTeknisId ? 1 : 0) + (values.ketuaTimId ? 1 : 0) + values.anggotaIds.length;
        if (totalStaff === 0) {
            toast.error('Pilih Minimal 1 Personil');
            return;
        }

        const auditorsPayload: Array<{ auditorId: string; peranDalamTim: 'Pengawas_Teknis' | 'Ketua_Tim' | 'Anggota_Tim' }> = [];
        if (values.pengawasTeknisId) auditorsPayload.push({ auditorId: values.pengawasTeknisId, peranDalamTim: 'Pengawas_Teknis' });
        if (values.ketuaTimId) auditorsPayload.push({ auditorId: values.ketuaTimId, peranDalamTim: 'Ketua_Tim' });
        values.anggotaIds.forEach(id => auditorsPayload.push({ auditorId: id, peranDalamTim: 'Anggota_Tim' }));

        try {
            await createStMutation.mutateAsync({
                agendaAuditId: values.pkptAgendaId,
                nomorSt: values.noSt,
                tanggalMulai: values.tglMulai,
                tanggalSelesai: values.tglSelesai,
                auditors: auditorsPayload,
            });

            toast.success('Draf ST Berhasil Diterbitkan');
            form.reset();
            onSuccess();
        } catch (err: any) {
            toast.error('Gagal Membuat Surat Tugas', { description: err.response?.data?.message });
        }
    };

    // Helper Filter Personil
    const isSelectedAuditor = (id: string) => 
        pengawasTeknisId === id || ketuaTimId === id || anggotaIds.includes(id);

    const totalSelectedCount = (pengawasTeknisId ? 1 : 0) + (ketuaTimId ? 1 : 0) + anggotaIds.length;

    const filteredAuditors = auditorList.filter(aud => {
        const matchesSearch = aud.nama.toLowerCase().includes(auditorSearch.toLowerCase()) || aud.nip.includes(auditorSearch);
        if (!matchesSearch) return false;

        if (auditorTab === 'SELECTED') return isSelectedAuditor(aud.id);
        if (auditorTab === 'ALL') return true;
        return aud.unitKerja === auditorTab;
    });

    const ptObj = auditorList.find(a => a.id === pengawasTeknisId);
    const ktObj = auditorList.find(a => a.id === ketuaTimId);
    const atObjs = auditorList.filter(a => anggotaIds.includes(a.id));

    // Handle Toggle Peran
    const handleTogglePT = (audId: string) => {
        if (pengawasTeknisId === audId) {
            form.setValue('pengawasTeknisId', '');
        } else {
            form.setValue('pengawasTeknisId', audId);
            if (ketuaTimId === audId) form.setValue('ketuaTimId', '');
            if (anggotaIds.includes(audId)) form.setValue('anggotaIds', anggotaIds.filter(id => id !== audId));
        }
    };

    const handleToggleKT = (audId: string) => {
        if (ketuaTimId === audId) {
            form.setValue('ketuaTimId', '');
        } else {
            form.setValue('ketuaTimId', audId);
            if (pengawasTeknisId === audId) form.setValue('pengawasTeknisId', '');
            if (anggotaIds.includes(audId)) form.setValue('anggotaIds', anggotaIds.filter(id => id !== audId));
        }
    };

    const handleToggleAT = (audId: string) => {
        if (anggotaIds.includes(audId)) {
            form.setValue('anggotaIds', anggotaIds.filter(id => id !== audId));
        } else {
            form.setValue('anggotaIds', [...anggotaIds, audId]);
            if (pengawasTeknisId === audId) form.setValue('pengawasTeknisId', '');
            if (ketuaTimId === audId) form.setValue('ketuaTimId', '');
        }
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-none space-y-5 border border-slate-200 shadow-xs">
            {/* HEADER TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Penerbitan Surat Tugas Pengawasan Baru
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Integrasi data PKPT resmi daerah ke Surat Tugas operasional berbasis Workload Capacity.
                    </p>
                </div>

                {activeAgendas.length > 0 && (
                    <Button
                        type="button"
                        onClick={handleAiRecommendation}
                        disabled={isRecruiting || recommendTeamMutation.isPending}
                        variant="outline"
                        className="border-slate-200 text-blue-700 hover:bg-blue-50 text-xs h-8 rounded-none shadow-none flex items-center gap-1.5 font-semibold px-3"
                    >
                        <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isRecruiting ? 'animate-spin' : ''}`} />
                        {isRecruiting ? 'Menganalisis Tim...' : 'Rekomendasikan Tim AI'}
                    </Button>
                )}
            </div>

            {activeAgendas.length === 0 ? (
                <div className="border border-amber-200 bg-amber-50/20 p-6 text-center rounded-none space-y-1.5">
                    <Info className="w-6 h-6 text-amber-600 mx-auto" />
                    <h4 className="text-xs font-bold text-amber-900">Semua Agenda PKPT Telah Memiliki Surat Tugas</h4>
                    <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                        Seluruh program pengawasan PKPT yang sah telah dijadwalkan.
                    </p>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {/* BAGIAN 1: DROPDOWN ACUAN PKPT LEBAR */}
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="pkptAgendaId"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-blue-600" />
                                                Pilih Acuan Agenda PKPT Resmi
                                            </span>
                                            <span className="text-[11px] font-normal text-blue-600 font-mono">
                                                {activeAgendas.length} agenda siap ditugaskan
                                            </span>
                                        </FormLabel>

                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full rounded-none border-slate-300 text-xs focus:border-blue-600 h-10 bg-white px-3 shadow-none">
                                                    <SelectValue placeholder="-- Klik untuk Memilih Objek Program Pengawasan PKPT --" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent className="rounded-none max-h-[360px] w-[var(--radix-select-trigger-width)] min-w-[340px] border-slate-200 shadow-xl p-1">
                                                {activeAgendas.map(agenda => {
                                                    const sub = agenda.substansiDokumen || {};
                                                    const pelaksana = formatUnitKerja(sub.pelaksana || 'IRBAN_1');
                                                    const jadwal = sub.jadwal || 'TW I';
                                                    const totalHp = sub.hariPemeriksaan?.totalHp || 50;
                                                    const prioritas = sub.tingkatRisiko || 'Tinggi';

                                                    return (
                                                        <SelectItem 
                                                            key={agenda.id} 
                                                            value={agenda.id} 
                                                            className="text-xs py-2.5 px-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer focus:bg-blue-50"
                                                        >
                                                            <div className="flex flex-col gap-1 w-full text-left">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <span className="font-bold text-slate-900 text-xs leading-snug">
                                                                        {sub.areaPengawasan || sub.namaAudit || agenda.jenisPengawasan}
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-slate-600 shrink-0 font-mono">
                                                                        {agenda.opd?.namaOpd}
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                                                    <span className="font-semibold text-blue-700">{pelaksana}</span>
                                                                    <span>&bull;</span>
                                                                    <span>Jadwal: {jadwal}</span>
                                                                    <span>&bull;</span>
                                                                    <span>Alokasi: {totalHp} HP</span>
                                                                    <span>&bull;</span>
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                                                                        prioritas === 'Tinggi'
                                                                            ? 'text-red-700 bg-red-50 border-red-200'
                                                                            : prioritas === 'Sedang'
                                                                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                                    }`}>
                                                                        Risiko {prioritas}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* PANEL RINCIAN ACUAN PKPT TERPILIH */}
                            {selectedAgenda && (
                                <div className="border border-slate-200 p-3.5 rounded-none space-y-2 bg-white">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-blue-700">
                                                {formatUnitKerja(selectedAgenda.substansiDokumen?.pelaksana)}
                                            </span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-xs font-bold text-slate-900">
                                                {selectedAgenda.substansiDokumen?.areaPengawasan || selectedAgenda.jenisPengawasan}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-600">
                                            OPD: <strong className="text-slate-900">{selectedAgenda.opd?.namaOpd}</strong>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tujuan / Sasaran</p>
                                            <p className="text-slate-700 leading-relaxed line-clamp-2 mt-0.5">
                                                {selectedAgenda.substansiDokumen?.tujuanSasaran || 'Pemeriksaan akuntabilitas.'}
                                            </p>
                                        </div>
                                        <div className="sm:border-l sm:border-slate-100 sm:pl-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ruang Lingkup</p>
                                            <p className="text-slate-700 leading-relaxed mt-0.5">
                                                {selectedAgenda.substansiDokumen?.ruangLingkup || 'Seluruh Belanja Kegiatan'}
                                            </p>
                                        </div>
                                        <div className="sm:border-l sm:border-slate-100 sm:pl-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Alokasi HP &amp; Sarpras</p>
                                            <p className="font-mono font-bold text-slate-900 mt-0.5">
                                                {selectedAgenda.substansiDokumen?.hariPemeriksaan?.totalHp || 50} HP ({selectedAgenda.substansiDokumen?.jadwal || 'TW I'})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BAGIAN 2: NOMOR ST, JADWAL & LOKASI */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-4">
                                <FormField
                                    control={form.control}
                                    name="noSt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-700">Nomor Surat Tugas</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    className="rounded-none border-slate-300 text-xs focus:border-blue-500 h-9 font-mono font-semibold" 
                                                    placeholder="ST.700.1.2/015/..." 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="sm:col-span-5">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                        <span>Jadwal Rentang Tanggal Audit</span>
                                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Kalender
                                        </span>
                                    </Label>
                                    <div 
                                        onClick={() => setIsCalendarModalOpen(true)}
                                        className="mt-1.5 border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer p-2 h-9 flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <div className="text-xs font-mono font-semibold text-slate-800">
                                                {tglMulai && tglSelesai ? (
                                                    <span>{tglMulai} <span className="text-slate-400 font-normal">s.d.</span> {tglSelesai}</span>
                                                ) : (
                                                    <span className="text-slate-400 font-sans font-normal">Pilih jadwal di kalender...</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-700">Pilih</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="lokasi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-700">Lokasi / Objek Fisik</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        disabled
                                                        className="rounded-none border-slate-300 bg-slate-50 text-slate-700 text-xs h-9 pl-7 font-semibold" 
                                                        placeholder="Pilih PKPT dahulu" 
                                                        {...field} 
                                                    />
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* BAGIAN 3: SUSUN TIM AUDITOR LAPANGAN */}
                        <div className="space-y-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        Susunan Tim Auditor Lapangan (Workload Capacity)
                                    </Label>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Tunjuk personil dengan tombol <strong>PT</strong> (Pengawas), <strong>KT</strong> (Ketua), atau <strong>AT</strong> (Anggota).
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 0 ST</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1-2 ST</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &ge;3 ST</span>
                                </div>
                            </div>

                            {/* STICKY SELECTED TEAM ROSTER TRAY */}
                            {totalSelectedCount > 0 && (
                                <div className="bg-blue-50/70 border border-blue-200 p-2.5 space-y-1.5 animate-in fade-in-50 duration-150">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-blue-900 flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5 text-blue-700" />
                                            Susunan Tim Terpilih ({totalSelectedCount} Personil):
                                        </span>
                                        <span className="text-[10px] text-blue-700 font-mono">Siap Diterbitkan</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {ptObj && (
                                            <span className="bg-white border border-blue-300 px-2 py-0.5 text-slate-800 flex items-center gap-1 text-[11px]">
                                                <strong className="text-blue-700">PT:</strong> {ptObj.nama}
                                                <button type="button" onClick={() => form.setValue('pengawasTeknisId', '')} className="text-slate-400 hover:text-red-600 ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {ktObj && (
                                            <span className="bg-white border border-amber-300 px-2 py-0.5 text-slate-800 flex items-center gap-1 text-[11px]">
                                                <strong className="text-amber-700">KT:</strong> {ktObj.nama}
                                                <button type="button" onClick={() => form.setValue('ketuaTimId', '')} className="text-slate-400 hover:text-red-600 ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {atObjs.map(at => (
                                            <span key={at.id} className="bg-white border border-emerald-300 px-2 py-0.5 text-slate-800 flex items-center gap-1 text-[11px]">
                                                <strong className="text-emerald-700">AT:</strong> {at.nama}
                                                <button type="button" onClick={() => form.setValue('anggotaIds', anggotaIds.filter(id => id !== at.id))} className="text-slate-400 hover:text-red-600 ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB FILTER IRBAN + TAB "TIM TERPILIH" + SEARCH BAR */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-1.5">
                                    <div className="flex overflow-x-auto gap-1 w-full sm:w-auto">
                                        {TAB_FILTERS.map(tab => {
                                            const isActive = auditorTab === tab.key;
                                            const count = tab.key === 'ALL' 
                                                ? auditorList.length 
                                                : tab.key === 'SELECTED' 
                                                ? totalSelectedCount 
                                                : auditorList.filter(a => a.unitKerja === tab.key).length;

                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setAuditorTab(tab.key)}
                                                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
                                                        isActive
                                                            ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
                                                            : 'border-transparent text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {tab.label}
                                                    <span className={`text-[10px] font-mono ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                                                        ({count})
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Quick Search Personil */}
                                    <div className="w-full sm:w-48 relative">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                                        <input
                                            type="text"
                                            value={auditorSearch}
                                            onChange={(e) => setAuditorSearch(e.target.value)}
                                            placeholder="Cari personil..."
                                            className="w-full h-8 pl-7 pr-2 text-xs border border-slate-200 outline-none bg-white placeholder-slate-400 text-slate-700"
                                        />
                                    </div>
                                </div>

                                {filteredAuditors.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 bg-white">
                                        {auditorTab === 'SELECTED' 
                                            ? 'Belum ada personil yang dipilih ke dalam tim.' 
                                            : 'Tidak ada personil yang cocok dengan filter / pencarian.'}
                                    </div>
                                ) : (
                                    <>
                                        {/* 1. TAMPILAN DESKTOP & LAPTOP (CARD GRID 3-KOLOM LAPANG) */}
                                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filteredAuditors.map(aud => {
                                                const isPT = pengawasTeknisId === aud.id;
                                                const isKT = ketuaTimId === aud.id;
                                                const isAT = anggotaIds.includes(aud.id);
                                                const isBusy = aud.workloadLevel === 'PENUH';
                                                const isModerate = aud.workloadLevel === 'SEDANG';

                                                return (
                                                    <div 
                                                        key={aud.id} 
                                                        className={`p-3 flex flex-col justify-between space-y-2 transition-all rounded-none border ${
                                                            isPT ? 'border-blue-600 bg-blue-50/30' :
                                                            isKT ? 'border-amber-600 bg-amber-50/30' :
                                                            isAT ? 'border-emerald-600 bg-emerald-50/30' :
                                                            'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {/* Header Profil */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between items-start gap-1.5">
                                                                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1" title={aud.nama}>
                                                                    {aud.nama}
                                                                </h4>
                                                                <span className={`text-[10px] font-semibold shrink-0 ${
                                                                    isBusy ? 'text-red-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                                                                }`}>
                                                                    {aud.activeStCount} ST Aktif
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-mono">NIP. {aud.nip}</p>
                                                        </div>

                                                        {/* Jabatan & Unit Irban */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="text-slate-600 truncate max-w-[140px]">{aud.jabatan || 'Auditor'}</span>
                                                                <span className="text-slate-500 font-medium text-[10px]">
                                                                    {formatUnitKerja(aud.unitKerja)}
                                                                </span>
                                                            </div>

                                                            {/* Label Penugasan Aktif */}
                                                            <div className="h-4">
                                                                {isPT && <span className="text-[9px] font-bold text-blue-700 uppercase">Pengawas Teknis (PT)</span>}
                                                                {isKT && <span className="text-[9px] font-bold text-amber-700 uppercase">Ketua Tim (KT)</span>}
                                                                {isAT && <span className="text-[9px] font-bold text-emerald-700 uppercase">Anggota Tim (AT)</span>}
                                                            </div>
                                                        </div>

                                                        {/* Bar Tombol Peran Tim */}
                                                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => handleTogglePT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none p-0 ${
                                                                    isPT ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                PT
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => handleToggleKT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none p-0 ${
                                                                    isKT ? 'bg-amber-600 text-white hover:bg-amber-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                KT
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => handleToggleAT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none p-0 ${
                                                                    isAT ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                AT
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* 2. TAMPILAN MOBILE & SMALL TABLET (COMPACT SCROLLABLE ROW LIST) */}
                                        <div className="block md:hidden max-h-[300px] overflow-y-auto border border-slate-200 divide-y divide-slate-100 bg-white">
                                            {filteredAuditors.map(aud => {
                                                const isPT = pengawasTeknisId === aud.id;
                                                const isKT = ketuaTimId === aud.id;
                                                const isAT = anggotaIds.includes(aud.id);
                                                const isBusy = aud.workloadLevel === 'PENUH';
                                                const isModerate = aud.workloadLevel === 'SEDANG';

                                                return (
                                                    <div 
                                                        key={aud.id} 
                                                        className={`p-2 flex items-center justify-between gap-2 transition-colors ${
                                                            isPT ? 'bg-blue-50/40' :
                                                            isKT ? 'bg-amber-50/40' :
                                                            isAT ? 'bg-emerald-50/40' :
                                                            'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {/* Profil Singkat */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-900 text-xs truncate">{aud.nama}</span>
                                                                <span className={`text-[9px] font-semibold shrink-0 ${
                                                                    isBusy ? 'text-red-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                                                                }`}>
                                                                    &bull; {aud.activeStCount} ST
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 truncate">
                                                                {formatUnitKerja(aud.unitKerja)} &bull; {aud.jabatan || 'Auditor'}
                                                            </p>
                                                        </div>

                                                        {/* Tombol Peran */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleTogglePT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none px-2 ${
                                                                    isPT ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                PT
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleKT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none px-2 ${
                                                                    isKT ? 'bg-amber-600 text-white hover:bg-amber-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                KT
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleAT(aud.id)}
                                                                className={`h-6 text-[10px] font-bold rounded-none px-2 ${
                                                                    isAT ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                                }`}
                                                            >
                                                                AT
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* SUBMIT BUTTON BAR */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <p className="text-xs text-slate-500">
                                Draf Surat Tugas akan diajukan ke menu verifikasi &amp; TTE Inspektur.
                            </p>
                            <Button 
                                type="submit" 
                                disabled={createStMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none px-6 h-9 w-full sm:w-auto"
                            >
                                {createStMutation.isPending ? 'Menerbitkan...' : 'Terbitkan Draf Surat Tugas'}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}

            {/* MODAL POP-UP KALENDER INTERAKTIF */}
            <AuditDateRangeModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                startDate={tglMulai}
                endDate={tglSelesai}
                defaultDurationHp={selectedAgenda?.substansiDokumen?.hariPemeriksaan?.totalHp || 15}
                onApply={(start, end) => {
                    form.setValue('tglMulai', start);
                    form.setValue('tglSelesai', end);
                }}
            />
        </div>
    );
}
