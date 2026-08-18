// src/features/planning/components/pkpt/PkptTable.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AuditAgenda } from '@/store/usePkptStore';
import { Eye, Edit3, Shield, Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PaginationControl } from '@/components/ui/pagination-control';
import { formatUnitKerja } from '@/lib/formatters';

interface PkptTableProps {
    agendas: AuditAgenda[];
    onViewDetail: (agenda: AuditAgenda) => void;
    onEditRow: (agenda: AuditAgenda) => void;
}

export const PkptTable: React.FC<PkptTableProps> = ({
    agendas,
    onViewDetail,
    onEditRow,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [agendas.length]);

    const totalPages = Math.ceil(agendas.length / pageSize) || 1;
    const paginatedAgendas = agendas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="border border-slate-200 bg-white rounded-none p-3 space-y-2">
            <div className="overflow-x-auto">
                <Table className="border-collapse min-w-[850px]">
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                            <TableHead className="font-bold text-slate-700 text-xs w-12 text-center">No</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs min-w-[260px]">Area Pengawasan &amp; Objek (OPD)</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs w-36">Jenis Pengawasan</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs w-36">Pelaksana (Irban)</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs w-24 text-center">Jadwal</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs w-24 text-center">Total HP</TableHead>
                            <TableHead className="font-bold text-slate-700 text-xs w-24 text-center">Risiko</TableHead>
                            <TableHead className="text-center font-bold text-slate-700 text-xs w-20">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedAgendas.map((agenda, index) => {
                            const unitFormatted = formatUnitKerja(agenda.pelaksana);
                            const isHigh = agenda.prioritas === 'Tinggi';
                            const isMedium = agenda.prioritas === 'Sedang';
                            const rowNumber = (currentPage - 1) * pageSize + index + 1;

                            return (
                                <TableRow key={agenda.id || index} className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0">
                                    <TableCell className="font-mono text-xs text-slate-400 text-center">
                                        {rowNumber}
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3">
                                        <div>
                                            <p className="font-bold text-slate-900 text-xs leading-snug">
                                                {agenda.areaPengawasan || agenda.namaAudit}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                {agenda.namaOpd}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3">
                                        <span className="text-xs text-slate-700 font-medium">
                                            {agenda.jenisPengawasan}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3">
                                        <span className="text-xs font-semibold text-slate-800">
                                            {unitFormatted}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3 text-center">
                                        <span className="text-xs font-mono font-bold text-blue-700">
                                            {agenda.jadwal || 'TW I'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3 text-center font-mono text-xs font-semibold text-slate-800">
                                        {agenda.hariPemeriksaan?.totalHp || 50} HP
                                    </TableCell>
                                    <TableCell className="text-center py-2.5 px-3">
                                        <span className={`text-xs font-bold ${
                                            isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                                        }`}>
                                            {agenda.prioritas || 'Tinggi'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-2 px-2">
                                        <div className="flex items-center justify-center gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onViewDetail(agenda)}
                                                className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                title="Lihat Rincian Agenda"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditRow(agenda)}
                                                className="h-7 w-7 p-0 rounded-none text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                title="Edit Baris Agenda Ini"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* PAGINATION */}
            <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={agendas.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemName="agenda PKPT"
            />
        </div>
    );
};
