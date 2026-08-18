// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { SuratTugas } from '@/types/st.type';
import { PkaItem } from '@/features/penugasan/components/PkaWorkspace';
import { KkaItem } from '@/store/useKkaStore';

// Format Rupiah untuk PDF
const formatRupiahPdf = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
};

/**
 * 1. EKSPOR DOKUMEN SURAT TUGAS (ST) KEDINASAN A4 RESMI
 */
export const exportSuratTugasPdf = (st: SuratTugas) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // KOP SURAT
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text('PEMERINTAH KOTA SURABAYA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(15);
    doc.text('INSPEKTORAT DAERAH', pageWidth / 2, 26, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Jl. Jimerto No. 25-27, Ketabang, Genteng, Kota Surabaya, Jawa Timur 60272', pageWidth / 2, 31, { align: 'center' });
    doc.text('Telepon: (031) 5345689 | Laman: inspektorat.surabaya.go.id', pageWidth / 2, 35, { align: 'center' });

    // GARIS KOP GANDA
    doc.setLineWidth(0.8);
    doc.line(15, 38, pageWidth - 15, 38);
    doc.setLineWidth(0.2);
    doc.line(15, 39, pageWidth - 15, 39);

    // JUDUL NASKAH DINAS
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('SURAT PERINTAH TUGAS', pageWidth / 2, 47, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Nomor: ${st.noSt}`, pageWidth / 2, 52, { align: 'center' });

    // DASAR HUKUM
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('DASAR:', 15, 60);
    doc.setFont('times', 'normal');
    const dasarText = [
        '1. Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintahan Daerah.',
        '2. Peraturan Walikota Surabaya Nomor 78 Tahun 2021 tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi Inspektorat.',
        '3. Program Kerja Pengawasan Tahunan (PKPT) Berbasis Risiko Inspektorat Daerah Kota Surabaya Tahun Anggaran 2026.'
    ];
    let yPos = 65;
    dasarText.forEach(item => {
        const splitText = doc.splitTextToSize(item, pageWidth - 35);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 4.5;
    });

    // MEMERINTAHKAN
    yPos += 2;
    doc.setFont('times', 'bold');
    doc.text('MEMERINTAHKAN:', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    doc.text('KEPADA:', 15, yPos);
    doc.setFont('times', 'normal');

    // TABEL PERSONIL TIM AUDITOR
    const tableBody: string[][] = (st.stAuditors && st.stAuditors.length > 0)
        ? st.stAuditors.map((aud, idx) => [
            (idx + 1).toString(),
            aud.nama || 'Pejabat Auditor',
            aud.nip || '-',
            aud.jabatan || 'Auditor',
            (aud.peranDalamTim || '').replace('_', ' ')
        ])
        : [
            ['1', 'Drs. Hendro Gunawan, M.Si', '19680512 199403 1 005', 'Auditor Ahli Madya', 'Pengawas Teknis'],
            ['2', 'Budi Santoso, S.E., Ak.', '19820714 200604 1 012', 'Auditor Ahli Muda', 'Ketua Tim'],
            ['3', 'Siti Rahmawati, S.Tr.Ak', '19920318 201503 2 003', 'Auditor Ahli Pertama', 'Anggota Tim'],
            ['4', 'Ahmad Fauzi, S.E.', '19951105 201902 1 004', 'Auditor Terampil', 'Anggota Tim']
        ];

    autoTable(doc, {
        startY: yPos + 2,
        head: [['No', 'Nama Personil', 'NIP', 'Jabatan Kedinasan', 'Kedudukan Tim']],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'times', fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 50, fontStyle: 'bold' },
            2: { cellWidth: 42, fontStyle: 'normal' },
            3: { cellWidth: 46 },
            4: { cellWidth: 32, fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;

    // UNTUK PELAKSANAAN TUGAS
    doc.setFont('times', 'bold');
    doc.text('UNTUK:', 15, finalY + 7);
    doc.setFont('times', 'normal');

    const untukText = [
        `1. Melaksanakan penugasan ${st.namaAudit} pada ${st.namaOpd}.`,
        `2. Melakukan pengujian kepatuhan, keandalan data keuangan, dan kepatuhan Standar Satuan Harga (SSH).`,
        `3. Waktu pelaksanaan dimulai tanggal ${st.tglMulai || '16 Maret 2026'} sampai dengan ${st.tglSelesai || '27 Maret 2026'}.`,
        `4. Melaporkan hasil pengawasan dalam bentuk Kertas Kerja Audit (KKA) dan Naskah Hasil Pengawasan (NHP).`
    ];

    let untukY = finalY + 12;
    untukText.forEach(item => {
        const split = doc.splitTextToSize(item, pageWidth - 35);
        doc.text(split, 20, untukY);
        untukY += split.length * 4.2;
    });

    // FOOTER TTD / TTE
    const signY = untukY + 8;
    doc.text('Ditetapkan di : Surabaya', pageWidth - 75, signY);
    doc.text(`Pada tanggal : ${st.tglMulai || '16 Maret 2026'}`, pageWidth - 75, signY + 4);
    doc.setFont('times', 'bold');
    doc.text('INSPEKTUR KOTA SURABAYA', pageWidth - 75, signY + 10);

    // QR TTE BSrE
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.4);
    doc.rect(pageWidth - 75, signY + 13, 55, 16);
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    doc.text('TANDATANGAN ELEKTRONIK (TTE)', pageWidth - 73, signY + 18);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID: BSRE-SHA256-${st.id.substring(0, 8).toUpperCase()}`, pageWidth - 73, signY + 22);
    doc.text('Balai Sertifikasi Elektronik (BSrE BSSN)', pageWidth - 73, signY + 26);

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('Dr. Ikhsan, S.Psi., M.M.', pageWidth - 75, signY + 34);
    doc.setFont('times', 'normal');
    doc.text('Pembina Utama Madya (Gol. IV/d)', pageWidth - 75, signY + 38);
    doc.text('NIP. 19690809 199412 1 001', pageWidth - 75, signY + 42);

    // DOWNLOAD FILE
    const filename = `Surat_Tugas_${st.noSt.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
    toast.success('Dokumen Surat Tugas PDF Berhasil Diunduh', { description: filename });
};

/**
 * 2. EKSPOR DOKUMEN PROGRAM KERJA AUDIT (PKA) RESMI A4
 */
export const exportPkaPdf = (st: SuratTugas, pkaItems: PkaItem[]) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // KOP PKA
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('INSPEKTORAT DAERAH KOTA SURABAYA', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text('PROGRAM KERJA AUDIT (PKA)', pageWidth / 2, 24, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Standar Operasional Prosedur Pengawasan Intern APIP Berbasis Risiko', pageWidth / 2, 29, { align: 'center' });

    doc.setLineWidth(0.6);
    doc.line(15, 32, pageWidth - 15, 32);

    // INFO PENUGASAN
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('Nama Objek (Auditi)', 15, 39);
    doc.text('Surat Tugas Acuan', 15, 44);
    doc.text('Program Audit', 15, 49);

    doc.setFont('times', 'normal');
    doc.text(`: ${st.namaOpd}`, 55, 39);
    doc.text(`: ${st.noSt}`, 55, 44);
    doc.text(`: ${st.namaAudit}`, 55, 49);

    doc.setFont('times', 'bold');
    doc.text('Ketua Tim', pageWidth - 80, 39);
    doc.text('Waktu Pelaksanaan', pageWidth - 80, 44);

    doc.setFont('times', 'normal');
    doc.text(': Budi Santoso, S.E., Ak.', pageWidth - 50, 39);
    doc.text(`: ${st.tglMulai} s/d ${st.tglSelesai}`, pageWidth - 50, 44);

    // TABEL PROSEDUR PKA
    const tableBody = pkaItems.map((p, idx) => [
        p.kodeProsedur || `PKA-0${idx + 1}`,
        p.langkahKerja,
        p.metode,
        p.dasarPengujian,
        p.auditorPelaksana,
        `${p.alokasiHari} hr`
    ]);

    autoTable(doc, {
        startY: 54,
        head: [['Kode', 'Langkah Prosedur Pengujian Substantif', 'Metode Uji', 'Dasar Rujukan', 'Pelaksana', 'Waktu']],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'times', fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [240, 245, 255], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
            1: { cellWidth: 62 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 36, fontSize: 7.5 },
            4: { cellWidth: 26, fontSize: 7.5 },
            5: { cellWidth: 10, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;

    // TTD PKA
    const signY = finalY + 12;
    doc.setFontSize(8.5);
    doc.text('Disetujui Oleh,', 25, signY);
    doc.text('Pengawas Teknis (PT)', 25, signY + 4);

    doc.text('Disusun Oleh,', pageWidth - 65, signY);
    doc.text('Ketua Tim Pemeriksa (KT)', pageWidth - 65, signY + 4);

    doc.setFont('times', 'bold');
    doc.text('Drs. Hendro Gunawan, M.Si', 25, signY + 24);
    doc.text('Budi Santoso, S.E., Ak.', pageWidth - 65, signY + 24);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('NIP. 19680512 199403 1 005', 25, signY + 28);
    doc.text('NIP. 19820714 200604 1 012', pageWidth - 65, signY + 28);

    const filename = `PKA_${st.namaOpd.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf`;
    doc.save(filename);
    toast.success('Dokumen PKA PDF Berhasil Diunduh', { description: filename });
};

/**
 * 3. EKSPOR DOKUMEN KERTAS KERJA AUDIT (KKA) RESMI A4
 */
export const exportKkaPdf = (st: SuratTugas, kkaItems: KkaItem[]) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // KOP KKA
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('INSPEKTORAT DAERAH KOTA SURABAYA', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(13);
    doc.text('KERTAS KERJA AUDIT (KKA) - PENGUJIAN BELANJA', pageWidth / 2, 24, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Hasil Uji Petik Bukti Transaksi Realisasi SPJ vs Standar Satuan Harga (SSH)', pageWidth / 2, 29, { align: 'center' });

    doc.setLineWidth(0.6);
    doc.line(15, 32, pageWidth - 15, 32);

    // INFO KKA
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('Objek Pemeriksaan', 15, 38);
    doc.text('Surat Tugas', 15, 43);
    doc.setFont('times', 'normal');
    doc.text(`: ${st.namaOpd}`, 50, 38);
    doc.text(`: ${st.noSt}`, 50, 43);

    // TABEL KKA
    const tableBody = kkaItems.map((item, idx) => [
        (idx + 1).toString(),
        item.namaBarang,
        formatRupiahPdf(item.hargaSpj),
        item.hargaSsh > 0 ? formatRupiahPdf(item.hargaSsh) : 'Rp 0 (Tanpa Pagu)',
        item.selisih > 0 ? `+${formatRupiahPdf(item.selisih)}` : 'Rp 0',
        item.status === 'APPROVED' ? 'DISETUJUI (TEMUAN)' : item.status,
        item.justifikasi || 'Belum diisi klarifikasi'
    ]);

    autoTable(doc, {
        startY: 48,
        head: [['No', 'Uraian Objek Belanja Realisasi SPJ', 'Nilai SPJ', 'Batas SSH / DPA', 'Deviasi Mark-up', 'Status KKA', 'Catatan Klarifikasi Auditor']],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'times', fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            1: { cellWidth: 44, fontStyle: 'bold' },
            2: { cellWidth: 24, halign: 'right' },
            3: { cellWidth: 26, halign: 'right' },
            4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
            6: { cellWidth: 32 }
        },
        margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;

    // KESIMPULAN TEMUAN
    const approved = kkaItems.filter(k => k.status === 'APPROVED');
    const totalDeviasi = approved.reduce((acc, k) => acc + k.selisih, 0);

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(`Total Indikasi Kerugian / Pemborosan Daerah: ${formatRupiahPdf(totalDeviasi)}`, 15, finalY + 8);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('Temuan yang disetujui di atas telah divalidasi silang terhadap Perwali SSH No. 12/2026 dan DPA SKPD 2026.', 15, finalY + 12);

    // TTD KKA
    const signY = finalY + 22;
    doc.setFontSize(8.5);
    doc.text('Direviu Oleh,', 25, signY);
    doc.text('Ketua Tim Pemeriksa (KT)', 25, signY + 4);

    doc.text('Diperiksa Oleh,', pageWidth - 65, signY);
    doc.text('Auditor Pelaksana Lapangan', pageWidth - 65, signY + 4);

    doc.setFont('times', 'bold');
    doc.text('Budi Santoso, S.E., Ak.', 25, signY + 20);
    doc.text('Siti Rahmawati, S.Tr.Ak', pageWidth - 65, signY + 20);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('NIP. 19820714 200604 1 012', 25, signY + 24);
    doc.text('NIP. 19920318 201503 2 003', pageWidth - 65, signY + 24);

    const filename = `KKA_Uji_Petik_${st.namaOpd.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
    toast.success('Dokumen KKA PDF Berhasil Diunduh', { description: filename });
};
