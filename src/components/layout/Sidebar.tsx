// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, BookOpen, ShieldAlert, FileText, ClipboardList, FileCheck, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils'; // Bawaan shadcn

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Master OPD', href: '/planning/master-opd', icon: Building2 },
    { name: 'Manajemen Auditor', href: '/planning/master-auditor', icon: Users },
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
    const role = user?.role || 'APIP_INTERNAL';

    // Filter menu based on roles in AGENTS.md
    const visibleMenuItems = MENU_ITEMS.filter((item) => {
        if (item.href === '/') return true;
        
        if (role === 'APIP_INTERNAL') {
            // Kasubag only has access to Dashboard, Master OPD, Master Auditor, Ingestion, Risk planning, and ST drafting
            return item.href === '/planning/master-opd' 
                || item.href === '/planning/master-auditor' 
                || item.href === '/planning/ingestion' 
                || item.href === '/planning/pkpt-generator' 
                || item.href === '/penugasan/draf-st';
        }
        
        if (role === 'APIP_PIMPINAN') {
            // Inspektur has access to Dashboard, PKPT, ST TTE, Pelaporan, and Compliance Score
            return item.href === '/planning/pkpt-generator' || item.href === '/penugasan/draf-st' || item.href === '/pelaporan' || item.href === '/monitoring/compliance-score';
        }

        if (role === 'AUDITOR') {
            // Auditor has access to PKA Workspace, My Assignments (ST List), Pelaporan, and Compliance Score
            return item.href === '/penugasan/pka-template' || item.href === '/penugasan/draf-st' || item.href === '/pelaporan' || item.href === '/monitoring/compliance-score';
        }
        
        return false; // Other roles only see Dashboard
    });

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col h-full shadow-xl">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                <h1 className="text-white text-xl font-bold tracking-wider">APIP Suite</h1>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Menu Utama
                </p>

                {visibleMenuItems.map((item) => {
                    const isActive = item.href === '/' 
                        ? pathname === '/' 
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    const displayName = item.href === '/penugasan/draf-st' && role === 'AUDITOR'
                        ? 'My Assignments'
                        : item.name;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                                {displayName}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <p className="text-xs text-center text-slate-500">
                    Versi 1.0.0 &copy; 2026
                </p>
            </div>
        </aside>
    );
}