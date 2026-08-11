// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Ambil token dari cookies browser
    const token = request.cookies.get('token')?.value;

    // Baca rute yang sedang diakses
    const path = request.nextUrl.pathname;
    const isAuthPage = path.startsWith('/login');

    // SKENARIO 1: Mencoba masuk rute terproteksi TAPI TIDAK punya token
    if (!token && !isAuthPage) {
        // Tendang ke halaman Login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // SKENARIO 2: Mencoba masuk halaman Login TAPI SUDAH punya token
    if (token && isAuthPage) {
        // Langsung arahkan ke Dashboard Utama di root /
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Jika aman, biarkan lewat
    return NextResponse.next();
}

// Tentukan rute mana saja yang diawasi oleh Satpam ini
export const config = {
    matcher: [
        '/', 
        '/login', 
        '/planning/:path*', 
        '/penugasan/:path*', 
        '/audit-execution/:path*', 
        '/pelaporan/:path*', 
        '/monitoring/:path*', 
        '/portal/:path*', 
        '/upload-bukti/:path*'
    ],
};