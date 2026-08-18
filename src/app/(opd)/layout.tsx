// src/app/(opd)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { 
    LayoutDashboard, 
    Building2, 
    MessageSquare, 
    ShieldAlert, 
    LogOut, 
    User as UserIcon,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OpdPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !user) {
            router.push('/login');
        }
    }, [user, mounted]);

    if (!mounted || !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                Memverifikasi sesi portal...
            </div>
        );
    }

    // Pemetaan nama OPD berdasarkan email untuk kenyamanan UI/UX
    let opdName = 'Organisasi Perangkat Daerah';
    if (user.email.includes('disdik') || user.email.includes('pendidikan')) {
        opdName = 'Dinas Pendidikan';
    } else if (user.email.includes('dinkes') || user.email.includes('kesehatan')) {
        opdName = 'Dinas Kesehatan';
    } else if (user.email.includes('dishub') || user.email.includes('perhubungan')) {
        opdName = 'Dinas Perhubungan';
    }

    const navItems = [
        { name: 'Dashboard Portal', href: '/portal', icon: LayoutDashboard },
        { name: 'Dokumen Perencanaan', href: '/portal/dokumen', icon: FileText },
        { name: 'Klinik Konsultasi', href: '/portal/konsultasi', icon: MessageSquare, disabled: true },
        { name: 'Pengaduan WBS', href: '/portal/wbs', icon: ShieldAlert, disabled: true },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* Kolom Kiri: Sidebar (Konsisten dengan Sidebar Utama) */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col h-full shadow-xl">
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                    <h1 className="text-white text-xl font-bold tracking-wider">APIP Suite</h1>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-6 px-4 space-y-2">
                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Portal Auditee
                    </p>
                    
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const content = (
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all duration-200 cursor-pointer relative",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : item.disabled
                                        ? "text-slate-600 cursor-not-allowed opacity-50"
                                        : "hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                                <span>{item.name}</span>
                                {item.disabled && (
                                    <span className="absolute right-3 text-[9px] bg-slate-950 text-slate-500 px-1 py-0.5 font-bold uppercase">
                                        Segera
                                    </span>
                                )}
                            </div>
                        );

                        if (item.disabled) {
                            return <div key={item.name}>{content}</div>;
                        }

                        return (
                            <Link key={item.name} href={item.href}>
                                {content}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-slate-800 text-[10px] text-center text-slate-500">
                    Versi 1.0.0 &copy; 2026
                </div>
            </aside>

            {/* Kolom Kanan: Header + Konten Dinamis (Konsisten dengan Layout Utama) */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header (Konsisten dengan Header Utama) */}
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-slate-800">{opdName}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Profile */}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="p-2 bg-slate-100 rounded-full">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-medium text-slate-800">{user.email}</p>
                                <p className="text-xs text-slate-500 capitalize">OPD / Auditee</p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                        {/* Logout Button */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => logout()} 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar
                        </Button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
