// src/app/(opd)/layout.tsx
import React from 'react';

export default function OpdPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-105 py-8 px-4 font-sans text-slate-800">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Secure Seal */}
                <div className="text-[10px] text-slate-405 text-right font-bold uppercase tracking-wider">
                    Sistem E-Audit AI &bull; Secure Portal Daerah
                </div>
                {children}
            </div>
        </div>
    );
}
