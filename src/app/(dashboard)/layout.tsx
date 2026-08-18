// src/app/(dashboard)/layout.tsx
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import NavigationBreadcrumb from "@/components/layout/NavigationBreadcrumb";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* Kolom Kiri: Sidebar */}
            <Sidebar />

            {/* Kolom Kanan: Header + Breadcrumb Navigation + Konten Dinamis */}
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <NavigationBreadcrumb />

                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
