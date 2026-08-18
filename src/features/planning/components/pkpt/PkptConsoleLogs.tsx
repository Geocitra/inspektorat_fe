// src/features/planning/components/pkpt/PkptConsoleLogs.tsx
'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PkptConsoleLogsProps {
    logs: string[];
    isParsingFile: boolean;
}

export const PkptConsoleLogs: React.FC<PkptConsoleLogsProps> = ({ logs, isParsingFile }) => {
    if (logs.length === 0) return null;

    return (
        <div className="bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-emerald-400 rounded-none space-y-1 max-h-40 overflow-y-auto">
            <p className="text-slate-500 text-[10px] border-b border-slate-900 pb-1 mb-2 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${isParsingFile ? 'animate-spin' : ''}`} />
                AI Engine Terminal Console
            </p>
            {logs.map((log, idx) => (
                <p key={idx} className="leading-relaxed">
                    <span className="text-slate-600 font-bold">&gt;&gt;</span> {log}
                </p>
            ))}
            {isParsingFile && <span className="inline-block w-2 h-3 bg-emerald-400 animate-pulse"></span>}
        </div>
    );
};
