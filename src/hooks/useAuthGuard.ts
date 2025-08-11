// src/hooks/useAuthGuard.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/auth/AuthProvider';

type UserData = { premium?: boolean } | null; // placeholder until you wire real profile data

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requirePremium?: boolean;
  onAuthRequired?: () => void;
  onPremiumRequired?: () => void;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const {
    redirectTo = '/auth',
    requireAuth = true,
    requirePremium = false,
    onAuthRequired,
    onPremiumRequired,
  } = options;

  const { user, loading } = useAuth();
  const router = useRouter();

  const isAuthenticated = !!user;

  // TODO: replace with real profile fetch (Firestore/Supabase/etc.)
  const userData: UserData = user ? { premium: false } : null; // placeholder userData
  const isPremiumUser = !!userData?.premium;

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      onAuthRequired?.() ?? router.push(redirectTo);
      return;
    }

    if (requirePremium && isAuthenticated && !isPremiumUser) {
      onPremiumRequired?.() ?? router.push('/upgrade');
      return;
    }
  }, [
    loading,
    isAuthenticated,
    isPremiumUser,
    requireAuth,
    requirePremium,
    redirectTo,
    onAuthRequired,
    onPremiumRequired,
    router,
  ]);

  return {
    user,
    userData,
    loading,
    isAuthenticated,
    isPremium: isPremiumUser,
    canAccess:
      !loading &&
      (!requireAuth || isAuthenticated) &&
      (!requirePremium || isPremiumUser),
  };
}

export function usePremiumGuard(onUpgradeRequired?: () => void) {
  return useAuthGuard({
    requireAuth: true,
    requirePremium: true,
    onPremiumRequired: onUpgradeRequired,
  });
}

export function useGuestGuard(redirectTo: string = '/dashboard') {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  return {
    user,
    loading,
    isAuthenticated,
    canAccess: !loading && !isAuthenticated,
  };
}
