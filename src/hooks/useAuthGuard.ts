'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/auth/AuthProvider';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requirePremium?: boolean;
  onAuthRequired?: () => void;
  onPremiumRequired?: () => void;
}

/**
 * Hook for protecting routes and handling authentication requirements
 * @param options - Configuration options for the auth guard
 * @returns Auth state and helper functions
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const {
    redirectTo = '/auth',
    requireAuth = true,
    requirePremium = false,
    onAuthRequired,
    onPremiumRequired
  } = options;

  const { user, userData, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while loading
    if (loading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        router.push(redirectTo);
      }
      return;
    }

    // Check premium requirement
    if (requirePremium && isAuthenticated && userData && !userData.premium) {
      if (onPremiumRequired) {
        onPremiumRequired();
      } else {
        router.push('/upgrade');
      }
      return;
    }
  }, [
    loading,
    isAuthenticated,
    userData,
    requireAuth,
    requirePremium,
    redirectTo,
    onAuthRequired,
    onPremiumRequired,
    router
  ]);

  return {
    user,
    userData,
    loading,
    isAuthenticated,
    isPremium: userData?.premium || false,
    canAccess: loading ? false : (
      (!requireAuth || isAuthenticated) &&
      (!requirePremium || (userData?.premium || false))
    )
  };
}

/**
 * Hook specifically for premium features
 * @param onUpgradeRequired - Callback when upgrade is needed
 * @returns Premium status and helper functions
 */
export function usePremiumGuard(onUpgradeRequired?: () => void) {
  return useAuthGuard({
    requireAuth: true,
    requirePremium: true,
    onPremiumRequired: onUpgradeRequired
  });
}

/**
 * Hook for pages that should redirect authenticated users away
 * @param redirectTo - Where to redirect authenticated users
 * @returns Auth state
 */
export function useGuestGuard(redirectTo: string = '/dashboard') {
  const { user, userData, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  return {
    user,
    userData,
    loading,
    isAuthenticated,
    canAccess: loading ? false : !isAuthenticated
  };
}