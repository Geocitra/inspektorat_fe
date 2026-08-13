// src/features/planning/components/RiskAssessment.tsx
'use client';

import { usePkptStore } from '@/store/usePkptStore';
import { Calculator, RefreshCw, Info, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RiskAssessmentProps {
    isKasubag: boolean;
}

export default function RiskAssessment({ isKasubag }: RiskAssessmentProps) {
    const { riskList, recalculateRisks, isCalculating } = usePkptStore();

    return (
        <div className="space-y-6">
            {/* INFO FORMULA TOOLTIP */}
            <div className="border border-slate-200 bg-white p-4 rounded-none flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="text-xs font-bold text-slate-800">Formula Penilaian Tingkat Risiko (NTR)</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        Skor Akhir Risiko (NTR) dihitung secara otomatis berdasarkan bobot parameters: 
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 border border-slate-200 text-slate-700 ml-1">
                            NTR = (Nilai Risiko Inheren * 0.7) + (Nilai Frekuensi Risiko * 0.3)
                        </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                        Kategori Prioritas: High Risk (NTR &ge; 7.5) | Medium Risk (5.5 &le; NTR &lt; 7.5) | Low Risk (NTR &lt; 5.5).
                    </p>
                </div>
            </div>

            {/* DYNAMIC ACTION ROW */}
            <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    Matriks Risiko Objek Audit ({riskList.length} OPD)
                </h3>
                {isKasubag && (
                    <Button 
                        onClick={() => recalculateRisks(2026)} 
                        disabled={isCalculating}
                        className="bg-blue-600 hover:bg-blue-700 rounded-none text-xs shadow-none"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCalculating ? 'animate-spin' : ''}`} />
                        {isCalculating ? 'Menghitung Ulang...' : 'Hitung Ulang Risiko'}
                    </Button>
                )}
            </div>

            {/* TABLE RISK ASSESSMENT */}
            <div className="border border-slate-200 bg-white rounded-none">
                {riskList.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs italic">
                        Belum ada data OPD untuk dihitung risikonya. Silakan daftarkan OPD di Master OPD.
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-b border-slate-200">
                                <TableHead className="w-[50px] font-bold text-slate-700 text-xs">No</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Kode OPD</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs">Nama Organisasi Perangkat Daerah (OPD)</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs text-center w-[120px]">Inheren (NRI)</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs text-center w-[120px]">Frekuensi (NFR)</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs text-center w-[120px]">Skor Akhir (NTR)</TableHead>
                                <TableHead className="font-bold text-slate-700 text-xs w-[120px]">Tingkat Prioritas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {riskList.map((risk, index) => (
                                <TableRow key={risk.opdId} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                                    <TableCell className="font-mono text-slate-400 text-xs">{index + 1}</TableCell>
                                    <TableCell className="font-mono font-bold text-slate-600 text-xs">{risk.kode}</TableCell>
                                    <TableCell className="font-bold text-slate-800 text-sm">{risk.namaOpd}</TableCell>
                                    <TableCell className="text-center font-mono font-semibold text-xs text-slate-600">{risk.nri.toFixed(1)} / 10</TableCell>
                                    <TableCell className="text-center font-mono font-semibold text-xs text-slate-600">{risk.nfr.toFixed(1)} / 10</TableCell>
                                    <TableCell className="text-center font-mono font-bold text-xs text-blue-600">{risk.ntr.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 border rounded-none ${
                                            risk.prioritas === 'Tinggi'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : risk.prioritas === 'Sedang'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                        }`}>
                                            {risk.prioritas === 'Tinggi' ? 'High Risk' : risk.prioritas === 'Sedang' ? 'Medium' : 'Low Risk'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* RISK CHART */}
            {riskList.length > 0 && (
                <div className="border border-slate-200 bg-white p-5 rounded-none space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Visualisasi Distribusi Risiko OPD</h3>
                        <p className="text-slate-400 text-[11px] mt-0.5">Grafik perbandingan tingkat kerentanan fraud dan kompleksitas anggaran daerah.</p>
                    </div>
                    
                    <div className="space-y-3.5 pt-2">
                        {riskList.map((risk) => (
                            <div key={risk.opdId} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span className="truncate max-w-[250px]">{risk.namaOpd}</span>
                                    <span className="font-mono text-slate-500">Skor NTR: {risk.ntr.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-full bg-slate-100 border border-slate-200 rounded-none overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 rounded-none ${
                                                risk.prioritas === 'Tinggi'
                                                    ? 'bg-red-500'
                                                    : risk.prioritas === 'Sedang'
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${(risk.ntr / 10) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-none whitespace-nowrap ${
                                        risk.prioritas === 'Tinggi'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : risk.prioritas === 'Sedang'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-green-50 text-green-700 border-green-200'
                                    }`}>
                                        {risk.prioritas}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
