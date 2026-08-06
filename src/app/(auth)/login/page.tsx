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
            // Di dunia nyata, ini akan menembak axios.post('/api/v1/auth/login')
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay simulasi 1 detik

            // Mock User Data sesuai standar SystemRole di Backend
            const mockUser = {
                id: 'user-mock-uuid-1234',
                email: email,
                role: 'APIP_INTERNAL' as const,
                pegawaiId: 'pegawai-mock-uuid-5678', // Simulasi ID Pegawai
            };

            // Simpan ke Zustand (yang otomatis menyimpan ke Cookies)
            setAuth(mockUser, 'mock-jwt-token-abcdef123456');

            toast.success('Login Berhasil', { description: 'Selamat datang di APIP Suite.' });
            router.push('/dashboard');
        } catch (error) {
            toast.error('Login Gagal', { description: 'Terjadi kesalahan sistem.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-sm shadow-lg border-slate-200">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-slate-800">APIP Suite</CardTitle>
                    <CardDescription>
                        Masukkan email dan kata sandi Anda untuk masuk ke dalam sistem.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@inspektorat.go.id"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Memeriksa Kredensial...' : 'Masuk Sistem'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}