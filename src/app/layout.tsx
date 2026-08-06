// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/lib/react-query-provider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
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