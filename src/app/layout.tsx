// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/lib/react-query-provider";

export const metadata: Metadata = {
  title: "APIP Suite | Inspektorat Daerah",
  description: "Sistem Pengawasan Internal Pemerintah Daerah Berbasis AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="font-sans">
      <body>
        {/* Bungkus Aplikasi dengan React Query Provider */}
        <ReactQueryProvider>
          {children}
          {/* Toaster untuk Notifikasi Pop-Up Shadcn */}
          <Toaster position="top-right" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}