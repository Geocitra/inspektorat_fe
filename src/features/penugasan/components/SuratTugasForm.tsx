// src/features/penugasan/components/SuratTugasForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStStore } from '@/store/useStStore';
import { useAuditorStore } from '@/store/useAuditorStore';
import { usePkptStore } from '@/store/usePkptStore';
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
    ketuaTimId: z.string().min(1, 'Harap pilih Ketua Tim'),
    anggotaIds: z.array(z.string()).min(1, 'Pilih minimal 1 Anggota Tim'),
});

type StFormValues = z.infer<typeof stFormSchema>;

interface SuratTugasFormProps {
    onSuccess: () => void;
}

export default function SuratTugasForm({ onSuccess }: SuratTugasFormProps) {
    const { addSt, checkAuditorConflict } = useStStore();
    const { auditorList } = useAuditorStore();
    const { draftAgendas, status: pkptStatus } = usePkptStore();
    const [isRecruiting, setIsRecruiting] = useState(false);

    // Dapatkan daftar PKPT yang sudah disahkan (PUBLISHED)
    const activeAgendas = pkptStatus === 'PUBLISHED' ? draftAgendas : [];

    const form = useForm<StFormValues>({
        resolver: zodResolver(stFormSchema),
        defaultValues: {
            pkptAgendaId: '',
            noSt: '',
            tglMulai: '',
            tglSelesai: '',
            lokasi: '',
            ketuaTimId: '',
            anggotaIds: [],
        }
    });

    const selectedPkptId = useWatch({ control: form.control, name: 'pkptAgendaId' });
    const tglMulai = useWatch({ control: form.control, name: 'tglMulai' });
    const tglSelesai = useWatch({ control: form.control, name: 'tglSelesai' });
    const ketuaTimId = useWatch({ control: form.control, name: 'ketuaTimId' });
    const anggotaIds = useWatch({ control: form.control, name: 'anggotaIds' }) || [];

    // Pre-fill nama audit & lokasi ketika PKPT dirubah
    useEffect(() => {
        if (selectedPkptId) {
            const agenda = activeAgendas.find(a => a.id === selectedPkptId);
            if (agenda) {
                form.setValue('lokasi', `Kantor ${agenda.namaOpd}`);
            }
        }
    }, [selectedPkptId, activeAgendas, form]);

    // SMART CONFLICT STATUSES
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

        const agenda = activeAgendas.find(a => a.id === selectedPkptId);
        if (!agenda) return;

        setIsRecruiting(true);
        toast.info('AI Engine Memproses...', { description: 'Memindai spesialisasi auditor & ketersediaan jadwal...' });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const programName = agenda.namaAudit.toLowerCase();
        
        // Cari auditor yang tidak memiliki konflik jadwal di tanggal tersebut (jika tanggal diisi)
        const availableAuditors = auditorList.filter(aud => {
            const hasConflict = checkAuditorConflict(aud.id, tglMulai, tglSelesai);
            return !hasConflict;
        });

        const pool = availableAuditors.length > 0 ? availableAuditors : auditorList;

        let recommendedKetuaId = '';
        let recommendedAnggotaId = '';

        // Aturan Pencocokan Keahlian AI
        if (programName.includes('it') || programName.includes('sistem') || programName.includes('teknologi')) {
            // Butuh spesialis IT / CISA
            const matchKetua = pool.find(aud => aud.kompetensi.some(c => c.toLowerCase().includes('it') || c.toLowerCase().includes('cisa')));
            recommendedKetuaId = matchKetua?.id || pool[0]?.id;
        } else if (programName.includes('spj') || programName.includes('anggaran') || programName.includes('keuangan')) {
            // Butuh akuntan / CFrA / Keuangan
            const matchKetua = pool.find(aud => aud.kompetensi.some(c => c.toLowerCase().includes('keuangan') || c.toLowerCase().includes('cfra') || c.toLowerCase().includes('akuntansi')));
            recommendedKetuaId = matchKetua?.id || pool[0]?.id;
        } else {
            // Sertifikasi PBJ atau investigasi
            const matchKetua = pool.find(aud => aud.kompetensi.some(c => c.toLowerCase().includes('pbj') || c.toLowerCase().includes('investigatif')));
            recommendedKetuaId = matchKetua?.id || pool[0]?.id;
        }

        // Cari anggota tim (tidak sama dengan ketua)
        const candidateAnggota = pool.filter(aud => aud.id !== recommendedKetuaId);
        recommendedAnggotaId = candidateAnggota[0]?.id || '';

        if (recommendedKetuaId && recommendedAnggotaId) {
            form.setValue('ketuaTimId', recommendedKetuaId);
            form.setValue('anggotaIds', [recommendedAnggotaId]);
            toast.success('Rekomendasi AI Diterapkan', {
                description: `Ketua Tim: ${auditorList.find(a => a.id === recommendedKetuaId)?.nama}. Anggota: ${auditorList.find(a => a.id === recommendedAnggotaId)?.nama}.`
            });
        } else {
            toast.warning('Rekomendasi Terbatas', { description: 'Tidak ada kecocokan auditor fungsional yang tersedia.' });
        }

        setIsRecruiting(false);
    };

    const onSubmit = (values: StFormValues) => {
        // Cek kembali konflik jadwal sebelum menyimpan
        const hasKetuaConflict = checkAuditorConflict(values.ketuaTimId, values.tglMulai, values.tglSelesai);
        const hasAnggotaConflict = values.anggotaIds.some(id => checkAuditorConflict(id, values.tglMulai, values.tglSelesai));

        if (hasKetuaConflict || hasAnggotaConflict) {
            toast.error('Penugasan Gagal', { description: 'Surat Tugas tidak bisa dibuat karena ada anggota tim yang bentrok jadwal.' });
            return;
        }

        const agenda = activeAgendas.find(a => a.id === values.pkptAgendaId);
        if (!agenda) return;

        addSt({
            noSt: values.noSt,
            pkptAgendaId: values.pkptAgendaId,
            namaAudit: agenda.namaAudit,
            namaOpd: agenda.namaOpd,
            tglMulai: values.tglMulai,
            tglSelesai: values.tglSelesai,
            lokasi: values.lokasi,
            ketuaTimId: values.ketuaTimId,
            anggotaIds: values.anggotaIds,
        });

        toast.success('Draf ST Berhasil Dibuat', { description: 'Surat Tugas baru telah ditambahkan ke daftar antrean.' });
        form.reset();
        onSuccess();
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
                        disabled={isRecruiting}
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
                    <h4 className="text-xs font-bold text-amber-800">PKPT Belum Disahkan</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                        Penyusunan Surat Tugas hanya dapat dilakukan berdasarkan draf PKPT yang telah **Disahkan & TTE** oleh Inspektur Utama. Silakan sahkan PKPT terlebih dahulu.
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-none border-slate-200 text-xs focus:border-blue-500">
                                                    <SelectValue placeholder="Pilih Objek Audit yang Sah" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-none">
                                                {activeAgendas.map(agenda => (
                                                    <SelectItem key={agenda.id} value={agenda.id} className="text-xs">
                                                        {agenda.namaAudit} ({agenda.namaOpd})
                                                    </SelectItem>
                                                ))}
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

                        {/* TIM PEMERIKSA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                            
                            {/* KETUA TIM SELECT */}
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="ketuaTimId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold text-slate-700">Ketua Tim Audit</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={`rounded-none text-xs focus:border-blue-500 ${ketuaConflict ? 'border-red-500' : 'border-slate-200'}`}>
                                                        <SelectValue placeholder="Pilih Ketua Tim" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-none">
                                                    {auditorList.map(aud => (
                                                        <SelectItem key={aud.id} value={aud.id} className="text-xs">
                                                            {aud.nama}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                {ketuaConflict && (
                                    <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold bg-red-50 p-2 border border-red-200">
                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Ketua Tim memiliki bentrok jadwal di tanggal tersebut!</span>
                                    </div>
                                )}
                            </div>

                            {/* ANGGOTA TIM MULTI CHECKBOX */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-700">Anggota Tim Audit (Pilih Minimal 1)</Label>
                                <div className="border border-slate-200 p-3 bg-slate-50/50 max-h-40 overflow-y-auto space-y-2.5 rounded-none">
                                    {auditorList
                                        .filter(aud => aud.id !== ketuaTimId) // Ketua tidak bisa jadi anggota
                                        .map(aud => {
                                            const isChecked = anggotaIds.includes(aud.id);
                                            const hasConflict = conflictedAnggotaMap[aud.id];

                                            return (
                                                <div key={aud.id} className="flex items-start gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        id={`anggota-${aud.id}`}
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                form.setValue('anggotaIds', [...anggotaIds, aud.id]);
                                                            } else {
                                                                form.setValue('anggotaIds', anggotaIds.filter(id => id !== aud.id));
                                                            }
                                                        }}
                                                        className="w-3.5 h-3.5 border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                                                    />
                                                    <div className="leading-none space-y-1">
                                                        <label 
                                                            htmlFor={`anggota-${aud.id}`} 
                                                            className={`text-xs font-semibold cursor-pointer ${hasConflict ? 'text-red-600' : 'text-slate-800'}`}
                                                        >
                                                            {aud.nama}
                                                        </label>
                                                        <p className="text-[10px] text-slate-400">NIP. {aud.nip}</p>
                                                        {isChecked && hasConflict && (
                                                            <span className="inline-block text-[9px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 border border-red-200 mt-1">
                                                                Bentrok Jadwal!
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                <FormField
                                    control={form.control}
                                    name="anggotaIds"
                                    render={() => (
                                        <FormItem>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <Button 
                                type="submit" 
                                className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none"
                            >
                                Simpan Draf Surat Tugas
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}
