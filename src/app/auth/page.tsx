// src/app/auth/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; // Assuming this is your auth hook
import { Loader2 } from 'lucide-react';
import { LoginTab } from '@/components/auth/login-tab'; // Assuming you have these components
import { SignupTab } from '@/components/auth/signup-tab'; // Assuming you have these components

export default function AuthPage() {
  // FIX: Destructure 'user' instead of 'isAuthenticated'
  const { user, loading } = useAuth(); 
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    // If loading is finished and the user object exists, they are authenticated.
    // Redirect them to the dashboard.
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // While checking auth state, show a loader.
  // Also, if the user is logged in, this will show briefly before the redirect.
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // If the user is not logged in, show the auth forms.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex border-b">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'signup' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Sign Up
          </button>
        </div>
        
        {activeTab === 'login' ? <LoginTab /> : <SignupTab />}
      </div>
    </div>
  );
}
