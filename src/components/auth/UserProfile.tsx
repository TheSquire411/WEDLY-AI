// src/components/auth/UserProfile.tsx

"use client";

import React from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth'; 

export function UserProfile() {
  const { user, loading } = useUser();
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  // FIX: Cast the user object to 'any' to safely access properties 
  // that might not be in the incomplete UserData type definition.
  const anyUser = user as any;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={anyUser.photoURL || ''} alt={anyUser.displayName || 'User'} />
            <AvatarFallback>{getInitials(anyUser.email)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{anyUser.displayName || 'No display name'}</p>
            <p className="text-sm text-gray-500">{anyUser.email}</p>
          </div>
        </div>
        <Button onClick={handleSignOut} className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
