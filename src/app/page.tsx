import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-24">
      <div className="z-10 w-full max-w-md items-center justify-center font-mono text-sm flex flex-col space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">APIP Suite</h1>
          <p className="text-slate-500">Sistem Pengawasan Internal Pemerintah Daerah</p>
        </div>

        <div className="w-full flex flex-col space-y-4 pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 font-sans">
            Sistem tertutup. Silakan masuk menggunakan akun yang telah didaftarkan oleh Administrator.
          </p>
          <Link href="/login" className="w-full">
            <Button className="w-full font-semibold" size="lg">
              Masuk ke Sistem
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}