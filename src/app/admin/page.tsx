
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AdminHeader } from "@/components/admin/header";
import { AdminDashboard } from "@/components/admin/dashboard";
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user?.isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AdminHeader />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
