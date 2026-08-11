// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, Shield, Building2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Gagal', { description: 'Email dan password wajib diisi.' });
            return;
        }

        setIsLoading(true);

        try {
            // SIMULASI LOGIN (Mock Auth)
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Tentukan role berdasarkan email
            const isPimpinan = email.toLowerCase().includes('inspektur') || email.toLowerCase().includes('pimpinan');
            const isAuditor = email.toLowerCase().includes('auditor');
            const isOpd = email.toLowerCase().includes('opd') || email.toLowerCase().includes('dinas') || email.toLowerCase().includes('auditee');
            
            const role = isPimpinan 
                ? ('APIP_PIMPINAN' as const) 
                : isAuditor 
                ? ('AUDITOR' as const) 
                : isOpd
                ? ('AUDITEE_OPD' as const)
                : ('APIP_INTERNAL' as const);

            const mockUser = {
                id: isPimpinan ? 'user-inspektur-uuid' : isAuditor ? 'user-auditor-uuid' : isOpd ? 'user-opd-uuid' : 'user-kasubag-uuid',
                email: email,
                role: role,
                pegawaiId: isPimpinan ? 'pegawai-inspektur-uuid' : isAuditor ? 'pegawai-auditor-uuid' : undefined,
                opdId: isOpd ? 'opd-dinas-pendidikan' : undefined
            };

            // Simpan ke Zustand & Cookies
            setAuth(mockUser, 'mock-jwt-token-abcdef123456');

            toast.success('Login Berhasil', { 
                description: `Selamat datang. Anda masuk sebagai ${
                    role === 'APIP_PIMPINAN' 
                        ? 'Inspektur' 
                        : role === 'AUDITOR' 
                        ? 'Auditor / Tim Audit' 
                        : role === 'AUDITEE_OPD'
                        ? 'OPD / Auditee'
                        : 'Kasubag Perencanaan'
                }.` 
            });

            if (role === 'AUDITEE_OPD') {
                router.push('/portal/tanggapan/st-1');
            } else {
                router.push('/');
            }
        } catch (error) {
            toast.error('Login Gagal', { description: 'Terjadi kesalahan sistem.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper untuk Demo/Testing Cepat
    const handleQuickLogin = (role: 'KASUBAG' | 'INSPEKTUR' | 'AUDITOR' | 'OPD') => {
        if (role === 'KASUBAG') {
            setEmail('kasubag.perencanaan@inspektorat.go.id');
            setPassword('password123');
        } else if (role === 'INSPEKTUR') {
            setEmail('inspektur.utama@inspektorat.go.id');
            setPassword('password123');
        } else if (role === 'AUDITOR') {
            setEmail('auditor.budi@inspektorat.go.id');
            setPassword('password123');
        } else {
            setEmail('dinas.pendidikan@surabaya.go.id');
            setPassword('password123');
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-sm rounded-none border border-slate-200 shadow-none">
                <CardHeader className="space-y-1 text-center border-b border-slate-100 pb-4">
                    <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">APIP Suite</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                        Masuk menggunakan kredensial akun E-Audit Anda.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@inspektorat.go.id"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="rounded-none border-slate-200 text-sm focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Kata Sandi</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="rounded-none border-slate-200 text-sm focus:border-blue-500"
                            />
                        </div>

                        {/* MOCK QUICK LOGINS BANNER */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Akun Uji Coba Cepat</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleQuickLogin('KASUBAG')}
                                    className="rounded-none text-[9px] h-7 px-1 border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 shadow-none"
                                >
                                    <Users className="w-3 h-3 text-blue-600" />
                                    Kasubag (Architect)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleQuickLogin('INSPEKTUR')}
                                    className="rounded-none text-[9px] h-7 px-1 border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 shadow-none"
                                >
                                    <Shield className="w-3 h-3 text-red-650" />
                                    Inspektur (Approver)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleQuickLogin('AUDITOR')}
                                    className="rounded-none text-[9px] h-7 px-1 border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 shadow-none"
                                >
                                    <Users className="w-3 h-3 text-emerald-600" />
                                    Auditor (Tim Audit)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleQuickLogin('OPD')}
                                    className="rounded-none text-[9px] h-7 px-1 border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 shadow-none"
                                >
                                    <Building2 className="w-3 h-3 text-amber-500" />
                                    OPD (Auditee)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                        <Button type="submit" className="w-full rounded-none bg-blue-600 hover:bg-blue-700 text-xs font-bold shadow-none" disabled={isLoading}>
                            {isLoading ? 'Memeriksa Kredensial...' : 'Masuk Sistem'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}