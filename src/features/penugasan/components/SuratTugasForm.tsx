// src/features/penugasan/components/SuratTugasForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStStore } from '@/store/useStStore';
import { useStListQuery, usePegawaiQuery, useAgendaQuery } from '@/hooks/queries/useSt';
import { useCreateStMutation, useRecommendTeamMutation } from '@/hooks/mutations/useStMutation';
import { toast } from 'sonner';
import { Sparkles, Calendar, MapPin, FileText, AlertTriangle, User, Users, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Zod Schema
const stFormSchema = z.object({
    pkptAgendaId: z.string().min(1, 'Harap pilih objek audit PKPT'),
    noSt: z.string().min(5, 'Nomor Surat Tugas minimal 5 karakter'),
    tglMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
    tglSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    lokasi: z.string().min(3, 'Lokasi pemeriksaan wajib diisi'),
    pengawasTeknisId: z.string().min(1, 'Harap pilih Pengawas Teknis'),
    ketuaTimId: z.string().min(1, 'Harap pilih Ketua Tim'),
    anggotaIds: z.array(z.string()).min(1, 'Pilih minimal 1 Anggota Tim'),
});

type StFormValues = z.infer<typeof stFormSchema>;

interface SuratTugasFormProps {
    onSuccess: () => void;
}

export default function SuratTugasForm({ onSuccess }: SuratTugasFormProps) {
    const { data: stList = [] } = useStListQuery();
    const { data: auditorList = [] } = usePegawaiQuery();
    const { data: agendas = [] } = useAgendaQuery();

    const createStMutation = useCreateStMutation();
    const recommendTeamMutation = useRecommendTeamMutation();
    const checkAuditorConflict = useStStore((state) => state.checkAuditorConflict);

    const [isRecruiting, setIsRecruiting] = useState(false);

    // Filter agenda yang belum memiliki Surat Tugas
    const activeAgendas = agendas.filter(agenda => !agenda.suratTugas);

    const form = useForm<StFormValues>({
        resolver: zodResolver(stFormSchema),
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

    // Pre-fill nama audit & lokasi ketika PKPT dirubah
    useEffect(() => {
        if (selectedPkptId) {
            const agenda = activeAgendas.find(a => a.id === selectedPkptId);
            if (agenda) {
                form.setValue('lokasi', `Kantor ${agenda.opd?.namaOpd || 'OPD Target'}`);
            }
        }
    }, [selectedPkptId, activeAgendas, form]);

    // SMART CONFLICT STATUSES
    const pengawasConflict = checkAuditorConflict(pengawasTeknisId, tglMulai, tglSelesai);
    const ketuaConflict = checkAuditorConflict(ketuaTimId, tglMulai, tglSelesai);
    const conflictedAnggotaMap = (anggotaIds || []).reduce((acc, id) => {
        acc[id] = checkAuditorConflict(id, tglMulai, tglSelesai);
        return acc;
    }, {} as Record<string, boolean>);

    // AI COMPOSITION RECOMMENDATION
    const handleAiRecommendation = async () => {
        if (!selectedPkptId) {
            toast.error('Gagal', { description: 'Pilih Objek Audit PKPT terlebih dahulu agar AI memahami konteks program.' });
            return;
        }

        if (!tglMulai || !tglSelesai) {
            toast.error('Gagal', { description: 'Isi tanggal mulai dan selesai terlebih dahulu untuk mendeteksi ketersediaan jadwal.' });
            return;
        }

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        setIsRecruiting(true);
        toast.info('AI Engine Memproses...', { description: 'Memindai spesialisasi auditor & ketersediaan jadwal...' });

        try {
            const sub = agenda.substansiDokumen || {};
            const focus = sub.areaPengawasan || sub.namaAudit || agenda.jenisPengawasan || 'Audit Pengawasan';
            const pelaksana = sub.pelaksana || 'Irban 1';

            const recommendationResult = await recommendTeamMutation.mutateAsync({
                tanggalMulai: tglMulai,
                tanggalSelesai: tglSelesai,
                fokusAudit: `${focus} (${pelaksana})`,
                agendaAuditId: selectedPkptId,
                pelaksana: pelaksana,
            } as any);

            const recs = recommendationResult.recommendation;
            
            // Map rekomendasi peran tim ke formulir
            const pj = recs.find(r => r.peranDalamTim === 'Pengawas_Teknis');
            const kt = recs.find(r => r.peranDalamTim === 'Ketua_Tim');
            const ats = recs.filter(r => r.peranDalamTim === 'Anggota_Tim').map(r => r.auditorId);

            if (pj) form.setValue('pengawasTeknisId', pj.auditorId);
            if (kt) form.setValue('ketuaTimId', kt.auditorId);
            if (ats.length > 0) form.setValue('anggotaIds', ats);

            toast.success('Rekomendasi AI Diterapkan', {
                description: `Pengawas: ${pj?.nama || '-'}. Ketua: ${kt?.nama || '-'}. Anggota: ${ats.map(id => auditorList.find(a => a.id === id)?.nama).join(', ')}.`
            });
        } catch (err: any) {
            toast.error('AI Gagal merekrut', { description: err.response?.data?.message || 'Terjadi kesalahan sistem.' });
        } finally {
            setIsRecruiting(false);
        }
    };

    const onSubmit = async (values: StFormValues) => {
        // Cek kembali konflik jadwal sebelum menyimpan
        const hasPjConflict = checkAuditorConflict(values.pengawasTeknisId, values.tglMulai, values.tglSelesai);
        const hasKetuaConflict = checkAuditorConflict(values.ketuaTimId, values.tglMulai, values.tglSelesai);
        const hasAnggotaConflict = values.anggotaIds.some(id => checkAuditorConflict(id, values.tglMulai, values.tglSelesai));

        if (hasPjConflict || hasKetuaConflict || hasAnggotaConflict) {
            toast.error('Penugasan Gagal', { description: 'Surat Tugas tidak bisa dibuat karena ada anggota tim yang bentrok jadwal.' });
            return;
        }

        const agenda = activeAgendas.find(a => a.id === values.pkptAgendaId);
        if (!agenda) return;

        // Siapkan struktur tim payload
        const auditorsPayload = [
            { auditorId: values.pengawasTeknisId, peranDalamTim: 'Pengawas_Teknis' as const },
            { auditorId: values.ketuaTimId, peranDalamTim: 'Ketua_Tim' as const },
            ...values.anggotaIds.map(id => ({ auditorId: id, peranDalamTim: 'Anggota_Tim' as const }))
        ];

        try {
            await createStMutation.mutateAsync({
                agendaAuditId: values.pkptAgendaId,
                nomorSt: values.noSt,
                tanggalMulai: values.tglMulai,
                tanggalSelesai: values.tglSelesai,
                auditors: auditorsPayload,
            });

            toast.success('Draf ST Berhasil Dibuat', { description: 'Surat Tugas baru telah disimpan di database.' });
            form.reset();
            onSuccess();
        } catch (err: any) {
            toast.error('Gagal membuat Surat Tugas', { description: err.response?.data?.message || 'Terjadi kesalahan.' });
        }
    };

    return (
        <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Rancang Surat Tugas Baru
                </h3>
                {activeAgendas.length > 0 && (
                    <Button
                        type="button"
                        onClick={handleAiRecommendation}
                        disabled={isRecruiting || recommendTeamMutation.isPending}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] h-7 rounded-none shadow-none flex items-center gap-1"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isRecruiting ? 'Membentuk Tim...' : 'Minta Rekomendasi Tim'}
                    </Button>
                )}
            </div>

            {activeAgendas.length === 0 ? (
                <div className="border border-amber-200 bg-amber-50/20 p-4 text-center rounded-none space-y-1">
                    <Info className="w-6 h-6 text-amber-600 mx-auto" />
                    <h4 className="text-xs font-bold text-amber-800">PKPT Belum Disahkan atau Semua Agenda Terjadwal</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                        Penyusunan Surat Tugas hanya dapat dilakukan berdasarkan agenda PKPT yang telah **Disahkan** dan belum memiliki Surat Tugas aktif.
                    </p>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Objek Audit PKPT */}
                            <FormField
                                control={form.control}
                                name="pkptAgendaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Pilih Acuan PKPT</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-none border-slate-200 text-xs focus:border-blue-500">
                                                    <SelectValue placeholder="Pilih Objek Audit yang Sah" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-none max-h-60">
                                                {activeAgendas.map(agenda => {
                                                    const sub = agenda.substansiDokumen || {};
                                                    const pelaksana = sub.pelaksana || 'Irban 1';
                                                    const jadwal = sub.jadwal || 'TW I';
                                                    return (
                                                        <SelectItem key={agenda.id} value={agenda.id} className="text-xs py-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-slate-800">
                                                                    {sub.areaPengawasan || sub.namaAudit || agenda.jenisPengawasan}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-mono">
                                                                    {agenda.opd?.namaOpd} &bull; <strong className="text-blue-600">{pelaksana}</strong> ({jadwal})
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Nomor Surat Tugas */}
                            <FormField
                                control={form.control}
                                name="noSt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Nomor Surat Tugas</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-slate-200 text-xs focus:border-blue-500" placeholder="Contoh: ST/104/IP/2026" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Tanggal Mulai */}
                            <FormField
                                control={form.control}
                                name="tglMulai"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Tanggal Mulai Audit</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="rounded-none border-slate-200 text-xs focus:border-blue-500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Tanggal Selesai */}
                            <FormField
                                control={form.control}
                                name="tglSelesai"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Tanggal Selesai Audit</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="rounded-none border-slate-200 text-xs focus:border-blue-500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Lokasi */}
                            <FormField
                                control={form.control}
                                name="lokasi"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">Lokasi / Objek Fisik</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-slate-200 text-xs focus:border-blue-500" placeholder="Lokasi Audit" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                            {/* NEW CARD-BASED AUDITOR TEAM SELECTION */}
                            <div className="col-span-1 sm:col-span-2 space-y-4 border-t border-slate-100 pt-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Susun Tim Auditor (Socio-Selection)</Label>
                                    <p className="text-[10px] text-slate-450 mt-0.5">
                                        Klik tombol peran (**PJ** untuk Pengawas, **KT** untuk Ketua, **AT** untuk Anggota) pada kartu masing-masing auditor untuk menetapkan peran mereka dalam tim pengawasan ini.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {auditorList.map(aud => {
                                        const isPT = pengawasTeknisId === aud.id;
                                        const isKT = ketuaTimId === aud.id;
                                        const isAT = anggotaIds.includes(aud.id);
                                        const hasConflict = checkAuditorConflict(aud.id, tglMulai, tglSelesai);
                                        
                                        // Asosiasi badge keahlian audit
                                        const expertise = (aud.jabatan || '').includes('Madya') 
                                            ? ['CFrA', 'Investigasi'] 
                                            : (aud.jabatan || '').includes('Muda')
                                            ? ['Akuntan', 'CA']
                                            : ['CISA', 'Audit IT'];

                                        return (
                                            <div 
                                                key={aud.id} 
                                                className={`border p-3.5 flex flex-col justify-between space-y-3 transition-all rounded-none ${
                                                    isPT ? 'border-blue-600 bg-blue-50/10 ring-1 ring-blue-500' :
                                                    isKT ? 'border-amber-600 bg-amber-50/10 ring-1 ring-amber-500' :
                                                    isAT ? 'border-emerald-600 bg-emerald-50/10 ring-1 ring-emerald-500' :
                                                    'border-slate-200 bg-white hover:bg-slate-50'
                                                }`}
                                            >
                                                {/* Header Kartu */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2 items-center">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-650 shrink-0">
                                                            {aud.nama.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="leading-tight">
                                                            <h4 className="text-xs font-bold text-slate-800">{aud.nama}</h4>
                                                            <p className="text-[9px] text-slate-400">NIP. {aud.nip}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`w-2 h-2 rounded-full ${hasConflict ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} title={hasConflict ? 'Bentrok Jadwal' : 'Tersedia'} />
                                                </div>

                                                {/* Jabatan & Badge Kompetensi */}
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] text-slate-450 font-semibold">{aud.jabatan || 'Auditor Ahli'}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {expertise.map(exp => (
                                                            <span key={exp} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                                {exp}
                                                            </span>
                                                        ))}
                                                        {isPT && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">Pengawas (PT)</span>}
                                                        {isKT && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-600 text-white rounded">Ketua (KT)</span>}
                                                        {isAT && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded">Anggota (AT)</span>}
                                                    </div>
                                                </div>

                                                {/* Bar Tombol Peran */}
                                                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100">
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
                                                        className={`h-6 text-[9px] font-bold rounded-none p-0 ${
                                                            isPT ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-550 hover:bg-blue-50 hover:text-blue-650'
                                                        }`}
                                                    >
                                                        PJ
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
                                                        className={`h-6 text-[9px] font-bold rounded-none p-0 ${
                                                            isKT ? 'bg-amber-600 text-white hover:bg-amber-700' : 'text-slate-550 hover:bg-amber-50 hover:text-amber-650'
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
                                                        className={`h-6 text-[9px] font-bold rounded-none p-0 ${
                                                            isAT ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-550 hover:bg-emerald-50 hover:text-emerald-650'
                                                        }`}
                                                    >
                                                        AT
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="pengawasTeknisId"
                                        render={() => <FormMessage className="text-[10px]" />}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ketuaTimId"
                                        render={() => <FormMessage className="text-[10px]" />}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="anggotaIds"
                                        render={() => <FormMessage className="text-[10px]" />}
                                    />
                                </div>
                            </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <Button 
                                type="submit" 
                                disabled={createStMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none"
                            >
                                {createStMutation.isPending ? 'Menyimpan...' : 'Simpan Draf Surat Tugas'}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}
