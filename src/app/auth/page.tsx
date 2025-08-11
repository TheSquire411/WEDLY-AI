// src/app/auth/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user'; 
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added for the placeholder forms
import { Input } from '@/components/ui/input';   // Added for the placeholder forms
import { Label } from '@/components/ui/label';   // Added for the placeholder forms

// FIX: Created placeholder components directly in this file to resolve module errors.
// You can replace the content of these with your actual form components.

function LoginTab() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" />
      </div>
      <Button className="w-full">Login</Button>
    </div>
  );
}

function SignupTab() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email-signup">Email</Label>
        <Input id="email-signup" type="email" placeholder="m@example.com" />
      </div>
      <div>
        <Label htmlFor="password-signup">Password</Label>
        <Input id="password-signup" type="password" />
      </div>
      <Button className="w-full">Create Account</Button>
    </div>
  );
}


export default function AuthPage() {
  const { user, loading } = useUser(); 
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex border-b">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-center font-medium transition-colors ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-center font-medium transition-colors ${activeTab === 'signup' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign Up
          </button>
        </div>
        
        {activeTab === 'login' ? <LoginTab /> : <SignupTab />}
      </div>
    </div>
  );
}
