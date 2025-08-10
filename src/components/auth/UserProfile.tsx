// src/components/auth/UserProfile.tsx

"use client";

import React from 'react';
import { useUser } from '@/hooks/use-user'; // Use the correct central hook
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

export function UserProfile() {
  // FIX: Get user and signOut function from the correct hook
  const { user, signOut, loading } = useUser();

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

  // Function to get initials from email for the avatar fallback
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
        <Button onClick={signOut} className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
