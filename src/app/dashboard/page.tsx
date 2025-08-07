
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Header } from '@/components/header';
import { AppTabs } from '@/components/app-tabs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading, getIdToken } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleSetAdmin = async () => {
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Not authenticated.");
      }
      const response = await fetch('/api/set-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set admin claim.');
      }

      toast({
        title: "Success",
        description: "You are now an admin. Please sign out and sign back in for the changes to take effect.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Error setting admin claim:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your wedding dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
          <Button onClick={handleSetAdmin}>Become Admin (Dev Only)</Button>
        </div>
        <AppTabs />
      </main>
    </div>
  );
}
