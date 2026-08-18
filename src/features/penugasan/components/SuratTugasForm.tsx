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
    User, Users, Info, Building2, Layers, Check, ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatUnitKerja } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuditDateRangeModal from './AuditDateRangeModal';

// Zod Schema Fleksibel
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
    activeStDetails?: Array<{ nomorSt: string; peran: string; namaOpd: string }>;
}

export default function SuratTugasForm({ onSuccess }: SuratTugasFormProps) {
    const { data: agendas = [] } = useAgendaQuery();
    const createStMutation = useCreateStMutation();
    const recommendTeamMutation = useRecommendTeamMutation();

    const [auditorList, setAuditorList] = useState<AuditorWorkload[]>([]);
    const [isLoadingAuditors, setIsLoadingAuditors] = useState(false);
    const [isRecruiting, setIsRecruiting] = useState(false);
    const [isAutoGeneratingMeta, setIsAutoGeneratingMeta] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Filter agenda yang belum memiliki Surat Tugas
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

    // 1. Fetch Personil Lapangan dengan Workload Profile
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

    // 2. Auto-Populate Nomor ST, Tanggal, & Lokasi saat Agenda PKPT dipilih
    useEffect(() => {
        if (!selectedPkptId) return;

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        const opdName = agenda.opd?.namaOpd || 'OPD Target';
        form.setValue('lokasi', `Kantor ${opdName} & Objek Terkait`);

        // Generate meta otomatis dari backend
        const autoGenerateMeta = async () => {
            setIsAutoGeneratingMeta(true);
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
            } finally {
                setIsAutoGeneratingMeta(false);
            }
        };

        autoGenerateMeta();
    }, [selectedPkptId]);

    // 3. AI Smart Load-Balancing Team Recommendation
    const handleAiRecommendation = async () => {
        if (!selectedPkptId) {
            toast.error('Pilih Agenda PKPT Dahulu', { 
                description: 'Pilih objek audit PKPT agar AI memahami fokus program dan unit Irban terkait.' 
            });
            return;
        }

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        const sub = agenda.substansiDokumen || {};
        const focus = sub.areaPengawasan || sub.namaAudit || agenda.jenisPengawasan || 'Audit Pengawasan';
        const pelaksana = sub.pelaksana || 'Irban 1';

        setIsRecruiting(true);
        toast.info('AI Smart Load-Balancing Aktif', { 
            description: 'Menganalisis kompetensi & memprioritaskan personil dengan beban kerja terendah...' 
        });

        try {
            const res = await recommendTeamMutation.mutateAsync({
                tanggalMulai: tglMulai || new Date().toISOString().split('T')[0],
                tanggalSelesai: tglSelesai || new Date().toISOString().split('T')[0],
                fokusAudit: `${focus} (${pelaksana})`,
                agendaAuditId: selectedPkptId,
                pelaksana: pelaksana,
            } as any);

            const result = res as any;

            if (result.pengawasTeknis) {
                form.setValue('pengawasTeknisId', result.pengawasTeknis.id);
            }
            if (result.ketuaTim) {
                form.setValue('ketuaTimId', result.ketuaTim.id);
            }
            if (result.anggotaTim && result.anggotaTim.length > 0) {
                form.setValue('anggotaIds', result.anggotaTim.map((a: any) => a.id));
            }

            toast.success('Rekomendasi Tim Diterapkan', {
                description: `Pengawas: ${result.pengawasTeknis?.nama || '-'}. Ketua: ${result.ketuaTim?.nama || '-'}.`
            });
        } catch (err: any) {
            toast.error('Gagal Merekomendasikan Tim', { 
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.' 
            });
        } finally {
            setIsRecruiting(false);
        }
    };

    // 4. Submit Form Surat Tugas
    const onSubmit = async (values: StFormValues) => {
        const agenda = activeAgendas.find(a => a.id === values.pkptAgendaId);
        if (!agenda) return;

        const totalStaff = (values.pengawasTeknisId ? 1 : 0) + (values.ketuaTimId ? 1 : 0) + values.anggotaIds.length;
        if (totalStaff === 0) {
            toast.error('Pilih Minimal 1 Personil', { description: 'Surat Tugas harus menugaskan minimal 1 auditor/pengawas.' });
            return;
        }

        const auditorsPayload: Array<{ auditorId: string; peranDalamTim: 'Pengawas_Teknis' | 'Ketua_Tim' | 'Anggota_Tim' }> = [];
        
        if (values.pengawasTeknisId) {
            auditorsPayload.push({ auditorId: values.pengawasTeknisId, peranDalamTim: 'Pengawas_Teknis' });
        }
        if (values.ketuaTimId) {
            auditorsPayload.push({ auditorId: values.ketuaTimId, peranDalamTim: 'Ketua_Tim' });
        }
        values.anggotaIds.forEach(id => {
            auditorsPayload.push({ auditorId: id, peranDalamTim: 'Anggota_Tim' });
        });

        try {
            await createStMutation.mutateAsync({
                agendaAuditId: values.pkptAgendaId,
                nomorSt: values.noSt,
                tanggalMulai: values.tglMulai,
                tanggalSelesai: values.tglSelesai,
                auditors: auditorsPayload,
            });

            toast.success('Draf ST Berhasil Diterbitkan', { 
                description: 'Surat Tugas berstatus DRAF dan siap diajukan ke Inspektur untuk TTE.' 
            });
            form.reset();
            onSuccess();
        } catch (err: any) {
            toast.error('Gagal Membuat Surat Tugas', { 
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.' 
            });
        }
    };

    return (
        <div className="bg-white p-5 rounded-none space-y-6 border border-slate-200 shadow-xs">
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
                        Seluruh program pengawasan PKPT yang sah telah dijadwalkan, atau belum ada berkas PKPT yang diunggah ke sistem.
                    </p>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                Pilih Acuan Agenda PKPT Resmi (Sah Ber-SK)
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
                                                                    <span className={prioritas === 'Tinggi' ? 'text-red-600 font-bold' : 'text-slate-600'}>
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

                            {/* PANEL RINCIAN ACUAN PKPT TERPILIH (CLEAN DIVIDER GRID, NO NESTED BOX) */}
                            {selectedAgenda && (
                                <div className="border border-slate-200 p-4 rounded-none space-y-3 bg-white animate-in fade-in-50 duration-200">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2.5">
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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tujuan / Sasaran</p>
                                            <p className="text-slate-700 leading-relaxed line-clamp-3">
                                                {selectedAgenda.substansiDokumen?.tujuanSasaran || 'Pemeriksaan akuntabilitas dan kepatuhan program kerja.'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 md:border-l md:border-slate-100 md:pl-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruang Lingkup</p>
                                            <p className="text-slate-700 leading-relaxed">
                                                {selectedAgenda.substansiDokumen?.ruangLingkup || 'Seluruh Realisasi Belanja & Pelaksanaan Kegiatan'}
                                            </p>
                                        </div>
                                        <div className="space-y-1 md:border-l md:border-slate-100 md:pl-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alokasi &amp; Logistik</p>
                                            <p className="font-mono font-bold text-slate-900">
                                                {selectedAgenda.substansiDokumen?.hariPemeriksaan?.totalHp || 50} Hari Pemeriksaan ({selectedAgenda.substansiDokumen?.jadwal || 'TW I'})
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate">
                                                Sarpras: {(selectedAgenda.substansiDokumen?.saranaPrasarana || ['Laptop', 'Printer', 'ATK']).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BAGIAN 2: NOMOR ST, JADWAL KALENDER & LOKASI */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                            {/* Nomor Surat Tugas (4 Kolom - Auto Generated) */}
                            <div className="sm:col-span-4">
                                <FormField
                                    control={form.control}
                                    name="noSt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                                <span>Nomor Surat Tugas</span>
                                                <span className="text-[10px] text-blue-600 font-mono">Format Resmi</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    className="rounded-none border-slate-300 text-xs focus:border-blue-500 h-9 font-mono font-semibold" 
                                                    placeholder="Contoh: ST.700.1.2/015/ITDA-IRB.I/2026" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Jadwal Rentang Tanggal Audit (Kalender Interaktif Trigger - 5 Kolom) */}
                            <div className="sm:col-span-5">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                        <span>Jadwal Rentang Tanggal Audit</span>
                                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Kalender Interaktif
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

                                        <span className="text-[10px] font-bold text-blue-700 hover:underline">
                                            Pilih Kalender
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Lokasi / Objek Fisik (3 Kolom - Read Only Terkunci) */}
                            <div className="sm:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="lokasi"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                                <span>Lokasi &amp; Objek Fisik</span>
                                                <span className="text-[10px] text-slate-400">Terkunci</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        disabled
                                                        className="rounded-none border-slate-300 bg-slate-50 text-slate-700 text-xs h-9 pl-7 font-semibold" 
                                                        placeholder="Pilih PKPT terlebih dahulu" 
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

                        {/* BAGIAN 3: SUSUN TIM AUDITOR (NO INITIAL AVATAR BOX, CLEAN FLAT DESIGN) */}
                        <div className="space-y-3 border-t border-slate-100 pt-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        Susunan Tim Auditor Lapangan (Workload Profiler)
                                    </Label>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Klik tombol **PT** (Pengawas Teknis/Dalnis), **KT** (Ketua Tim), atau **AT** (Anggota Tim) untuk menunjuk personil.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Tersedia (0 ST)</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1-2 ST Aktif</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Beban Penuh (≥3 ST)</span>
                                </div>
                            </div>

                            {/* Grid Kartu Auditor (Clean Profile, NO AVATAR INITIAL BOX) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {auditorList.map(aud => {
                                    const isPT = pengawasTeknisId === aud.id;
                                    const isKT = ketuaTimId === aud.id;
                                    const isAT = anggotaIds.includes(aud.id);

                                    const isBusy = aud.workloadLevel === 'PENUH';
                                    const isModerate = aud.workloadLevel === 'SEDANG';

                                    return (
                                        <div 
                                            key={aud.id} 
                                            className={`p-3.5 flex flex-col justify-between space-y-2.5 transition-all rounded-none border ${
                                                isPT ? 'border-blue-600 bg-blue-50/20' :
                                                isKT ? 'border-amber-600 bg-amber-50/20' :
                                                isAT ? 'border-emerald-600 bg-emerald-50/20' :
                                                'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            {/* Header Profil Pegawai (NO INITIAL BOX) */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-xs font-bold text-slate-900 leading-snug" title={aud.nama}>
                                                        {aud.nama}
                                                    </h4>
                                                    <span className={`text-[10px] font-semibold shrink-0 ${
                                                        isBusy 
                                                            ? 'text-red-600' 
                                                            : isModerate 
                                                            ? 'text-amber-600' 
                                                            : 'text-emerald-600'
                                                    }`}>
                                                        {aud.activeStCount === 0 ? '0 ST Aktif' : `${aud.activeStCount} ST Aktif`}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-mono">NIP. {aud.nip}</p>
                                            </div>

                                            {/* Jabatan & Unit Irban Terformat Resmi */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-600 truncate max-w-[150px]">{aud.jabatan || 'Auditor'}</span>
                                                    <span className="text-slate-500 font-medium">
                                                        {formatUnitKerja(aud.unitKerja)}
                                                    </span>
                                                </div>

                                                {/* Role Label jika aktif */}
                                                <div className="h-4">
                                                    {isPT && <span className="text-[9px] font-bold text-blue-700 uppercase">Pengawas Teknis (Dalnis)</span>}
                                                    {isKT && <span className="text-[9px] font-bold text-amber-700 uppercase">Ketua Tim (KT)</span>}
                                                    {isAT && <span className="text-[9px] font-bold text-emerald-700 uppercase">Anggota Tim (AT)</span>}
                                                </div>
                                            </div>

                                            {/* Bar Tombol Peran (PT, KT, AT) */}
                                            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (isPT) {
                                                            form.setValue('pengawasTeknisId', '');
                                                        } else {
                                                            form.setValue('pengawasTeknisId', aud.id);
                                                            if (isKT) form.setValue('ketuaTimId', '');
                                                            if (isAT) form.setValue('anggotaIds', anggotaIds.filter(id => id !== aud.id));
                                                        }
                                                    }}
                                                    className={`h-6 text-[10px] font-bold rounded-none p-0 ${
                                                        isPT ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                    }`}
                                                >
                                                    PT
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (isKT) {
                                                            form.setValue('ketuaTimId', '');
                                                        } else {
                                                            form.setValue('ketuaTimId', aud.id);
                                                            if (isPT) form.setValue('pengawasTeknisId', '');
                                                            if (isAT) form.setValue('anggotaIds', anggotaIds.filter(id => id !== aud.id));
                                                        }
                                                    }}
                                                    className={`h-6 text-[10px] font-bold rounded-none p-0 ${
                                                        isKT ? 'bg-amber-600 text-white hover:bg-amber-700' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                    }`}
                                                >
                                                    KT
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (isAT) {
                                                            form.setValue('anggotaIds', anggotaIds.filter(id => id !== aud.id));
                                                        } else {
                                                            form.setValue('anggotaIds', [...anggotaIds, aud.id]);
                                                            if (isPT) form.setValue('pengawasTeknisId', '');
                                                            if (isKT) form.setValue('ketuaTimId', '');
                                                        }
                                                    }}
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

                            <FormField
                                control={form.control}
                                name="ketuaTimId"
                                render={() => <FormMessage className="text-[10px]" />}
                            />
                        </div>

                        {/* SUBMIT BUTTON BAR */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <p className="text-xs text-slate-500">
                                Draf Surat Tugas akan langsung diajukan ke menu verifikasi &amp; TTE Inspektur Utama.
                            </p>
                            <Button 
                                type="submit" 
                                disabled={createStMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none px-6 h-9"
                            >
                                {createStMutation.isPending ? 'Menerbitkan Draf...' : 'Terbitkan Draf Surat Tugas'}
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
