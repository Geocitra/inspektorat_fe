// src/features/planning/components/pkpt/pkpt.constants.tsx
import React from 'react';
import { 
    Laptop, Printer, Car, FileSpreadsheet, Wrench, 
    FileText, Camera, ShieldCheck 
} from 'lucide-react';

export const PELAKSANA_OPTIONS = [
    'Irban 1',
    'Irban 2',
    'Irban 3',
    'Irban Investigasi',
    'Tim Gabungan PPUPD & Auditor',
    'Seluruh Jafung APIP',
];

export const JADWAL_OPTIONS = ['TW I', 'TW II', 'TW III', 'TW IV'];

export const STANDAR_SARPRAS_LIST = [
    { name: 'Laptop', label: 'Laptop / Komputer', icon: Laptop },
    { name: 'Printer', label: 'Printer Portabel', icon: Printer },
    { name: 'Kertas / ATK', label: 'Kertas / ATK Audit', icon: FileSpreadsheet },
    { name: 'Kendaraan Roda 4', label: 'Mobil Operasional (Roda 4)', icon: Car },
    { name: 'Kendaraan Roda 2', label: 'Motor Dinas (Roda 2)', icon: Car },
    { name: 'Alat Ukur', label: 'Alat Ukur / Meteran Fisik', icon: Wrench },
    { name: 'Kamera Dokumentasi', label: 'Kamera / Drone Pengawas', icon: Camera },
];

export const getSaranaIcon = (item: string) => {
    const lower = item.toLowerCase();
    if (lower.includes('laptop') || lower.includes('komputer')) return <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    if (lower.includes('printer')) return <Printer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    if (lower.includes('kendaraan') || lower.includes('mobil') || lower.includes('motor')) return <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    if (lower.includes('kertas') || lower.includes('atk')) return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    if (lower.includes('ukur') || lower.includes('alat') || lower.includes('meteran')) return <Wrench className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    if (lower.includes('kamera') || lower.includes('drone') || lower.includes('foto')) return <Camera className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
};
