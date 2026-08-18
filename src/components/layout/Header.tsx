// src/components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { Button } from '@/components/ui/button';
import { 
    LogOut, User as UserIcon, Menu, Shield, 
    Users, Building2, ChevronDown, Check, Sparkles
} from 'lucide-react';
import { formatRoleName } from '@/lib/formatters';
import { toast } from 'sonner';

const PRESET_ROLES = [
    {
        id: 'KASUBAG',
        title: 'Kasubag Perencanaan',
        subtitle: 'Penyusun Draf ST & PKPT',
        email: 'kasubag.perencanaan@inspektorat.go.id',
        role: 'APIP_INTERNAL' as const,
        pegawaiId: 'aa111111-1111-1111-1111-111111111111',
        icon: Users,
        color: 'text-blue-600',
    },
    {
        id: 'INSPEKTUR',
        title: 'Inspektur Utama',
        subtitle: 'Pengesahan & TTE BSrE',
        email: 'inspektur.utama@inspektorat.go.id',
        role: 'APIP_PIMPINAN' as const,
        pegawaiId: 'bb222222-2222-2222-2222-222222222222',
        icon: Shield,
        color: 'text-emerald-600',
    },
    {
        id: 'AUDITOR',
        title: 'Ketua Tim Auditor',
        subtitle: 'Pelaksana Lapangan (Budi S.)',
        email: 'auditor.budi@inspektorat.go.id',
        role: 'AUDITOR' as const,
        pegawaiId: 'b8f8e224-bf30-462b-a417-b60a95ecc603',
        icon: Users,
        color: 'text-purple-600',
    },
    {
        id: 'OPD',
        title: 'Auditi Perangkat Daerah',
        subtitle: 'Dinas Pendidikan Surabaya',
        email: 'dinas.pendidikan@surabaya.go.id',
        role: 'AUDITEE_OPD' as const,
        opdId: '22222222-2222-2222-2222-222222222222',
        icon: Building2,
        color: 'text-amber-600',
    },
];

export default function Header() {
    const { user, setAuth, logout } = useAuthStore();
    const { toggleSidebar } = useUiStore();
    const [mounted, setMounted] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSwitchRole = (preset: typeof PRESET_ROLES[0]) => {
        const updatedUser = {
            id: preset.id === 'INSPEKTUR' 
                ? '66666666-6666-6666-6666-666666666666' 
                : preset.id === 'AUDITOR' 
                ? '77777777-7777-7777-7777-777777777777' 
                : preset.id === 'OPD' 
                ? '88888888-8888-8888-8888-888888888888' 
                : '55555555-5555-5555-5555-555555555555',
            email: preset.email,
            role: preset.role,
            pegawaiId: preset.pegawaiId,
            opdId: preset.opdId,
        };

        setAuth(updatedUser as any, 'mock-jwt-token-abcdef123456');
        setIsRoleDropdownOpen(false);
        toast.success(`Beralih Peran: ${preset.title}`, {
            description: `Workspace aktif disesuaikan sebagai ${preset.title}.`,
        });

        // Trigger reload halus agar modul tersinkron
        setTimeout(() => {
            window.location.reload();
        }, 300);
    };

    if (!mounted) {
        return (
            <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 animate-pulse" />
                    <h2 className="text-sm font-bold text-slate-800">Ruang Kerja Pengawasan</h2>
                </div>
            </header>
        );
    }

    return (
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 relative">
            {/* SISI KIRI: HAMBURGER BUTTON & TITLE */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-none"
                    title="Buka/Tutup Navigasi Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                        Ruang Kerja
                    </h2>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Inspektorat Daerah Kota Surabaya
                    </span>
                </div>
            </div>

            {/* SISI KANAN: ROLE SWITCHER DROPDOWN & LOGOUT */}
            <div className="flex items-center gap-3">
                {/* ROLE SWITCHER INTERAKTIF */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 transition-colors cursor-pointer"
                        title="Klik untuk beralih peran testing"
                    >
                        <div className="w-6 h-6 bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                            <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="hidden md:block leading-tight text-left">
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                                {user?.email || 'kasubag.perencanaan@inspektorat.go.id'}
                            </p>
                            <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                                <span>{formatRoleName(user?.role)}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </p>
                        </div>
                    </button>

                    {/* POPUP DROPDOWN ROLE SWITCHER */}
                    {isRoleDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 shadow-2xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Ganti Akun Pengujian
                                    </p>
                                    <p className="text-xs text-slate-300 font-medium mt-0.5">Pilih peran kedinasan aktif:</p>
                                </div>
                            </div>

                            <div className="p-1.5 space-y-1">
                                {PRESET_ROLES.map((preset) => {
                                    const IconComp = preset.icon;
                                    const isCurrent = user?.email === preset.email || (user?.role === preset.role && !user?.email);

                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleSwitchRole(preset)}
                                            className={`w-full text-left p-2 flex items-center justify-between gap-2 transition-colors text-xs ${
                                                isCurrent 
                                                    ? 'bg-blue-50/80 border-l-2 border-blue-600' 
                                                    : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`p-1.5 bg-slate-100 ${preset.color}`}>
                                                    <IconComp className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 leading-snug">{preset.title}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{preset.subtitle}</p>
                                                </div>
                                            </div>
                                            {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout} 
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none px-2.5"
                    title="Keluar dari sesi"
                >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Keluar</span>
                </Button>
            </div>
        </header>
    );
}