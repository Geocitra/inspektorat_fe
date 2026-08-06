// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils'; // Bawaan shadcn

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Master OPD', href: '/dashboard/opd', icon: Building2 },
    { name: 'Master Pegawai', href: '/dashboard/pegawai', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col h-full shadow-xl">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                <h1 className="text-white text-xl font-bold tracking-wider">APIP Suite</h1>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Menu Utama
                </p>

                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                                {item.name}
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