// src/components/layout/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, Building2, Users, BookOpen, 
    ShieldAlert, FileText, ClipboardList, FileCheck, TrendingUp, X 
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Master OPD', href: '/planning/master-opd', icon: Building2 },
    { name: 'Manajemen Aparatur', href: '/planning/master-auditor', icon: Users },
    { name: 'Knowledge Base', href: '/planning/ingestion', icon: BookOpen },
    { name: 'Analisis Risiko & PKPT', href: '/planning/pkpt-generator', icon: ShieldAlert },
    { name: 'Manajemen Surat Tugas', href: '/penugasan/draf-st', icon: FileText },
    { name: 'Penyusunan PKA', href: '/penugasan/pka-template', icon: ClipboardList },
    { name: 'Pelaporan NHP & LHP', href: '/pelaporan', icon: FileCheck },
    { name: 'Skor Kepatuhan (TLHP)', href: '/monitoring/compliance-score', icon: TrendingUp },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { isSidebarOpen, setSidebarOpen } = useUiStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Otomatis tutup sidebar drawer di layar mobile saat navigasi route berubah
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [pathname, setSidebarOpen]);

    if (!mounted) {
        return (
            <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 hidden lg:flex flex-col h-full">
                <div className="h-14 flex items-center px-5 border-b border-slate-800 bg-slate-950">
                    <h1 className="text-white text-base font-bold tracking-wider">APIP Suite</h1>
                </div>
            </aside>
        );
    }

    const role = user?.role || 'APIP_INTERNAL';

    // Filter menu berdasarkan role
    const visibleMenuItems = MENU_ITEMS.filter((item) => {
        if (item.href === '/') return true;
        
        if (role === 'APIP_INTERNAL') {
            return item.href === '/planning/master-opd' 
                || item.href === '/planning/master-auditor' 
                || item.href === '/planning/ingestion' 
                || item.href === '/planning/pkpt-generator' 
                || item.href === '/penugasan/draf-st';
        }
        
        if (role === 'APIP_PIMPINAN') {
            return item.href === '/planning/pkpt-generator' || item.href === '/penugasan/draf-st' || item.href === '/pelaporan' || item.href === '/monitoring/compliance-score';
        }

        if (role === 'AUDITOR') {
            return item.href === '/penugasan/pka-template' || item.href === '/penugasan/draf-st' || item.href === '/pelaporan' || item.href === '/monitoring/compliance-score';
        }
        
        return false;
    });

    return (
        <>
            {/* BACKDROP GELAP DI MOBILE/TABLET KETIKA DRAWER TERBUKA */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
                />
            )}

            {/* ASIDE SIDEBAR */}
            <aside
                className={cn(
                    "fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none border-r border-slate-800",
                    isSidebarOpen 
                        ? "translate-x-0 lg:w-64" 
                        : "-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none"
                )}
            >
                {/* HEADER LOGO SIDEBAR */}
                <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                            A
                        </div>
                        <h1 className="text-white text-sm font-bold tracking-wider uppercase">
                            APIP Suite
                        </h1>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden h-7 w-7 p-0 text-slate-400 hover:text-white rounded-none"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* MENU DAFTAR */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Menu Utama
                    </p>

                    {visibleMenuItems.map((item) => {
                        const isActive = item.href === '/' 
                            ? pathname === '/' 
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                        const displayName = item.href === '/penugasan/draf-st' && role === 'AUDITOR'
                            ? 'Penugasan Saya'
                            : item.name;

                        return (
                            <Link key={item.name} href={item.href}>
                                <div
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-none text-xs font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white font-bold"
                                            : "hover:bg-slate-800/80 hover:text-white text-slate-300"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                                    <span className="truncate">{displayName}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* FOOTER VERSI */}
                <div className="p-3 border-t border-slate-800 shrink-0 text-center">
                    <p className="text-[10px] text-slate-500 font-mono">
                        Inspektorat Daerah &copy; 2026
                    </p>
                </div>
            </aside>
        </>
    );
}