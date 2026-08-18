// src/components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">Ruang Kerja</h2>
                </div>
            </header>
        );
    }

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Bisa dipakai untuk hamburger menu di versi mobile nanti */}
                <h2 className="text-lg font-semibold text-slate-800">Ruang Kerja</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-full">
                        <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="font-medium text-slate-800">{user?.email || 'User'}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Guest'}</p>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                </Button>
            </div>
        </header>
    );
}