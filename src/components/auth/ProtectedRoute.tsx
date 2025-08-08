'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requirePremium?: boolean;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requirePremium = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, userData, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Show loading state while authentication is being determined
  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  // Check premium requirement
  if (requirePremium && userData && !userData.premium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">Premium Required</h2>
            <p className="text-gray-600">
              This feature requires a premium subscription. Please upgrade your account to continue.
            </p>
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade to Premium
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 * @param Component - The component to protect
 * @param options - Protection options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    redirectTo?: string;
    requirePremium?: boolean;
    fallback?: ReactNode;
  } = {}
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
}