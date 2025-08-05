import { AdminHeader } from "@/components/admin/header";
import { AdminDashboard } from "@/components/admin/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Admin dashboard for Wedly application.',
};

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AdminHeader />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
