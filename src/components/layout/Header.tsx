// src/components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Menu, Shield } from 'lucide-react';
import { formatRoleName } from '@/lib/formatters';

export default function Header() {
    const { user, logout } = useAuthStore();
    const { toggleSidebar } = useUiStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
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
                        Inspektorat Daerah
                    </span>
                </div>
            </div>

            {/* SISI KANAN: USER PROFILE & LOGOUT */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <div className="w-7 h-7 bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                        <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="hidden md:block leading-tight text-left">
                        <p className="font-bold text-slate-800 text-xs">{user?.email || 'Aparatur APIP'}</p>
                        <p className="text-[11px] text-slate-500">{formatRoleName(user?.role)}</p>
                    </div>
                </div>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout} 
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none px-2.5"
                >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Keluar</span>
                </Button>
            </div>
        </header>
    );
}