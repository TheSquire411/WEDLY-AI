// src/components/auth/UserProfile.tsx

"use client";

import React from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
// FIX: Removed the direct import for 'app' and will get the auth instance globally.
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth'; 

export function UserProfile() {
  const { user, loading } = useUser();
  // FIX: getAuth() will use the default initialized Firebase app.
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      // The useUser hook will automatically detect the change and update the UI.
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
    return null; // Or show a login button
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.displayName || 'No display name'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <Button onClick={handleSignOut} className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
