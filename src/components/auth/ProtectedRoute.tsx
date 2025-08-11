// src/components/auth/ProtectedRoute.tsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user'; // Use the correct hook
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: React.ReactNode;
  fallback?: string; // Optional fallback route
};

export function ProtectedRoute({ children, fallback = '/auth' }: ProtectedRouteProps) {
  // FIX: Destructure only the properties that actually exist: 'user' and 'loading'
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there is NO user, redirect to the fallback page
    if (!loading && !user) {
      router.push(fallback);
    }
  }, [user, loading, router, fallback]);

  // While checking for a user, show a loading spinner
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // If loading is finished and a user exists, show the protected content
  return <>{children}</>;
}
