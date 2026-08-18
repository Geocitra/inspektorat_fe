// src/features/planning/components/AiGenerator.tsx
'use client';

import React, { useState } from 'react';
import { usePkptStore, AuditAgenda } from '@/store/usePkptStore';
import { RefreshCw, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { PkptConsoleLogs } from './pkpt/PkptConsoleLogs';
import { PkptTable } from './pkpt/PkptTable';
import { PkptDetailModal } from './pkpt/PkptDetailModal';
import { PkptEditRowModal } from './pkpt/PkptEditRowModal';

interface AiGeneratorProps {
    isKasubag: boolean;
    onSubmitSuccess: () => void;
}

export default function AiGenerator({ isKasubag }: AiGeneratorProps) {
    const { 
        draftAgendas, isParsingFile, logs,
        parsePkptFromFile, updateAgenda
    } = usePkptStore();

    // Modal States
    const [selectedAgenda, setSelectedAgenda] = useState<AuditAgenda | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [editingAgenda, setEditingAgenda] = useState<AuditAgenda | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleViewDetail = (agenda: AuditAgenda) => {
        setSelectedAgenda(agenda);
        setIsDetailOpen(true);
    };

    const handleEditRow = (agenda: AuditAgenda) => {
        setEditingAgenda(agenda);
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                {/* Header Upload Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Draf Program Kerja Pengawasan Tahunan (PKPT)</h3>
                        <p className="text-slate-400 text-[11px] mt-0.5">Struktur 14 kolom resmi pengawasan berbasis risiko.</p>
                    </div>
                    
                    {isKasubag ? (
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.pdf,.docx,.doc"
                                    className="hidden"
                                    id="pkpt-upload-input"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            await parsePkptFromFile(e.target.files[0], 2026);
                                        }
                                    }}
                                    disabled={isParsingFile}
                                />
                                <Button
                                    onClick={() => document.getElementById('pkpt-upload-input')?.click()}
                                    disabled={isParsingFile}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none shadow-none gap-1.5"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isParsingFile ? 'animate-spin' : ''}`} />
                                    {isParsingFile ? 'Mengekstraksi PKPT...' : 'Unggah & Ekstrak Berkas PKPT'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Hanya Kasubag Perencanaan yang dapat mengunggah berkas PKPT</span>
                    )}
                </div>

                {/* AI Console Logs */}
                <PkptConsoleLogs logs={logs} isParsingFile={isParsingFile} />

                {/* Tabel Agenda 14 Kolom */}
                {draftAgendas.length > 0 ? (
                    <div className="space-y-4">
                        <PkptTable
                            agendas={draftAgendas}
                            onViewDetail={handleViewDetail}
                            onEditRow={handleEditRow}
                        />

                        {/* Footer Link to ST */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500">
                                Total <strong className="text-slate-800">{draftAgendas.length} agenda pengawasan</strong> telah terindeks &amp; berstatus sah (siap ditugaskan).
                            </p>
                            <a href="/penugasan/draf-st">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-xs rounded-none font-bold shadow-none">
                                    <Send className="w-3.5 h-3.5 mr-1.5" />
                                    Lanjut ke Pembuatan Surat Tugas
                                </Button>
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Belum Ada Draf PKPT Terdaftar</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                            Silakan unggah dokumen PKPT (Excel / PDF) milik daerah untuk mengekstrak seluruh agenda pengawasan secara otomatis.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal View Detail 14 Kolom (max-w-5xl) */}
            <PkptDetailModal
                agenda={selectedAgenda}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            {/* Modal Edit Row Khusus 1 Baris (max-w-5xl) */}
            <PkptEditRowModal
                agenda={editingAgenda}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSave={updateAgenda}
            />
        </div>
    );
}
