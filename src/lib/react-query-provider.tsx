// src/lib/react-query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReactQueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Buat instance QueryClient di dalam useState agar tidak 
    // dibuat ulang setiap kali halaman mengalami re-render
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // Data tabel tidak akan di-fetch ulang selama 1 menit jika user bolak-balik halaman
                        retry: 1, // Hanya ulangi 1 kali jika request gagal (menghindari spam ke backend)
                        refetchOnWindowFocus: false, // Jangan fetch ulang otomatis kalau pindah tab browser
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}