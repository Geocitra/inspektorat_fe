// src/features/penugasan/components/AuditDateRangeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
    Clock, Check, X, Sparkles, ArrowRight, Info, CalendarRange
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AuditDateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    onApply: (startDate: string, endDate: string) => void;
    defaultDurationHp?: number;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Helper format date string YYYY-MM-DD
const formatDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper format bahasa Indonesia
const formatIndoDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTH_NAMES[month]} ${year}`;
};

// Hitung hari kerja (Senin - Jumat)
const countWorkdays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (start > end) return 0;

    let workdays = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
            workdays++;
        }
        cur.setDate(cur.getDate() + 1);
    }
    return workdays;
};

// Tambah N hari kerja dari tanggal awal
const addWorkdays = (startStr: string, workdays: number): string => {
    const cur = new Date(startStr);
    // jika hari mulai adalah weekend, geser ke senin
    while (cur.getDay() === 0 || cur.getDay() === 6) {
        cur.setDate(cur.getDate() + 1);
    }
    let added = 1;

    while (added < workdays) {
        cur.setDate(cur.getDate() + 1);
        if (cur.getDay() !== 0 && cur.getDay() !== 6) {
            added++;
        }
    }
    return formatDateStr(cur);
};

// Helper untuk menghasilkan array kalender 1 bulan
const getMonthCalendarDays = (year: number, month: number, todayStr: string) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding kosong sebelum tanggal 1
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    // Hari riil
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = formatDateStr(dateObj);
        days.push({
            dayNumber: d,
            dateStr: dateStr,
            isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
            isToday: dateStr === todayStr,
        });
    }
    return days;
};

export default function AuditDateRangeModal({
    isOpen,
    onClose,
    startDate,
    endDate,
    onApply,
    defaultDurationHp = 15,
}: AuditDateRangeModalProps) {
    const today = new Date();
    const todayStr = formatDateStr(today);
    const initialDate = startDate ? new Date(startDate) : today;

    const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());

    const [tempStart, setTempStart] = useState<string>(startDate || todayStr);
    const [tempEnd, setTempEnd] = useState<string>(endDate || addWorkdays(todayStr, defaultDurationHp));

    // Sinkronisasi ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            const s = startDate || todayStr;
            const e = endDate || addWorkdays(s, defaultDurationHp);
            setTempStart(s);
            setTempEnd(e);
            const d = new Date(s);
            setCurrentYear(d.getFullYear());
            setCurrentMonth(d.getMonth());
        }
    }, [isOpen, startDate, endDate, defaultDurationHp]);

    // Navigasi Bulan
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    // Hitung Bulan Kedua
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    // Klik tanggal pada kalender (Sabtu & Minggu dinonaktifkan)
    const handleDayClick = (clickedDateStr: string, isWeekend: boolean) => {
        if (isWeekend) return; // Nonaktifkan Sabtu & Minggu

        if (!tempStart || (tempStart && tempEnd)) {
            // Titik awal baru
            setTempStart(clickedDateStr);
            setTempEnd('');
        } else if (tempStart && !tempEnd) {
            // Titik akhir
            if (new Date(clickedDateStr) < new Date(tempStart)) {
                setTempStart(clickedDateStr);
                setTempEnd('');
            } else {
                setTempEnd(clickedDateStr);
            }
        }
    };

    // Terapkan preset durasi hari kerja
    const handleApplyPreset = (days: number) => {
        const baseStart = tempStart || todayStr;
        const newEnd = addWorkdays(baseStart, days);
        setTempStart(baseStart);
        setTempEnd(newEnd);
    };

    const handleConfirm = () => {
        if (!tempStart) return;
        const finalEnd = tempEnd || tempStart;
        onApply(tempStart, finalEnd);
        onClose();
    };

    const month1Days = getMonthCalendarDays(currentYear, currentMonth, todayStr);
    const month2Days = getMonthCalendarDays(nextYear, nextMonth, todayStr);

    const effectiveWorkdays = countWorkdays(tempStart, tempEnd || tempStart);

    // Render Grid 1 Bulan
    const renderMonthGrid = (year: number, month: number, days: any[]) => (
        <div className="space-y-1.5 flex-1 min-w-[260px]">
            {/* Nama Bulan & Tahun */}
            <div className="text-center font-bold text-xs text-slate-800 tracking-wide font-mono uppercase pb-1 border-b border-slate-100">
                {MONTH_NAMES[month]} {year}
            </div>

            {/* Header Nama Hari */}
            <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-500 border-b border-slate-100 pb-1">
                {DAY_NAMES.map((name, i) => (
                    <span key={name} className={i === 0 || i === 6 ? 'text-red-500' : 'text-slate-700'}>
                        {name}
                    </span>
                ))}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-1 pt-0.5">
                {days.map((item, idx) => {
                    if (!item) {
                        return <div key={`empty-${idx}`} className="h-8" />;
                    }

                    const isStart = tempStart === item.dateStr;
                    const isEnd = tempEnd === item.dateStr;
                    const inRange =
                        tempStart &&
                        tempEnd &&
                        new Date(item.dateStr) > new Date(tempStart) &&
                        new Date(item.dateStr) < new Date(tempEnd);

                    return (
                        <button
                            key={item.dateStr}
                            type="button"
                            disabled={item.isWeekend}
                            onClick={() => handleDayClick(item.dateStr, item.isWeekend)}
                            className={`h-8 text-xs font-semibold flex flex-col items-center justify-center transition-all relative rounded-none ${
                                isStart || isEnd
                                    ? 'bg-blue-600 text-white font-bold shadow-sm z-10'
                                    : inRange
                                    ? item.isWeekend
                                        ? 'bg-slate-100/90 text-slate-350 cursor-not-allowed border-x border-slate-200'
                                        : 'bg-blue-100/80 text-blue-900 font-medium'
                                    : item.isWeekend
                                    ? 'text-slate-350 bg-slate-50/70 cursor-not-allowed hover:bg-slate-50/70'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title={item.isWeekend ? 'Akhir Pekan (Hari Libur Dinas)' : item.dateStr}
                        >
                            <span>{item.dayNumber}</span>
                            {item.isToday && !(isStart || isEnd) && (
                                <span className="w-1 h-1 bg-blue-600 rounded-full absolute bottom-0.5" />
                            )}
                            {isStart && <span className="text-[6px] uppercase font-mono tracking-tighter leading-none">Mulai</span>}
                            {isEnd && <span className="text-[6px] uppercase font-mono tracking-tighter leading-none">Selesai</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* CONTAINER MODAL FIT VIEWPORT: max-h-[85vh], flex-col, overflow-hidden */}
            <DialogContent className="sm:max-w-[840px] max-h-[85vh] flex flex-col p-0 overflow-hidden border-slate-300 shadow-2xl rounded-none">
                {/* 1. HEADER (SHRINK-0) */}
                <DialogHeader className="bg-slate-900 text-white p-3.5 shrink-0">
                    <DialogTitle className="text-xs sm:text-sm font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CalendarRange className="w-4 h-4 text-blue-400" />
                            Jadwal Rentang Tanggal Audit (Kalender Dinas)
                        </span>
                        <span className="text-[10px] font-mono font-normal text-blue-300 hidden sm:inline">
                            Disiplin Hari Kerja (Senin–Jumat)
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-[11px] mt-0.5">
                        Klik tanggal pertama untuk <strong>Mulai</strong>, lalu klik tanggal kedua untuk <strong>Selesai</strong>.
                    </DialogDescription>
                </DialogHeader>

                {/* 2. BODY SCROLLABLE JIKA LAYAR PENDEK (FLEX-1 OVERFLOW-Y-AUTO) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* BARIS PRESET CEPAT (HORIZONTAL PILLS) */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cepat:
                        </span>
                        {[
                            { label: '5 Hari Kerja (1 Minggu)', days: 5 },
                            { label: '10 Hari Kerja (2 Minggu)', days: 10 },
                            { label: '15 Hari Kerja (Standar)', days: 15 },
                            { label: '20 Hari Kerja (1 Bulan)', days: 20 },
                            { label: `${defaultDurationHp} HP (PKPT)`, days: defaultDurationHp },
                        ].map((preset, idx) => (
                            <Button
                                key={idx}
                                type="button"
                                variant="outline"
                                onClick={() => handleApplyPreset(preset.days)}
                                className="h-6 text-[10px] font-medium rounded-none border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 shadow-none px-2.5"
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    {/* NAVIGASI BULAN */}
                    <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrevMonth}
                            className="h-6 text-[11px] rounded-none border-slate-200 hover:bg-slate-100 text-slate-700 px-2 flex items-center gap-1 shadow-none"
                        >
                            <ChevronLeft className="w-3 h-3" /> Bulan Sebelumnya
                        </Button>

                        <span className="text-xs font-bold text-slate-800 font-mono">
                            {MONTH_NAMES[currentMonth]} {currentYear} &mdash; {MONTH_NAMES[nextMonth]} {nextYear}
                        </span>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleNextMonth}
                            className="h-6 text-[11px] rounded-none border-slate-200 hover:bg-slate-100 text-slate-700 px-2 flex items-center gap-1 shadow-none"
                        >
                            Bulan Berikutnya <ChevronRight className="w-3 h-3" />
                        </Button>
                    </div>

                    {/* KALENDER 2 BULAN SIDE-BY-SIDE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderMonthGrid(currentYear, currentMonth, month1Days)}
                        {renderMonthGrid(nextYear, nextMonth, month2Days)}
                    </div>
                </div>

                {/* 3. FOOTER AKSI (SHRINK-0 SELALU TERLIHAT) */}
                <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shrink-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px]">Terpilih:</span>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 border border-slate-300 text-xs">
                                {formatIndoDate(tempStart)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 border border-slate-300 text-xs">
                                {tempEnd ? formatIndoDate(tempEnd) : '(Pilih Selesai)'}
                            </span>
                        </div>

                        <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 border border-blue-300 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-blue-700" />
                            {effectiveWorkdays} Hari Kerja Efektif
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-8 rounded-none border-slate-200 text-xs shadow-none px-3"
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!tempStart}
                            className="h-8 bg-blue-600 hover:bg-blue-700 rounded-none text-xs font-bold shadow-none px-4"
                        >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Terapkan Tanggal
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
