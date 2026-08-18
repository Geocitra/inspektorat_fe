// src/components/ui/pagination-control.tsx
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    itemName?: string;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    itemName = 'data',
}) => {
    if (totalItems <= pageSize) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 pb-1 text-xs border-t border-slate-100">
            {/* Info Range Data */}
            <div className="text-slate-500 text-center sm:text-left">
                Menampilkan <strong className="text-slate-800 font-mono">{startItem}–{endItem}</strong> dari{' '}
                <strong className="text-slate-800 font-mono">{totalItems}</strong> {itemName}
            </div>

            {/* Tombol Navigasi Page */}
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-7 px-2.5 rounded-none border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-none flex items-center gap-1"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                </Button>

                <div className="px-2 font-mono text-xs text-slate-700 font-semibold">
                    {currentPage} / {totalPages}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-7 px-2.5 rounded-none border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-none flex items-center gap-1"
                >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
};
