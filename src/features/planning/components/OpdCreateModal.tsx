// src/features/planning/components/OpdCreateModal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Building2, Save, X, MapPin, Map as MapIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const OpdLocationPickerModal = dynamic(
    () => import('./opd/OpdLocationPickerModal'),
    { ssr: false }
);

const GPS_REGEX = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

const createOpdSchema = z.object({
    namaOpd: z.string().min(3, 'Nama OPD minimal 3 karakter'),
    alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
    gpsKoordinat: z.string().regex(
        GPS_REGEX,
        'Format koordinat GPS tidak valid. Contoh: -6.2088,106.8456'
    ),
});

type CreateOpdValues = z.infer<typeof createOpdSchema>;

interface OpdCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OpdCreateModal({ isOpen, onClose, onSuccess }: OpdCreateModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

    const form = useForm<CreateOpdValues>({
        resolver: zodResolver(createOpdSchema),
        defaultValues: {
            namaOpd: '',
            alamat: '',
            gpsKoordinat: '-7.250445,112.768845',
        }
    });

    const onSubmit = async (values: CreateOpdValues) => {
        setIsSubmitting(true);
        try {
            await api.post('/opd', values);
            toast.success('OPD Berhasil Ditambahkan', {
                description: `Perangkat daerah "${values.namaOpd}" telah terdaftar di database.`
            });
            form.reset();
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error('Gagal Mendaftarkan OPD', {
                description: err.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[540px] rounded-none p-0 overflow-hidden border-slate-300 shadow-2xl flex flex-col my-auto">
                    <DialogHeader className="bg-slate-900 text-white p-4 shrink-0">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            Registrasi Perangkat Daerah Baru (OPD)
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs mt-0.5">
                            Tambahkan instansi dinas/badan/kecamatan sebagai objek auditi pengawasan APIP.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs text-slate-700">
                            {/* Nama OPD */}
                            <FormField
                                control={form.control}
                                name="namaOpd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">
                                            Nama Resmi Perangkat Daerah
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="rounded-none border-slate-300 text-xs h-9 focus:border-blue-500 font-semibold text-slate-900" 
                                                placeholder="Contoh: Dinas Kesehatan" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Alamat Kantor */}
                            <FormField
                                control={form.control}
                                name="alamat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700">
                                            Alamat Kantor Domisili
                                        </FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="rounded-none border-slate-300 text-xs h-9 focus:border-blue-500" 
                                                placeholder="Contoh: Jl. Genteng Kali No. 33, Surabaya" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Koordinat GPS dengan Tombol Geotagging Peta */}
                            <FormField
                                control={form.control}
                                name="gpsKoordinat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                            <span>Titik Koordinat GPS (Latitude, Longitude)</span>
                                            <span className="text-[10px] text-blue-600 font-mono">Peta Geospasial</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input 
                                                        className="rounded-none border-slate-300 text-xs h-9 font-mono pl-7 focus:border-blue-500" 
                                                        placeholder="-7.250445,112.768845" 
                                                        {...field} 
                                                    />
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsMapPickerOpen(true)}
                                                    className="rounded-none border-blue-600 text-blue-700 hover:bg-blue-50 text-xs h-9 px-3 font-semibold flex items-center gap-1.5 shrink-0"
                                                >
                                                    <MapIcon className="w-3.5 h-3.5" />
                                                    Pilih di Peta
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />

                            {/* Footer Modal */}
                            <DialogFooter className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="rounded-none border-slate-300 text-xs shadow-none px-4 h-8"
                                >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold px-5 h-8 shadow-none"
                                >
                                    <Save className={`w-3.5 h-3.5 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                                    {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan OPD'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* MODAL GEOTAGGING PETA GOOGLE / LEAFLET (CENTER PIN TRACKER) */}
            <OpdLocationPickerModal
                isOpen={isMapPickerOpen}
                onClose={() => setIsMapPickerOpen(false)}
                initialCoordinates={form.getValues('gpsKoordinat')}
                initialAddress={form.getValues('alamat')}
                onSelectLocation={(coords, address) => {
                    form.setValue('gpsKoordinat', coords);
                    if (address && (!form.getValues('alamat') || form.getValues('alamat').length < 10)) {
                        form.setValue('alamat', address);
                    }
                }}
            />
        </>
    );
}
