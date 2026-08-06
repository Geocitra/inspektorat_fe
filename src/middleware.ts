// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Ambil token dari cookies browser
    const token = request.cookies.get('token')?.value;

    // Baca rute yang sedang diakses
    const path = request.nextUrl.pathname;
    const isAuthPage = path.startsWith('/login');
    const isDashboardPage = path.startsWith('/dashboard');

    // SKENARIO 1: Mencoba masuk Dashboard TAPI TIDAK punya token
    if (isDashboardPage && !token) {
        // Tendang ke halaman Login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // SKENARIO 2: Mencoba masuk halaman Login/Home TAPI SUDAH punya token
    if ((isAuthPage || path === '/') && token) {
        // Langsung arahkan ke Dashboard (mencegah user login 2 kali)
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Jika aman, biarkan lewat
    return NextResponse.next();
}

// Tentukan rute mana saja yang diawasi oleh Satpam ini
export const config = {
    matcher: ['/', '/login', '/dashboard/:path*'],
};